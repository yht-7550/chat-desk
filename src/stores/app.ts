import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getAppVersion } from '@/lib/tauri'

/** 静态产物的入口地址 */
export const WEBAPP_ENTRY =
  import.meta.env.VITE_WEBAPP_DEV_URL?.trim() ||
  import.meta.env.VITE_WEBAPP_PATH?.trim() ||
  '/webapp/index.html'

export const useAppStore = defineStore('app', () => {
  /** iframe 是否正在加载 */
  const loading = ref(true)
  /** 加载失败信息 */
  const error = ref<string | null>(null)
  /** 变更即强制重挂载 iframe */
  const frameKey = ref(0)
  /** 时间戳，用于绕过缓存 */
  const cacheBust = ref(0)
  /** 最近一次加载成功的时间 */
  const loadedAt = ref<number | null>(null)
  const version = ref('0.1.0')

  const entry = ref(WEBAPP_ENTRY)

  /** iframe 实际 src */
  const frameSrc = computed(() => {
    if (!cacheBust.value) return entry.value
    const sep = entry.value.includes('?') ? '&' : '?'
    return `${entry.value}${sep}_t=${cacheBust.value}`
  })

  const statusText = computed(() => {
    if (error.value) return '加载失败'
    if (loading.value) return '正在加载'
    return '已就绪'
  })

  function markLoading() {
    loading.value = true
    error.value = null
  }

  function markLoaded() {
    loading.value = false
    error.value = null
    loadedAt.value = Date.now()
  }

  function markError(message: string) {
    loading.value = false
    error.value = message
  }

  /** 普通刷新 */
  function reload() {
    markLoading()
    frameKey.value += 1
  }

  /** 忽略缓存刷新 */
  function hardReload() {
    cacheBust.value = Date.now()
    reload()
  }

  async function loadVersion() {
    try {
      version.value = await getAppVersion()
    } catch {
      /* 保持默认值 */
    }
  }

  return {
    loading,
    error,
    frameKey,
    cacheBust,
    loadedAt,
    version,
    entry,
    frameSrc,
    statusText,
    markLoading,
    markLoaded,
    markError,
    reload,
    hardReload,
    loadVersion,
  }
})
