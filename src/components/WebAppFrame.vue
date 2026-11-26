<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { openExternal } from '@/lib/tauri'

const app = useAppStore()
const settings = useSettingsStore()

const frameRef = ref<HTMLIFrameElement | null>(null)
let timer: number | undefined

/** 缩放通过「放大画布 + transform 缩小」实现，不侵入产物内部文档 */
const frameStyle = computed(() => {
  const z = settings.zoom
  return {
    width: `${100 / z}%`,
    height: `${100 / z}%`,
    transform: `scale(${z})`,
  }
})

const LOAD_TIMEOUT = 15000

watch(
  () => app.loading,
  (loading) => {
    window.clearTimeout(timer)
    if (!loading) return
    timer = window.setTimeout(() => {
      if (app.loading) {
        app.markError('加载超时。请确认静态产物已放入 public/webapp 且入口为 index.html。')
      }
    }, LOAD_TIMEOUT)
  },
)

onMounted(() => {
  if (app.loading) {
    timer = window.setTimeout(() => {
      if (app.loading) app.markError('加载超时。请确认静态产物已放入 public/webapp。')
    }, LOAD_TIMEOUT)
  }
})

onUnmounted(() => window.clearTimeout(timer))

function onLoad() {
  app.markLoaded()
  hookFrameDocument()
}

/**
 * 产物与外壳同源，因此可以「礼貌地」介入它的文档：
 * 1. 外链交给系统浏览器，而不是在应用内打开新窗口；
 * 2. 把快捷键事件转给外壳，避免焦点在产物里时快捷键失效。
 * 跨域场景（VITE_WEBAPP_DEV_URL 指向别处）会静默跳过。
 */
function hookFrameDocument() {
  const frame = frameRef.value
  if (!frame) return

  let doc: Document | null = null
  try {
    doc = frame.contentDocument
  } catch {
    doc = null
  }
  if (!doc) return

  doc.addEventListener(
    'click',
    (event) => {
      const target = event.target as HTMLElement | null
      const anchor = target?.closest?.('a') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href')?.trim()
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return

      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }

      const isExternal = url.origin !== window.location.origin
      if (isExternal || anchor.target === '_blank') {
        event.preventDefault()
        void openExternal(url.href)
      }
    },
    true,
  )

  doc.addEventListener(
    'keydown',
    (event) => {
      const key = event.key
      const mod = event.ctrlKey || event.metaKey
      if (!mod && !/^F\d{1,2}$/.test(key)) return
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    true,
  )
}
</script>

<template>
  <div class="stage">
    <div class="frame-wrap" :style="frameStyle">
      <iframe
        ref="frameRef"
        :key="app.frameKey"
        :src="app.frameSrc"
        class="frame"
        title="静态产物"
        allow="clipboard-read; clipboard-write"
        @load="onLoad"
      />
    </div>

    <Transition name="fade">
      <div v-if="app.loading" class="overlay">
        <div class="spinner" />
        <p class="overlay__title">正在载入静态产物</p>
        <p class="overlay__path">{{ app.entry }}</p>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="app.error && !app.loading" class="overlay overlay--error">
        <span class="overlay__icon"><AppIcon name="alert" :size="22" /></span>
        <p class="overlay__title">产物没能加载出来</p>
        <p class="overlay__desc selectable">{{ app.error }}</p>
        <div class="overlay__actions">
          <button class="btn btn--primary" @click="app.reload()">重试</button>
          <button class="btn btn--ghost-border" @click="app.hardReload()">忽略缓存重试</button>
        </div>
        <p class="overlay__hint">
          把构建产物（含 index.html）放到 <code>public/webapp/</code>，
          或执行 <code>npm run webapp:sync -- &lt;产物目录&gt;</code>
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--panel);
}

.frame-wrap {
  position: absolute;
  inset: 0;
  transform-origin: top left;
}

.frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}

/* ------------------------------ 覆盖层 ------------------------------ */
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px;
  text-align: center;
  background: var(--panel);
  z-index: 2;
}

.overlay--error {
  background: var(--panel);
}

.overlay__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  margin-bottom: 2px;
}

.overlay__title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
}

.overlay__path,
.overlay__desc {
  margin: 0;
  max-width: 480px;
  font-size: 12px;
  color: var(--text-3);
  font-family: var(--font-mono);
  word-break: break-all;
}

.overlay__desc {
  font-family: var(--font);
  color: var(--text-2);
  line-height: 1.6;
}

.overlay__actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.overlay__hint {
  margin: 14px 0 0;
  max-width: 520px;
  font-size: 11.5px;
  line-height: 1.8;
  color: var(--text-3);
}

.overlay__hint code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--panel-3);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-2);
}

/* ------------------------------ 加载动画 ------------------------------ */
.spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid var(--panel-3);
  border-top-color: var(--accent);
  animation: spin 0.75s linear infinite;
  margin-bottom: 2px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
