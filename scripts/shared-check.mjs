#!/usr/bin/env node
/**
 * Drift guard for the code shared between fluid_finance and fluid_finance_portal.
 *
 * `shared-files.json` in the repository root lists the paths that must be byte-identical in both
 * checkouts and where the sibling checkout lives. This script compares every listed file with the
 * sibling and exits 1 when any differ. With `--pull` (only where the manifest allows it) it copies
 * the sibling's version over the local one instead.
 *
 *   node scripts/shared-check.mjs          # compare
 *   node scripts/shared-check.mjs --pull   # copy from the sibling (portal only)
 *
 * This file is itself on the shared list, so keep it identical in both repositories.
 */
import { existsSync, readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, "shared-files.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const sibling = resolve(root, manifest.sibling);
const pull = process.argv.includes("--pull");

if (!existsSync(sibling)) {
    console.log(`shared-check: sibling checkout not found at ${sibling}; skipping (nothing to compare against).`);
    process.exit(0);
}
if (pull && !manifest.pullFromSibling) {
    console.error(`shared-check: --pull is not allowed here. ${manifest.sibling} is not the source of truth; run shared:pull in the other repository.`);
    process.exit(1);
}

const same = (a, b) => existsSync(a) && existsSync(b) && readFileSync(a).equals(readFileSync(b));
const problems = [];
let copied = 0;

for (const file of manifest.files) {
    const local = resolve(root, file);
    const theirs = resolve(sibling, file);
    if (same(local, theirs)) continue;
    if (pull) {
        if (!existsSync(theirs)) { problems.push(`${file}: missing in ${manifest.sibling}`); continue; }
        mkdirSync(dirname(local), { recursive: true });
        copyFileSync(theirs, local);
        copied++;
        console.log(`copied ${file}`);
        continue;
    }
    if (!existsSync(local)) problems.push(`${file}: missing here`);
    else if (!existsSync(theirs)) problems.push(`${file}: missing in ${manifest.sibling}`);
    else problems.push(`${file}: differs`);
}

if (problems.length) {
    console.error(`shared-check: ${problems.length} shared file(s) out of sync with ${manifest.sibling}:`);
    for (const line of problems) console.error(`  ${line}`);
    console.error(pull ? "Resolve the missing files by hand." : `Change shared code in ${manifest.source} first; in the other repository run \`npm run shared:pull\`, or diff the paths above.`);
    process.exit(1);
}
console.log(pull ? `shared-check: ${copied} file(s) copied from ${manifest.sibling}; ${manifest.files.length} now identical.` : `shared-check: ${manifest.files.length} shared files identical to ${manifest.sibling}.`);
