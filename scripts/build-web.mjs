import { mkdir, copyFile, access } from 'node:fs/promises';

const files = ['index.html', 'appwrite-config.js', 'manifest.json', 'sw.js', 'display.html'];
await mkdir('www', { recursive: true });
for (const file of files) {
  try {
    await access(file);
    await copyFile(file, `www/${file}`);
    console.log(`Copied ${file}`);
  } catch {
    if (file === 'index.html') throw new Error('Missing required index.html');
    console.log(`Skipped optional ${file}`);
  }
}
