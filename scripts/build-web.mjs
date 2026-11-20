import { mkdir, copyFile, access } from 'node:fs/promises';

await mkdir('www', { recursive: true });

// Supabase is the active backend. Keep the legacy Appwrite files in the
// repository for reference, but do not package or initialize them.
const files = ['index.html', 'manifest.json', 'sw.js', 'display.html', 'supabase-cloud.js'];
for (const file of files) {
  try {
    await access(file);
    await copyFile(file, `www/${file}`);
    console.log(`Copied ${file}`);
  } catch {
    if (file === 'index.html' || file === 'supabase-cloud.js') {
      throw new Error(`Missing required ${file}`);
    }
    console.log(`Skipped optional ${file}`);
  }
}

try {
  await access('supabase-config.example.js');
  await copyFile('supabase-config.example.js', 'www/supabase-config.js');
  console.log('Prepared public Supabase client config');
} catch {
  throw new Error('Missing supabase-config.example.js');
}
