/**
 * Tauri 桥接层。
 *
 * 设计原则：所有桌面能力都通过这里访问，并且都能在普通浏览器里安全降级，
 * 这样 `npm run dev` 直接用浏览器调试外壳 UI 也不会报错。
 */

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

type TauriWindow = import('@tauri-apps/api/window').Window

async function getWindow(): Promise<TauriWindow | null> {
  if (!isTauri()) return null
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  return getCurrentWindow()
}

/* ---------------------------- 窗口控制 ---------------------------- */

export async function minimizeWindow(): Promise<void> {
  await (await getWindow())?.minimize()
}

export async function toggleMaximizeWindow(): Promise<void> {
  await (await getWindow())?.toggleMaximize()
}

export async function closeWindow(): Promise<void> {
  await (await getWindow())?.close()
}

export async function setAlwaysOnTop(value: boolean): Promise<void> {
  await (await getWindow())?.setAlwaysOnTop(value)
}

export async function setFullscreen(value: boolean): Promise<void> {
  await (await getWindow())?.setFullscreen(value)
}

export async function isMaximized(): Promise<boolean> {
  const win = await getWindow()
  return win ? win.isMaximized() : false
}

export async function isFullscreen(): Promise<boolean> {
  const win = await getWindow()
  return win ? win.isFullscreen() : false
}

export async function startDragging(): Promise<void> {
  await (await getWindow())?.startDragging()
}

/** 监听窗口尺寸变化（最大化状态需要靠它同步） */
export async function onWindowResized(cb: () => void): Promise<() => void> {
  const win = await getWindow()
  if (!win) return () => {}
  return win.onResized(() => cb())
}

/* ---------------------------- 系统集成 ---------------------------- */

/** 用系统默认浏览器打开链接 */
export async function openExternal(url: string): Promise<void> {
  if (!isTauri()) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  const { openUrl } = await import('@tauri-apps/plugin-opener')
  await openUrl(url)
}

/** 开发者工具（仅 debug 构建可用，release 下会返回错误） */
export async function toggleDevtools(): Promise<void> {
  if (!isTauri()) return
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('toggle_devtools')
}

export async function getAppVersion(): Promise<string> {
  if (!isTauri()) return '0.1.0'
  const { getVersion } = await import('@tauri-apps/api/app')
  return getVersion()
}

/** 运行环境描述，用于状态栏 / 关于面板 */
export function getRuntimeInfo(): string {
  const ua = navigator.userAgent
  const engine = /Edg\//.test(ua) ? 'WebView2' : /Chrome\//.test(ua) ? 'Chromium' : 'WebKit'
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown'
  return `${isTauri() ? 'Tauri' : 'Browser'} · ${engine} · ${os}`
}
