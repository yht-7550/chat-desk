<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { getRuntimeInfo } from '@/lib/tauri'

const app = useAppStore()
const settings = useSettingsStore()

const runtime = getRuntimeInfo()
const now = ref(Date.now())
let tick: number | undefined

onMounted(() => {
  tick = window.setInterval(() => (now.value = Date.now()), 1000)
})
onUnmounted(() => window.clearInterval(tick))

const loadedTime = computed(() => {
  if (!app.loadedAt) return '—'
  const diff = Math.max(0, Math.round((now.value - app.loadedAt) / 1000))
  if (diff < 5) return '刚刚'
  if (diff < 60) return `${diff} 秒前`
  const mins = Math.round(diff / 60)
  if (mins < 60) return `${mins} 分钟前`
  return new Date(app.loadedAt).toLocaleTimeString('zh-CN', { hour12: false })
})
</script>

<template>
  <footer class="statusbar">
    <div class="statusbar__left">
      <span class="dot" :class="app.error ? 'dot--err' : app.loading ? 'dot--busy' : 'dot--ok'" />
      <span class="statusbar__text">{{ app.statusText }}</span>
      <span class="statusbar__sep">·</span>
      <span class="statusbar__text">加载于 {{ loadedTime }}</span>
    </div>

    <div class="statusbar__center">
      <span>F5 刷新 · Ctrl +/- 缩放 · F11 全屏 · Ctrl , 设置</span>
    </div>

    <div class="statusbar__right">
      <span>{{ settings.zoomPercent }}%</span>
      <span class="statusbar__sep">·</span>
      <span>{{ runtime }}</span>
      <span class="statusbar__sep">·</span>
      <span>v{{ app.version }}</span>
    </div>
  </footer>
</template>

<style scoped>
.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: var(--statusbar-h);
  flex: none;
  padding: 0 12px;
  background: var(--panel-2);
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  white-space: nowrap;
}

.statusbar__left,
.statusbar__right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
}

.statusbar__center {
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.85;
}

.statusbar__sep {
  opacity: 0.5;
}

@media (max-width: 900px) {
  .statusbar__center {
    display: none;
  }
}
</style>
