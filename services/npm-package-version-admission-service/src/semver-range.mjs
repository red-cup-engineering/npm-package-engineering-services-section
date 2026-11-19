/** npm version precedence and dependency range admission. */
const numericIdentifier = "(?:0|[1-9]\\d*)";
const prereleaseIdentifier = "(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)";
const suffix = "(?:-(" + prereleaseIdentifier + "(?:\\." + prereleaseIdentifier
  + ")*))?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?";
const component = numericIdentifier + "|[xX*]";
const version = new RegExp(
  "^(" + numericIdentifier + ")\\.(" + numericIdentifier + ")\\.(" + numericIdentifier + ")" + suffix + "$", "u",
);
const partialVersion = new RegExp(
  "^v?(" + component + ")(?:\\.(" + component + "))?(?:\\.(" + component + "))?" + suffix + "$", "u",
);
const at = (major, minor, patch, prerelease = []) => ({ major, minor, patch, prerelease });
const zero = at(0, 0, 0);
const empty = at(0, 0, 0, ["0"]);

/** Require the exact SemVer spelling used for source versions. */
export function isExactVersion(text) {
  return typeof text === "string" && version.exec(text)?.[0] === text;
}

/** Read a numeric-bounded npm version, including its optional v prefix. */
export function parseVersion(text) {
  if (typeof text !== "string" || text.length > 256) return null;
  const match = version.exec(text.trim().replace(/^v/u, ""));
  if (!match) return null;
  const [major, minor, patch] = match.slice(1, 4).map(Number);
  if (![major, minor, patch].every(Number.isSafeInteger)) return null;
  return at(major, minor, patch, match[4]?.split("."));
}

function compareIdentifier(left, right) {
  const leftNumeric = /^\d+$/u.test(left);
  const rightNumeric = /^\d+$/u.test(right);
  if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
  if (leftNumeric && left.length !== right.length) return left.length - right.length;
  return left < right ? -1 : left > right ? 1 : 0;
}

function compare(left, right) {
  for (const key of ["major", "minor", "patch"]) {
    if (left[key] !== right[key]) return left[key] - right[key];
  }
  if (!left.prerelease.length || !right.prerelease.length) {
    return right.prerelease.length - left.prerelease.length;
  }
  for (let index = 0; index < Math.min(left.prerelease.length, right.prerelease.length); index++) {
    const order = compareIdentifier(left.prerelease[index], right.prerelease[index]);
    if (order) return order;
  }
  return left.prerelease.length - right.prerelease.length;
}

/** Compare version precedence. Build metadata carries provenance only. */
export function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) throw new TypeError("Expected two npm versions");
  return compare(left, right);
}

/** A partial version uses null for each wildcard position. */
function readPartial(text) {
  if (text.length > 256) return null;
  const match = partialVersion.exec(text);
  if (!match) return null;
  const part = value => value === undefined || /^[xX*]$/u.test(value) ? null : Number(value);
  let [major, minor, patch] = match.slice(1, 4).map(part);
  if (![major, minor, patch].every(value => value === null || Number.isSafeInteger(value))) return null;
  if (major === null) minor = null;
  if (minor === null) patch = null;
  if (match[3] === undefined && (match[4] || text.includes("+"))) return null;
  return at(major, minor, patch, patch === null ? [] : match[4]?.split("."));
}

function nextPartial(major, minor, prerelease = ["0"]) {
  return minor === null ? at(major + 1, 0, 0, prerelease) : at(major, minor + 1, 0, prerelease);
}

function hyphenRange(left, right) {
  const low = readPartial(left);
  const high = readPartial(right);
  if (!low || !high) return null;
  const lower = [">=", at(low.major ?? 0, low.minor ?? 0, low.patch ?? 0, low.prerelease)];
  if (high.major === null) return [lower];
  return [lower, high.patch === null ? ["<", nextPartial(high.major, high.minor)] : ["<=", high]];
}

function comparator(operator, parsed) {
  const { major, minor, patch, prerelease } = parsed;
  if (major === null) return operator === "<" || operator === ">" ? [["<", empty]] : [];
  const low = at(major, minor ?? 0, patch ?? 0, prerelease);
  if (operator === "^") {
    let upper;
    if (major > 0 || minor === null) upper = nextPartial(major, null);
    else if (minor > 0 || patch === null) upper = nextPartial(major, minor);
    else upper = at(0, 0, patch + 1, ["0"]);
    return [[">=", low], ["<", upper]];
  }
  if (operator === "~" || operator === "~>") return [[">=", low], ["<", nextPartial(major, minor)]];
  if (operator === "=" && patch === null) return [[">=", low], ["<", nextPartial(major, minor)]];
  if (operator === ">" && patch === null) return [[">=", nextPartial(major, minor, [])]];
  if (operator === "<=" && patch === null) return [["<", nextPartial(major, minor)]];
  if (operator === "<" && patch === null) return [["<", at(major, minor ?? 0, 0, ["0"])]];
  return [[operator, low]];
}

function readComparatorSet(alternative) {
  const text = alternative.trim().replace(/(>=|<=|>|<|=|\^|~>?)\s+/gu, "$1");
  if (!text) return [];
  const hyphen = /^(\S+)\s+-\s+(\S+)$/u.exec(text);
  if (hyphen) return hyphenRange(hyphen[1], hyphen[2]);
  const set = [];
  for (const token of text.split(/\s+/u)) {
    const [, operator = "=", version] = /^(>=|<=|>|<|=|\^|~>?)?(.*)$/u.exec(token);
    const parsed = readPartial(version);
    if (!parsed) return null;
    set.push(...comparator(operator, parsed));
  }
  return set;
}

function rangeSets(range) {
  if (typeof range !== "string") return null;
  const sets = range.split("||").map(readComparatorSet);
  if (sets.some(set => set === null || set.some(([, bound]) => (
    ![bound.major, bound.minor, bound.patch].every(Number.isSafeInteger)
  )))) return null;
  const normalized = sets.map(set => set.filter(([operator, bound]) => operator !== ">=" || compare(bound, zero) !== 0));
  return normalized.some(set => set.length === 0) ? [[]] : normalized;
}

function matchesComparator(current, [operator, bound]) {
  const order = compare(current, bound);
  if (operator === "=") return order === 0;
  if (operator === ">=") return order >= 0;
  if (operator === "<=") return order <= 0;
  return operator === ">" ? order > 0 : order < 0;
}

function satisfiesSets(current, sets) {
  return sets.some(set => set.every(term => matchesComparator(current, term))
    && (!current.prerelease.length || set.some(([, bound]) => bound.prerelease.length
      && bound.major === current.major && bound.minor === current.minor && bound.patch === current.patch)));
}

/** Whether a version meets one of the range's alternatives. */
export function satisfies(current, range) {
  const parsed = typeof current === "string" ? parseVersion(current) : current;
  const sets = rangeSets(range);
  return Boolean(parsed && sets && satisfiesSets(parsed, sets));
}

/** Whether the input is an npm range, including unrestricted wildcards. */
export function isRange(range) {
  return rangeSets(range) !== null;
}

/** Exclude ranges npm normalizes to a wildcard, even inside a disjunction. */
export function isBoundedRange(range) {
  const sets = rangeSets(range);
  return sets !== null && sets.every(set => set.length > 0);
}

/** Read a single exact range, including npm's optional = and v prefixes. */
export function exactVersion(range) {
  if (typeof range !== "string") return null;
  const text = range.trim().replace(/^(?:=\s*)?v?/u, "");
  return isExactVersion(text) && parseVersion(text) ? text : null;
}

/** Whether a source range spells an explicit prerelease comparator. */
export const rangeNamesPrerelease = (range) => /\d+\.\d+\.\d+-[0-9A-Za-z]/u.test(String(range));

/** Choose the highest admitted version. Keep the first spelling at equal precedence. */
export function highestSatisfying(versions, range) {
  const sets = rangeSets(range);
  if (!sets) return null;
  let selected = null;
  let best;
  for (const candidate of versions) {
    const parsed = parseVersion(candidate);
    if (parsed && satisfiesSets(parsed, sets) && (!best || compare(parsed, best) > 0)) {
      selected = candidate;
      best = parsed;
    }
  }
  return selected;
}
