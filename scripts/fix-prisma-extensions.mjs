// scripts/fix-prisma-extensions.mjs
//
// Prisma 7's `prisma-client` generator emits relative imports without file
// extensions (e.g. `import * as $Class from "./internal/class"`). Node's
// native ESM loader (used by Vercel @vercel/node) refuses to resolve those,
// throwing ERR_MODULE_NOT_FOUND at module load.
//
// This script walks the generated Prisma client directory and rewrites every
// extensionless relative import (`./foo`, `../bar`) to include `.js`. It is
// idempotent — re-running it on already-rewritten files is a no-op.
//
// Run automatically after `prisma generate` via the `postinstall` script in
// package.json. Re-run manually after schema changes:
//   node scripts/fix-prisma-extensions.mjs

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const ROOT = join(process.cwd(), "prisma", "generated", "prisma");

// We need to know which sibling files actually exist to decide whether a
// specifier like "./class" resolves to "./class.js" or "./class.ts".
async function collectFiles(dir) {
  const out = new Set();
  async function walk(d) {
    const entries = await readdir(d, { withFileTypes: true });
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) {
        await walk(p);
      } else {
        out.add(p);
      }
    }
  }
  await walk(dir);
  return out;
}

function addJsIfMissing(specifier, fromFile, allFiles) {
  // Only touch relative imports — leave bare and absolute specifiers alone.
  if (!specifier.startsWith("./") && !specifier.startsWith("../")) return null;

  // Already has an extension we recognize — leave alone.
  if (/\.(js|ts|json|node)$/.test(specifier)) return null;

  const fromDir = join(fromFile, "..");
  const base = join(fromDir, specifier);

  // Pick whichever sibling actually exists, preferring .js (the runtime
  // artifact we care about) then .ts.
  for (const ext of [".js", ".ts"]) {
    if (allFiles.has(base + ext)) return specifier + ".js";
  }
  return null;
}

const IMPORT_RE =
  /(from\s+['"])(?:\.\.?\/[^'"]+)(['"])|(import\(\s*['"])(?:\.\.?\/[^'"]+)(['"])|(export\s+(?:\*\s+from|\{[^}]*\}\s+from)\s+['"])(?:\.\.?\/[^'"]+)(['"])/g;

async function processFile(file, allFiles) {
  const src = await readFile(file, "utf8");
  let changed = false;

  const out = src.replace(IMPORT_RE, (match, p1, p2, p3, p4, p5, p6) => {
    let prefix, spec, suffix;
    if (p1) {
      prefix = p1;
      spec = match.slice(p1.length, match.length - p2.length);
      suffix = p2;
    } else if (p3) {
      prefix = p3;
      spec = match.slice(p3.length, match.length - p4.length);
      suffix = p4;
    } else {
      prefix = p5;
      spec = match.slice(p5.length, match.length - p6.length);
      suffix = p6;
    }

    const fixed = addJsIfMissing(spec, file, allFiles);
    if (!fixed || fixed === spec) return match;
    changed = true;
    return prefix + fixed + suffix;
  });

  if (changed) {
    await writeFile(file, out, "utf8");
    const rel = relative(process.cwd(), file);
    console.log(`  patched ${rel}`);
  }
}

async function main() {
  try {
    const s = await stat(ROOT);
    if (!s.isDirectory()) {
      console.log(`[fix-prisma-extensions] ${ROOT} not found — skipping.`);
      return;
    }
  } catch {
    console.log(`[fix-prisma-extensions] ${ROOT} not found — skipping.`);
    return;
  }

  console.log("[fix-prisma-extensions] rewriting generated Prisma client…");
  const files = await collectFiles(ROOT);
  for (const f of files) {
    if (f.endsWith(".js") || f.endsWith(".ts")) {
      await processFile(f, files);
    }
  }
  console.log("[fix-prisma-extensions] done.");
}

main().catch((err) => {
  console.error("[fix-prisma-extensions] failed:", err);
  process.exit(1);
});