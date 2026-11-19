import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const iconSvg = Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1024\" height=\"1024\" viewBox=\"0 0 1024 1024\">\n<rect width=\"1024\" height=\"1024\" rx=\"210\" fill=\"#050505\"/>\n<g fill=\"#fff\">\n<path d=\"M170 270h255c139 0 223 77 223 193S564 656 425 656H287v174H170V270zm117 105v176h131c75 0 112-31 112-88s-37-88-112-88H287z\"/>\n<circle cx=\"687\" cy=\"315\" r=\"54\"/>\n<path d=\"M634 405h106v425H634z\"/>\n<path d=\"M866 405H766c-82 0-132 43-132 111 0 61 42 96 119 102l83 7c26 2 38 12 38 29 0 20-17 31-47 31H649l-69 120h250c91 0 147-49 147-127 0-68-44-106-128-113l-79-7c-23-2-34-10-34-26 0-18 15-27 43-27h125l-38-100z\" transform=\"translate(-60 0)\"/>\n</g></svg>");
const foregroundSvg = Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"432\" height=\"432\" viewBox=\"0 0 432 432\">\n<g fill=\"#fff\">\n<path d=\"M64 104h108c59 0 94 33 94 82s-35 82-94 82h-59v74H64V104zm49 45v74h55c32 0 47-13 47-37s-15-37-47-37h-55z\"/>\n<circle cx=\"289\" cy=\"123\" r=\"23\"/>\n<path d=\"M266 162h46v180h-46z\"/>\n<path d=\"M360 162h-39c-35 0-56 18-56 47 0 26 18 41 51 44l35 3c11 1 16 5 16 13 0 9-7 13-20 13h-68l-29 51h106c39 0 63-21 63-54 0-29-19-45-55-48l-34-3c-10-1-14-4-14-11 0-8 6-12 18-12h53l-27-43z\" transform=\"translate(-13 0)\"/>\n</g></svg>");
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
const adaptive = name => `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@android:color/black" />\n    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>\n`;
await writeFile(`${adaptiveDir}/ic_launcher.xml`, adaptive('ic_launcher'));
await writeFile(`${adaptiveDir}/ic_launcher_round.xml`, adaptive('ic_launcher_round'));
console.log('Generated Pis launcher icons for all Android densities.');
