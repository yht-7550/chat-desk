<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import TitleBar from './components/TitleBar.vue'
import ToolBar from './components/ToolBar.vue'
import WebAppFrame from './components/WebAppFrame.vue'
import StatusBar from './components/StatusBar.vue'
import SettingsDrawer from './components/SettingsDrawer.vue'
import { useAppStore } from './stores/app'
import { useSettingsStore } from './stores/settings'
import { useWindowStore } from './stores/window'
import { setFullscreen, toggleDevtools } from './lib/tauri'

const app = useAppStore()
const settings = useSettingsStore()
const win = useWindowStore()

const settingsOpen = ref(false)

async function toggleFullscreen() {
  await setFullscreen(!win.fullscreen)
  await win.sync()
}

function onKeydown(event: KeyboardEvent) {
  const mod = event.ctrlKey || event.metaKey
  const key = event.key.toLowerCase()

  if (event.key === 'F5' || (mod && key === 'r')) {
    event.preventDefault()
    if (mod && event.shiftKey) app.hardReload()
    else app.reload()
    return
  }
  if (event.key === 'F11') {
    event.preventDefault()
    void toggleFullscreen()
    return
  }
  if (event.key === 'F12' || (mod && event.shiftKey && key === 'i')) {
    event.preventDefault()
    void toggleDevtools()
    return
  }
  if (mod && event.key === ',') {
    event.preventDefault()
    settingsOpen.value = !settingsOpen.value
    return
  }
  if (mod && (event.key === '=' || event.key === '+')) {
    event.preventDefault()
    settings.zoomIn()
    return
  }
  if (mod && event.key === '-') {
    event.preventDefault()
    settings.zoomOut()
    return
  }
  if (mod && event.key === '0') {
    event.preventDefault()
    settings.resetZoom()
    return
  }
  if (event.key === 'Escape' && settingsOpen.value) {
    settingsOpen.value = false
  }
}

onMounted(async () => {
  settings.hydrate()
  window.addEventListener('keydown', onKeydown)
  await Promise.all([app.loadVersion(), win.init()])
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  win.destroy()
})
</script>

<template>
  <div class="shell" :class="{ 'shell--maximized': win.maximized || win.fullscreen }">
    <TitleBar />
    <ToolBar v-if="settings.showToolbar" @open-settings="settingsOpen = true" />
    <WebAppFrame />
    <StatusBar v-if="settings.showStatusBar" />
    <SettingsDrawer v-model:open="settingsOpen" />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  /* 无边框窗口：用 1px 描边勾勒边界，最大化时去掉避免溢出 */
  box-shadow: inset 0 0 0 1px var(--border-strong);
}

.shell--maximized {
  box-shadow: none;
}
</style>
