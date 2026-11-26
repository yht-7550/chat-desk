<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import Switch from './Switch.vue'
import { useAppStore } from '@/stores/app'
import { useSettingsStore, type ThemeMode } from '@/stores/settings'
import { getRuntimeInfo, openExternal, toggleDevtools } from '@/lib/tauri'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

const app = useAppStore()
const settings = useSettingsStore()

const isDev = import.meta.env.DEV
const runtime = getRuntimeInfo()

const themes: { value: ThemeMode; label: string; icon: 'monitor' | 'sun' | 'moon' }[] = [
  { value: 'system', label: '跟随系统', icon: 'monitor' },
  { value: 'light', label: '浅色', icon: 'sun' },
  { value: 'dark', label: '深色', icon: 'moon' },
]

const zoomValue = computed({
  get: () => settings.zoomPercent,
  set: (value: number) => settings.setZoom(value / 100),
})

function close() {
  emit('update:open', false)
}

function onZoomInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) settings.setZoom(value / 100)
}

function doReload() {
  app.reload()
  close()
}

function doHardReload() {
  app.hardReload()
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="props.open" class="drawer-root">
        <div class="drawer-mask" @click="close" />

        <aside class="drawer" role="dialog" aria-label="设置">
          <header class="drawer__head">
            <h2 class="drawer__title">设置</h2>
            <button class="btn btn--icon" title="关闭" @click="close">
              <AppIcon name="close" />
            </button>
          </header>

          <div class="drawer__body">
            <!-- 外观 -->
            <section class="section">
              <h3 class="section__title">外观</h3>
              <div class="segmented">
                <button
                  v-for="item in themes"
                  :key="item.value"
                  class="segmented__item"
                  :class="{ 'segmented__item--active': settings.theme === item.value }"
                  @click="settings.setTheme(item.value)"
                >
                  <AppIcon :name="item.icon" :size="15" />
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </section>

            <!-- 显示 -->
            <section class="section">
              <h3 class="section__title">显示</h3>

              <div class="row">
                <div class="row__main">
                  <span class="row__label">产物缩放</span>
                  <span class="row__desc">只缩放内嵌产物，外壳保持清晰</span>
                </div>
                <span class="row__value">{{ settings.zoomPercent }}%</span>
              </div>
              <input
                class="slider"
                type="range"
                min="75"
                max="150"
                step="5"
                :value="zoomValue"
                @input="onZoomInput"
              />

              <div class="row">
                <div class="row__main">
                  <span class="row__label">显示工具栏</span>
                  <span class="row__desc">地址栏与操作按钮</span>
                </div>
                <Switch v-model="settings.showToolbar" label="显示工具栏" />
              </div>

              <div class="row">
                <div class="row__main">
                  <span class="row__label">显示状态栏</span>
                  <span class="row__desc">底部状态与版本信息</span>
                </div>
                <Switch v-model="settings.showStatusBar" label="显示状态栏" />
              </div>
            </section>

            <!-- 窗口 -->
            <section class="section">
              <h3 class="section__title">窗口</h3>
              <div class="row">
                <div class="row__main">
                  <span class="row__label">总在最前</span>
                  <span class="row__desc">窗口保持在其他应用之上</span>
                </div>
                <Switch v-model="settings.alwaysOnTop" label="总在最前" />
              </div>
            </section>

            <!-- 维护 -->
            <section class="section">
              <h3 class="section__title">维护</h3>
              <div class="actions">
                <button class="btn btn--ghost-border" @click="doReload">
                  <AppIcon name="reload" :size="14" />
                  <span>重新加载</span>
                </button>
                <button class="btn btn--ghost-border" @click="doHardReload">
                  <AppIcon name="trash" :size="14" />
                  <span>忽略缓存重载</span>
                </button>
                <button class="btn btn--ghost-border" @click="openExternal(app.entry)">
                  <AppIcon name="external" :size="14" />
                  <span>浏览器打开</span>
                </button>
                <button v-if="isDev" class="btn btn--ghost-border" @click="toggleDevtools">
                  <AppIcon name="code" :size="14" />
                  <span>开发者工具</span>
                </button>
              </div>
            </section>

            <!-- 关于 -->
            <section class="section">
              <h3 class="section__title">关于</h3>
              <dl class="meta">
                <div class="meta__row">
                  <dt>应用</dt>
                  <dd>ChatDesk v{{ app.version }}</dd>
                </div>
                <div class="meta__row">
                  <dt>运行时</dt>
                  <dd>{{ runtime }}</dd>
                </div>
                <div class="meta__row">
                  <dt>产物入口</dt>
                  <dd class="meta__mono">{{ app.entry }}</dd>
                </div>
              </dl>
            </section>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-root {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.drawer-mask {
  position: absolute;
  inset: 0;
  background: rgba(10, 12, 16, 0.28);
  backdrop-filter: blur(1.5px);
}

.drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 340px;
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
}

.drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  flex: none;
  padding: 0 10px 0 18px;
  border-bottom: 1px solid var(--border);
}

.drawer__title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
}

.drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 18px 24px;
}

/* ------------------------------ 区块 ------------------------------ */
.section {
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}
.section:last-child {
  border-bottom: 0;
}

.section__title {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-3);
}

/* ---------------------------- 分段控件 ---------------------------- */
.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 3px;
  border-radius: var(--radius);
  background: var(--panel-3);
}

.segmented__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 4px;
  border-radius: 7px;
  font-size: 11.5px;
  color: var(--text-2);
  transition: background-color 0.14s ease, color 0.14s ease;
}
.segmented__item:hover {
  color: var(--text);
}
.segmented__item--active {
  background: var(--panel);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

/* ------------------------------ 行 ------------------------------ */
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
}

.row__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.row__label {
  font-size: 12.5px;
  color: var(--text);
}

.row__desc {
  font-size: 11px;
  color: var(--text-3);
}

.row__value {
  font-size: 12px;
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}

/* ----------------------------- 滑块 ----------------------------- */
.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  margin: 2px 0 10px;
  border-radius: 99px;
  background: var(--panel-3);
  outline: none;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--panel);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}

/* ----------------------------- 操作 ----------------------------- */
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.actions .btn {
  justify-content: flex-start;
  height: 34px;
  font-size: 12px;
}

/* ----------------------------- 元信息 ----------------------------- */
.meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta__row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  font-size: 11.5px;
}

.meta__row dt {
  color: var(--text-3);
  flex: none;
}

.meta__row dd {
  margin: 0;
  color: var(--text-2);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta__mono {
  font-family: var(--font-mono);
  font-size: 11px;
}

/* ---------------------------- 过渡动画 ---------------------------- */
.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-enter-active .drawer-mask,
.drawer-leave-active .drawer-mask {
  transition: opacity 0.22s ease;
}
.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(100%);
}
.drawer-enter-from .drawer-mask,
.drawer-leave-to .drawer-mask {
  opacity: 0;
}
</style>
