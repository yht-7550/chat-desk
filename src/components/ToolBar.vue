<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useAppStore } from '@/stores/app'
import { useSettingsStore, MAX_ZOOM, MIN_ZOOM } from '@/stores/settings'
import { useWindowStore } from '@/stores/window'
import { openExternal, setFullscreen, toggleDevtools } from '@/lib/tauri'

const emit = defineEmits<{ (e: 'open-settings'): void }>()

const app = useAppStore()
const settings = useSettingsStore()
const win = useWindowStore()

const isDev = import.meta.env.DEV
const canZoomIn = computed(() => settings.zoom < MAX_ZOOM)
const canZoomOut = computed(() => settings.zoom > MIN_ZOOM)

async function toggleFullscreen() {
  await setFullscreen(!win.fullscreen)
  await win.sync()
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__group">
      <button class="btn btn--icon" title="重新加载 (F5)" @click="app.reload()">
        <AppIcon name="reload" :class="{ spinning: app.loading }" />
      </button>
      <button
        class="btn btn--icon"
        title="在系统浏览器中打开"
        @click="openExternal(app.entry)"
      >
        <AppIcon name="external" />
      </button>
    </div>

    <div class="divider-v" />

    <div class="addressbar" :title="app.entry">
      <span class="addressbar__scheme">{{ app.entry.startsWith('http') ? 'http' : 'app' }}</span>
      <span class="addressbar__path">{{ app.entry.replace(/^https?:\/\/[^/]+/, '') }}</span>
      <span v-if="app.cacheBust" class="chip chip--accent addressbar__badge">已绕过缓存</span>
    </div>

    <div class="divider-v" />

    <div class="toolbar__group zoom">
      <button
        class="btn btn--icon"
        title="缩小 (Ctrl -)"
        :disabled="!canZoomOut"
        @click="settings.zoomOut()"
      >
        <AppIcon name="zoom-out" />
      </button>
      <button class="zoom__value" title="恢复 100%" @click="settings.resetZoom()">
        {{ settings.zoomPercent }}%
      </button>
      <button
        class="btn btn--icon"
        title="放大 (Ctrl +)"
        :disabled="!canZoomIn"
        @click="settings.zoomIn()"
      >
        <AppIcon name="zoom-in" />
      </button>
    </div>

    <div class="divider-v" />

    <div class="toolbar__group">
      <button
        class="btn btn--icon"
        :title="win.fullscreen ? '退出全屏 (F11)' : '全屏 (F11)'"
        @click="toggleFullscreen"
      >
        <AppIcon name="fullscreen" />
      </button>
      <button v-if="isDev" class="btn btn--icon" title="开发者工具 (F12)" @click="toggleDevtools">
        <AppIcon name="code" />
      </button>
      <button class="btn btn--icon" title="设置 (Ctrl ,)" @click="emit('open-settings')">
        <AppIcon name="settings" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  height: var(--toolbar-h);
  flex: none;
  padding: 0 8px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
}

.toolbar__group {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
}

.spinning {
  animation: spin 0.9s linear infinite;
}

/* ----------------------------- 地址栏 ----------------------------- */
.addressbar {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  margin: 0 6px;
  padding: 0 10px;
  border-radius: 99px;
  background: var(--panel-3);
  border: 1px solid transparent;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--text-2);
  overflow: hidden;
  transition: border-color 0.14s ease, background-color 0.14s ease;
}
.addressbar:hover {
  border-color: var(--border-strong);
  background: var(--panel-2);
}

.addressbar__scheme {
  color: var(--text-3);
  flex: none;
}
.addressbar__scheme::after {
  content: '://';
}

.addressbar__path {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: ltr;
}

.addressbar__badge {
  flex: none;
  height: 18px;
  font-family: var(--font);
  font-size: 10.5px;
}

/* ------------------------------ 缩放 ------------------------------ */
.zoom {
  gap: 0;
}

.zoom__value {
  min-width: 46px;
  height: 26px;
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--text-2);
}
.zoom__value:hover {
  background: var(--panel-3);
  color: var(--text);
}
</style>
