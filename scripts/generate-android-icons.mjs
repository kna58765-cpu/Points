import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const iconSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<rect width="1024" height="1024" rx="220" fill="#050505"/>
<text x="512" y="540" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="270" font-weight="800" letter-spacing="-12" fill="#ffffff">PIS</text>
</svg>`);
const foregroundSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432" viewBox="0 0 432 432">
<text x="216" y="216" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="120" font-weight="800" letter-spacing="-5" fill="#ffffff">PIS</text>
</svg>`);
const root = 'android/app/src/main/res';
const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [density, size] of Object.entries(densities)) {
  const dir = `${root}/mipmap-${density}`;
  await mkdir(dir, { recursive: true });
  await sharp(iconSvg).resize(size, size).png().toFile(`${dir}/ic_launcher.png`);
  await sharp(iconSvg).resize(size, size).png().toFile(`${dir}/ic_launcher_round.png`);
  await sharp(foregroundSvg).resize(Math.round(size * 2.25), Math.round(size * 2.25)).png().toFile(`${dir}/ic_launcher_foreground.png`);
}
const adaptiveDir = `${root}/mipmap-anydpi-v26`;
await mkdir(adaptiveDir, { recursive: true });
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@android:color/black" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
await writeFile(`${adaptiveDir}/ic_launcher.xml`, adaptive);
await writeFile(`${adaptiveDir}/ic_launcher_round.xml`, adaptive);
console.log('Generated black-and-white PIS launcher icons for all Android densities.');
