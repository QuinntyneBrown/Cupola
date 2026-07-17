// Optimizes the marketing screenshot masters into modern, web-ready formats.
// For every PNG master in marketing/assets/shots/src/ this emits a full-width
// AVIF and WebP into marketing/assets/shots/. The Open Graph image stays a PNG
// (it lives in marketing/assets/og/ and is not read here). Run after
// `npm run shots`:
//
//   npm run shots:optimize
//
import { mkdir, readdir, stat } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(here, '../../..');
const srcDir = join(repoRoot, 'marketing', 'assets', 'shots', 'src');
const outDir = join(repoRoot, 'marketing', 'assets', 'shots');

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

async function main() {
  await mkdir(outDir, { recursive: true });

  let entries;
  try {
    entries = await readdir(srcDir);
  } catch {
    console.log(`No masters directory yet (${srcDir}). Run "npm run shots" first.`);
    return;
  }

  const masters = entries.filter((file) => file.toLowerCase().endsWith('.png'));
  if (masters.length === 0) {
    console.log(`No PNG masters found in ${srcDir}. Run "npm run shots" first.`);
    return;
  }

  // Encodes are independent; libvips releases the JS thread, so run them all.
  const lines = await Promise.all(
    masters.map(async (file) => {
      const name = basename(file, extname(file));
      const input = join(srcDir, file);
      const avifOut = join(outDir, `${name}.avif`);
      const webpOut = join(outDir, `${name}.webp`);

      await Promise.all([
        sharp(input).avif({ quality: 50, effort: 6 }).toFile(avifOut),
        sharp(input).webp({ quality: 80 }).toFile(webpOut),
      ]);

      const [master, avif, webp] = await Promise.all([stat(input), stat(avifOut), stat(webpOut)]);
      return `${name}: png ${formatKb(master.size)} -> avif ${formatKb(avif.size)}, webp ${formatKb(webp.size)}`;
    }),
  );
  for (const line of lines.sort()) {
    console.log(line);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
