import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { setAlwaysOnTop } from '@/lib/tauri'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'chatdesk.settings'
export const MIN_ZOOM = 0.75
export const MAX_ZOOM = 1.5

interface PersistedSettings {
  theme: ThemeMode
  zoom: number
  alwaysOnTop: boolean
  showToolbar: boolean
  showStatusBar: boolean
}

export const useSettingsStore = defineStore('settings', () => {
  /* --------------------------- 初始值 --------------------------- */
  // 在 store 创建时就同步读取，避免首屏闪烁
  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  function readPersisted(): Partial<PersistedSettings> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Partial<PersistedSettings>) : {}
    } catch {
      return {}
    }
  }

  const saved = readPersisted()

  /* ------------------------------ 状态 ------------------------------ */
  const theme = ref<ThemeMode>(
    saved.theme === 'light' || saved.theme === 'dark' || saved.theme === 'system'
      ? saved.theme
      : 'system',
  )
  const zoom = ref(typeof saved.zoom === 'number' ? saved.zoom : 1)
  const alwaysOnTop = ref(saved.alwaysOnTop === true)
  const showToolbar = ref(saved.showToolbar !== false)
  const showStatusBar = ref(saved.showStatusBar !== false)
  const systemDark = ref(prefersDark)

  /* ------------------------------ 派生 ------------------------------ */
  const resolvedTheme = computed<'light' | 'dark'>(() =>
    theme.value === 'system' ? (systemDark.value ? 'dark' : 'light') : theme.value,
  )
  const zoomPercent = computed(() => Math.round(zoom.value * 100))

  /* ------------------------------ 动作 ------------------------------ */
  function setTheme(value: ThemeMode) {
    theme.value = value
  }

  function setZoom(value: number) {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
    // 保留两位，避免 1.0000000001 这类浮点噪音
    zoom.value = Math.round(clamped * 100) / 100
  }

  function zoomIn() {
    setZoom(zoom.value + 0.05)
  }

  function zoomOut() {
    setZoom(zoom.value - 0.05)
  }

  function resetZoom() {
    setZoom(1)
  }

  function toggleAlwaysOnTop() {
    alwaysOnTop.value = !alwaysOnTop.value
  }

  function hydrate() {
    setZoom(zoom.value)

    // 跟随系统主题
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = mql.matches
    mql.addEventListener('change', (event) => {
      systemDark.value = event.matches
    })
  }

  /* --------------------------- 副作用同步 --------------------------- */
  // 主题落到 <html data-theme>
  watch(
    resolvedTheme,
    (value) => {
      document.documentElement.dataset.theme = value
    },
    { immediate: true },
  )

  // 设置持久化
  watch(
    [theme, zoom, alwaysOnTop, showToolbar, showStatusBar],
    () => {
      const data: PersistedSettings = {
        theme: theme.value,
        zoom: zoom.value,
        alwaysOnTop: alwaysOnTop.value,
        showToolbar: showToolbar.value,
        showStatusBar: showStatusBar.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    },
    { deep: true },
  )

  // 置顶交给窗口
  watch(alwaysOnTop, (value) => {
    void setAlwaysOnTop(value).catch(() => {})
  })

  return {
    theme,
    zoom,
    zoomPercent,
    alwaysOnTop,
    showToolbar,
    showStatusBar,
    resolvedTheme,
    setTheme,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleAlwaysOnTop,
    hydrate,
  }
})
