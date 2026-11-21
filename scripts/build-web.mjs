import { mkdir, copyFile, access } from 'node:fs/promises';
import { build } from 'esbuild';

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

// Bundle the Supabase SDK into the app. Never fetch esm.sh at runtime: that
// CDN can be unreachable on VPN-free mobile networks and leave the splash stuck.
await build({
  entryPoints: ['supabase-cloud.js'],
  outfile: 'www/supabase-cloud.js',
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: ['es2020'],
  minify: true,
  // Keep the project URL and publishable key as a small local config module.
  // The config is copied into www/ before bundling, so it must remain external.
  external: ['./supabase-config.js'],
});
console.log('Bundled Supabase SDK locally (no runtime CDN request)');
