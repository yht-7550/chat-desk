import { ref } from 'vue'
import { defineStore } from 'pinia'
import { isFullscreen, isMaximized, onWindowResized } from '@/lib/tauri'

export const useWindowStore = defineStore('window', () => {
  const maximized = ref(false)
  const fullscreen = ref(false)

  async function sync() {
    maximized.value = await isMaximized()
    fullscreen.value = await isFullscreen()
  }

  let dispose: (() => void) | null = null

  async function init() {
    await sync()
    dispose = await onWindowResized(() => {
      void sync()
    })
  }

  function destroy() {
    dispose?.()
    dispose = null
  }

  return { maximized, fullscreen, sync, init, destroy }
})
