import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/pack-npm-package.mjs", import.meta.url));
function run(args, input = "") {
  const result = spawnSync(process.execPath, [script, ...args], { input, encoding: "utf8", timeout: 10000 });
  assert.equal(result.error, undefined, "native CLI must terminate");
  return result;
}

test("native help and short help expose the actual callable without consuming input", () => {
  for (const args of [["--help"], ["-h"]]) {
    const result = run(args, "not valid JSON\n");
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /packNpmPackage/u);
  }
});

test("native strict arguments refuse unknown options, values and positionals", () => {
  for (const args of [["--unknown"], ["--help=yes"], ["unexpected"], ["--", "unexpected"]]) {
    const result = run(args);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /ERR_PARSE_ARGS/u);
  }
});

test("no help processes the original JSONL stream and malformed requests still refuse", () => {
  const empty = run([]);
  assert.equal(empty.status, 0, empty.stderr);
  assert.equal(empty.stdout, "");
  const invalid = run([], "{}\n");
  assert.notEqual(invalid.status, 0);
  assert.equal(invalid.stdout, "");
  assert.match(invalid.stderr, /request|fields/iu);
});
