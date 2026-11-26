<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useAppStore } from '@/stores/app'
import { useWindowStore } from '@/stores/window'
import { closeWindow, isTauri, minimizeWindow, toggleMaximizeWindow } from '@/lib/tauri'

const app = useAppStore()
const win = useWindowStore()
const inTauri = isTauri()

const maximizeIcon = computed(() => (win.maximized ? 'restore' : 'maximize'))
</script>

<template>
  <header class="titlebar">
    <div class="titlebar__brand" data-tauri-drag-region>
      <span class="brand-mark" data-tauri-drag-region>
        <img src="/logo.svg" alt="ChatDesk" width="18" height="18" draggable="false" />
      </span>
      <span class="brand-name" data-tauri-drag-region>ChatDesk</span>
      <span class="brand-sep" data-tauri-drag-region>·</span>
      <span class="brand-title" data-tauri-drag-region>{{ app.entry }}</span>
    </div>

    <div class="titlebar__drag" data-tauri-drag-region />

    <div class="titlebar__status" data-tauri-drag-region>
      <span
        class="dot"
        :class="app.error ? 'dot--err' : app.loading ? 'dot--busy' : 'dot--ok'"
        data-tauri-drag-region
      />
      <span class="titlebar__status-text" data-tauri-drag-region>{{ app.statusText }}</span>
    </div>

    <div v-if="inTauri" class="win-controls">
      <button class="win-btn" title="最小化" @click="minimizeWindow">
        <AppIcon name="minimize" :size="15" />
      </button>
      <button
        class="win-btn"
        :title="win.maximized ? '还原' : '最大化'"
        @click="toggleMaximizeWindow"
      >
        <AppIcon :name="maximizeIcon" :size="14" />
      </button>
      <button class="win-btn win-btn--close" title="关闭" @click="closeWindow">
        <AppIcon name="close" :size="15" />
      </button>
    </div>
    <div v-else class="win-controls win-controls--preview">
      <span class="chip">浏览器预览模式</span>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  height: var(--titlebar-h);
  flex: none;
  padding-left: 12px;
  background: var(--panel-2);
  border-bottom: 1px solid var(--border);
  /* 拖拽区域由 data-tauri-drag-region 声明 */
}

.titlebar__brand {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--accent-soft);
  flex: none;
}

.brand-name {
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--text);
}

.brand-sep {
  color: var(--text-3);
  font-size: 11px;
}

.brand-title {
  font-size: 11.5px;
  color: var(--text-3);
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40vw;
}

.titlebar__drag {
  flex: 1;
  align-self: stretch;
}

.titlebar__status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  font-size: 11.5px;
  color: var(--text-3);
}

.win-controls {
  display: flex;
  align-items: stretch;
  align-self: stretch;
}

.win-controls--preview {
  align-items: center;
  padding-right: 10px;
}

.win-btn {
  width: 46px;
  display: grid;
  place-items: center;
  color: var(--text-2);
  transition: background-color 0.12s ease, color 0.12s ease;
}
.win-btn:hover {
  background: var(--panel-3);
  color: var(--text);
}
.win-btn--close:hover {
  background: var(--danger);
  color: #fff;
}
</style>
