/** Original source-root/output-custody safeguard for portable runtime images.
 * Validate the real parent ancestry BEFORE even creating directories. This
 * standalone operation has no registry, cloud, privileged execution or funds.
 */
import { realpath } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, sep } from "node:path";

function nestedWithin(root, destination) {
  const delta = relative(root, destination);
  return delta === "" || (delta !== ".." && !delta.startsWith(`..${sep}`) && !isAbsolute(delta));
}
export function refuseProtectedOutput(destination, roots) {
  if (roots.some(root => nestedWithin(root, destination)))
    throw new TypeError("outputDirectory aliases protected runtime catalog or release territory");
}
export async function projectedOutputDestination(requested, protectedRoots) {
  // Resolve the nearest EXISTING ancestor before mkdir: an alias hidden in
  // an old parent symlink must not create even empty directories in a release.
  let ancestor = dirname(requested);
  const missing = [];
  for (;;) {
    try {
      const actualAncestor = await realpath(ancestor);
      const projected = join(actualAncestor, ...missing, basename(requested));
      refuseProtectedOutput(projected, protectedRoots);
      return projected;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = dirname(ancestor);
      if (parent === ancestor) throw error;
      missing.unshift(basename(ancestor));
      ancestor = parent;
    }
  }
}

