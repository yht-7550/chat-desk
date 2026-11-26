<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 16 })

type IconName =
  | 'reload'
  | 'external'
  | 'settings'
  | 'code'
  | 'minimize'
  | 'maximize'
  | 'restore'
  | 'close'
  | 'zoom-in'
  | 'zoom-out'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'pin'
  | 'check'
  | 'info'
  | 'fullscreen'
  | 'folder'
  | 'alert'
  | 'trash'

const paths: Record<IconName, string> = {
  reload: 'M20.5 12a8.5 8.5 0 1 1-3.3-6.7L20.5 8M20.5 3.5V8h-4.5',
  external: 'M14 4h6v6M20 4l-8.5 8.5M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10',
  settings:
    'M4 7h8M17 7h3M4 12h3M12 12h8M4 17h11M20 17h0M14 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0M9 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0M19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  code: 'M15.5 17.5 21 12l-5.5-5.5M8.5 6.5 3 12l5.5 5.5M13.5 4l-3 16',
  minimize: 'M5 12h14',
  maximize: 'M6 6h12v12H6z',
  restore: 'M8.5 8.5h9v9h-9zM5.5 15V5.5H15',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  'zoom-in': 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4M11 8.5v5M8.5 11h5',
  'zoom-out': 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4M8.5 11h5',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 13.2A8.6 8.6 0 1 1 10.8 3a7 7 0 0 0 10.2 10.2z',
  monitor: 'M4 5.5h16v10H4zM9 20h6M12 15.5V20',
  pin: 'M9 4h6l-1 5 3.5 3.5H6.5L10 9 9 4zM12 12.5V20',
  check: 'M20 6.5 9.5 17 4 11.5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.6v.6',
  fullscreen: 'M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15',
  folder: 'M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-11z',
  alert: 'M12 3.5 21.5 20H2.5L12 3.5zM12 9.5v4.5M12 17v.6',
  trash: 'M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13M10 11v5M14 11v5',
}

const d = computed(() => paths[props.name] ?? '')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="d" />
  </svg>
</template>
