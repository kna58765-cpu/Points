import { mkdir, copyFile, access } from 'node:fs/promises';

await mkdir('www', { recursive: true });

const files = ['index.html', 'manifest.json', 'sw.js', 'display.html', 'appwrite.js'];
for (const file of files) {
  try {
    await access(file);
    await copyFile(file, `www/${file}`);
    console.log(`Copied ${file}`);
  } catch {
    if (file === 'index.html' || file === 'appwrite.js') {
      throw new Error(`Missing required ${file}`);
    }
    console.log(`Skipped optional ${file}`);
  }
}

// The example contains only public Appwrite endpoint/project/database identifiers.
// Never place an Appwrite API key or server secret in this client-side file.
try {
  await access('appwrite-config.example.js');
  await copyFile('appwrite-config.example.js', 'www/appwrite-config.js');
  console.log('Prepared public Appwrite client config');
} catch {
  throw new Error('Missing appwrite-config.example.js');
}
