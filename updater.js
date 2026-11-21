import { FileTransfer } from '@capacitor/file-transfer';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

const APP_VERSION = 'T081';
const REPOSITORY = 'kna58765-cpu/Points';
const RELEASE_API = 'https://api.github.com/repos/' + REPOSITORY + '/releases/latest';
const T081_NOTES = '• 修复更新包签名校验与下载完整性检查\n• 保持固定签名，支持后续版本覆盖更新\n• 优化更新状态提示，避免将下载或打开安装器误报为安装成功\n• 修复上一代更新流程中的边界问题';

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
  if (!asset) throw new Error('正式版本 ' + expected + ' 尚未上传 APK 安装包。已留在 POINTS 内，没有打开任何网站。');
  return { updateAvailable: true, version: expected, notes: String(release.body || '').trim(), sizeText: formatSize(asset.size), size: Number(asset.size || 0), assetName: asset.name, downloadUrl: asset.browser_download_url, releaseUrl: release.html_url, publishedAt: release.published_at || '' };
}
export async function downloadUpdate(release, onProgress = () => {}) {
  if (!window.Capacitor?.isNativePlatform?.()) throw new Error('应用内 APK 安装仅支持 Android 正式应用环境。');
  if (!release?.downloadUrl || !String(release.downloadUrl).startsWith('https://') || !/\.apk$/i.test(release.assetName || '')) throw new Error('官方 APK 文件信息无效，已取消下载。');
  const path = 'POINTS-' + release.version + '.apk';
  const target = await Filesystem.getUri({ directory: Directory.Cache, path });
  onProgress({ phase: 'downloading', percent: 0, message: '正在从官方仓库下载 APK…' });
  const listener = await FileTransfer.addListener('progress', event => {
    const total = Number(event.contentLength || release.size || 0);
    const percent = total > 0 ? Math.min(99, Math.floor(Number(event.bytes || 0) / total * 100)) : 0;
    onProgress({ phase: 'downloading', percent, message: total > 0 ? '正在下载 APK… ' + percent + '%' : '正在下载官方 APK…' });
  });
  try {
    await Filesystem.deleteFile({ directory: Directory.Cache, path }).catch(() => {});
    await FileTransfer.downloadFile({ url: release.downloadUrl, path: target.uri, progress: true });
  } finally {
    await listener.remove().catch(() => {});
  }
  const stat = await Filesystem.stat({ directory: Directory.Cache, path });
  if (!stat.size || (release.size && Number(stat.size) !== Number(release.size))) {
    await Filesystem.deleteFile({ directory: Directory.Cache, path }).catch(() => {});
    throw new Error('APK 文件完整性校验失败，旧版本未受影响，请重新下载。');
  }
  const pending = { version: release.version, notes: release.notes || '', assetName: release.assetName, requestedAt: Date.now() };
  localStorage.setItem('points.pendingUpdate', JSON.stringify(pending));
  onProgress({ phase: 'install_requested', percent: 100, message: 'APK 已下载并校验，正在打开 Android 安装器…' });
  try {
    await FileOpener.open({ filePath: target.uri, contentType: 'application/vnd.android.package-archive', openWithDefault: true });
  } catch (error) {
    localStorage.removeItem('points.pendingUpdate');
    throw new Error('无法打开 Android 安装器。请检查系统是否允许安装此应用下载的 APK，然后重试。');
  }
  onProgress({ phase: 'install_requested', percent: 100, message: '已请求打开 Android 安装器，请在系统弹窗中点击「更新」完成安装。' });
  return { downloaded: true, path: target.uri, installRequested: true };
}
export function consumeInstalledUpdate() {
  let pending = null;
  try { pending = JSON.parse(localStorage.getItem('points.pendingUpdate') || 'null'); } catch {}
  const installed = localStorage.getItem('points.installedVersion') || '';
  let info = null;

  // Opening Android's installer is only a request, not proof that the user
  // completed installation. Show the success animation only after the app
  // starts with a version different from the version recorded on last launch.
  if (installed && installed !== APP_VERSION) {
    info = pending?.version === APP_VERSION
      ? pending
      : { version: APP_VERSION, notes: T081_NOTES };
  }

  // A cancelled installation must not leave a stale "pending" success notice.
  localStorage.removeItem('points.pendingUpdate');
  localStorage.setItem('points.installedVersion', APP_VERSION);
  return info;
}
