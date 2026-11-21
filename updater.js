import { Browser } from '@capacitor/browser';

const APP_VERSION = 'T075';
const REPOSITORY = 'kna58765-cpu/Points';
const RELEASE_API = 'https://api.github.com/repos/' + REPOSITORY + '/releases/latest';
const T075_NOTES = '• 新增独立账号页面\n• 新增 GitHub 正式版手动检查更新\n• 新增 APK 下载与版本升级提示\n• 新增底部弹出的更新完成动画\n• 优化账号信息与页面体验';

function versionNumber(value) {
  const match = String(value || '').match(/T?(\d+)/i);
  return match ? Number(match[1]) : 0;
}
function formatSize(bytes) {
  const n = Number(bytes || 0);
  return n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
}
export async function checkForUpdate() {
  const response = await fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
  if (response.status === 404) throw new Error('官方还没有发布正式版本，请稍后再检查。');
  if (!response.ok) throw new Error('GitHub 暂时无法访问（' + response.status + '），请稍后重试。');
  const release = await response.json();
  if (release.draft || release.prerelease) throw new Error('当前版本不是正式发布版，已忽略。');
  const tag = String(release.tag_name || release.name || '');
  const latestNumber = versionNumber(tag);
  const currentNumber = versionNumber(APP_VERSION);
  if (!latestNumber) throw new Error('正式版本标签格式不正确，无法识别版本号。');
  if (latestNumber <= currentNumber) return { updateAvailable: false, currentVersion: APP_VERSION };
  const expected = 'T' + String(latestNumber).padStart(3, '0');
  const apkAssets = (release.assets || []).filter(asset => /\.apk$/i.test(asset.name || '') && asset.browser_download_url);
  const asset = apkAssets.find(item => item.name.toUpperCase().includes(expected)) || (apkAssets.length === 1 ? apkAssets[0] : null);
  if (!asset) throw new Error('正式版本 ' + expected + ' 尚未上传可安装 APK，请联系发布者。');
  return { updateAvailable: true, version: expected, notes: String(release.body || '').trim(), sizeText: formatSize(asset.size), assetName: asset.name, downloadUrl: asset.browser_download_url, releaseUrl: release.html_url, publishedAt: release.published_at || '' };
}
export async function downloadUpdate(release) {
  if (!release?.downloadUrl || !String(release.downloadUrl).startsWith('https://')) throw new Error('APK 下载地址无效。');
  localStorage.setItem('points.pendingUpdate', JSON.stringify({ version: release.version, notes: release.notes || '', assetName: release.assetName || '', releaseUrl: release.releaseUrl || '', requestedAt: Date.now() }));
  if (window.Capacitor?.isNativePlatform?.()) await Browser.open({ url: release.downloadUrl });
  else window.open(release.downloadUrl, '_blank', 'noopener');
}
export function consumeInstalledUpdate() {
  let pending = null;
  try { pending = JSON.parse(localStorage.getItem('points.pendingUpdate') || 'null'); } catch {}
  const installed = localStorage.getItem('points.installedVersion') || '';
  let info = null;
  if (pending?.version === APP_VERSION) info = pending;
  else if (!installed && APP_VERSION === 'T075') info = { version: APP_VERSION, notes: T075_NOTES };
  else if (installed && installed !== APP_VERSION) info = { version: APP_VERSION, notes: T075_NOTES };
  localStorage.removeItem('points.pendingUpdate');
  localStorage.setItem('points.installedVersion', APP_VERSION);
  return info;
}
