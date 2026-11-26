/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  /** 开发阶段可指定外部产物地址，例如 http://localhost:5174 */
  readonly VITE_WEBAPP_DEV_URL?: string
  /** 覆盖 iframe 默认加载的产物路径，默认 /webapp/index.html */
  readonly VITE_WEBAPP_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
