import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Tauri 期望一个固定端口的开发服务器，端口被占用时直接失败而不是自动换端口
const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // Tauri 的 Rust 侧需要看到 vite 的输出，不要清屏
  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: {
      // src-tauri 由 cargo 自己监听，避免重复触发
      ignored: ['**/src-tauri/**'],
    },
    fs: {
      // 允许访问 public 下的静态产物
      strict: false,
    },
  },

  envPrefix: ['VITE_', 'TAURI_ENV_'],

  build: {
    // Windows 上 Tauri 使用 WebView2(Chromium)，macOS/Linux 使用 WebKit
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    outDir: 'dist',
    emptyOutDir: true,
  },
})
