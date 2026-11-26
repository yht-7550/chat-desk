# ChatDesk

基于 **Vite + Vue 3 + Pinia + Tauri 2** 的桌面外壳（shell），用来把**已有的静态打包产物**包装成桌面应用。

它不重写你的业务代码：外壳负责窗口、标题栏、菜单、快捷键、外链、缩放、主题等桌面侧的事情，
真正的界面仍然是你原来那份 `dist/`，通过 `iframe` 承载在 `/webapp/index.html` 这个子路径下。

```
┌──────────────────────────────────────────────┐
│ ChatDesk · /webapp/index.html      ● 已就绪  │  ← 无边框标题栏（可拖拽 + 窗口控件）
├──────────────────────────────────────────────┤
│ ⟳  ↗ │ app:// /webapp/index.html │ 100% ⛶ ⚙ │  ← 工具栏
├──────────────────────────────────────────────┤
│                                              │
│           你的静态产物（iframe）              │
│                                              │
├──────────────────────────────────────────────┤
│ ● 已就绪 · 加载于 刚刚   F5 刷新 · Ctrl +/-  │  ← 状态栏
└──────────────────────────────────────────────┘
```

## 技术栈

| 层 | 选型 | 作用 |
| --- | --- | --- |
| 构建 | Vite 7 + TypeScript | 外壳自身的开发/构建 |
| UI | Vue 3.5（`<script setup>`） | 标题栏、工具栏、状态栏、设置面板 |
| 状态 | Pinia 3 | 产物加载状态、设置项持久化、窗口状态 |
| 桌面 | Tauri 2 | 无边框窗口、系统浏览器外链、打包分发 |

## 目录结构

```
├── index.html                 # 外壳入口
├── src/
│   ├── App.vue                # 布局 + 全局快捷键
│   ├── components/
│   │   ├── TitleBar.vue       # 无边框标题栏（data-tauri-drag-region）
│   │   ├── ToolBar.vue        # 刷新 / 外链 / 地址栏 / 缩放 / 设置
│   │   ├── WebAppFrame.vue    # iframe 承载 + 加载态 + 外链拦截
│   │   ├── StatusBar.vue      # 状态、快捷键提示、版本
│   │   ├── SettingsDrawer.vue # 设置抽屉
│   │   ├── Switch.vue / AppIcon.vue
│   ├── stores/
│   │   ├── app.ts             # 产物加载状态、刷新、缓存穿透
│   │   ├── settings.ts        # 主题/缩放/置顶，localStorage 持久化
│   │   └── window.ts          # 最大化 / 全屏状态同步
│   ├── lib/tauri.ts           # 所有桌面能力的唯一入口（浏览器下自动降级）
│   └── style.css              # 设计令牌（明/暗）
├── public/
│   ├── logo.svg
│   └── webapp/                # ★ 你的静态产物放这里（当前是示例页）
├── scripts/
│   ├── sync-webapp.mjs        # 同步产物 + 修正绝对路径
│   └── gen-icons.mjs          # 纯 Node 生成 png/ico/icns 图标
└── src-tauri/
    ├── tauri.conf.json        # 窗口、打包、bundle 配置
    ├── capabilities/default.json  # 窗口控制所需权限
    ├── src/lib.rs             # 插件装配 + toggle_devtools
    └── icons/                 # 32/128/128@2x/ico/icns
```

## 快速开始

### 1. 环境

- Node.js ≥ 18（本项目用 22 验证）+ pnpm ≥ 10（本项目用 11 验证）
- Rust（`rustup`）+ 平台依赖：Windows 需要 **MSVC C++ 生成工具** 与 **WebView2 运行时**（Win11 自带）
  - 见 <https://tauri.app/start/prerequisites/>

### 2. 安装与调试

```bash
pnpm install

# 纯前端调试：浏览器里跑外壳，最快
pnpm dev               # http://localhost:1420

# 真正的桌面窗口（需要 Rust）
pnpm tauri:dev
```

`pnpm dev` 下所有桌面能力都会降级：窗口控件显示为「浏览器预览模式」占位，外链用 `window.open` 打开。
这样改 UI 不用每次都等 Rust 编译。

> pnpm 10+ 默认不执行依赖的构建脚本。`esbuild` 需要放行，已写在 `pnpm-workspace.yaml` 的
> `allowBuilds` 里；如果换到新环境后 `vite build` 报找不到 esbuild 二进制，执行 `pnpm approve-builds`
> 勾选 esbuild 即可。

### 3. 接入你的静态产物

**方式 A：一条命令同步（推荐）**

```bash
# 在产物项目里构建好之后
pnpm webapp:sync -- ../your-app/dist

# 开发期边改边看
pnpm webapp:sync -- ../your-app/dist --watch
```

脚本会清空 `public/webapp` → 递归复制 → 把 HTML 里以 `/` 开头的资源引用改成相对路径 →
扫描残留的根绝对路径并提示。

**方式 B：直接放文件**

把产物（含 `index.html`）整个丢进 `public/webapp/` 即可，Vite 会原样带到 `dist/webapp/`。

**方式 C：直接指向产物项目的开发服务器**

```bash
# .env.local
VITE_WEBAPP_DEV_URL=http://localhost:5174
```

适合联调阶段；此时 iframe 跨域，外链拦截和快捷键转发会自动跳过。

### 4. 关于 `base` 路径

产物挂在 `/webapp/` 子路径下，所以最稳妥的做法是在**产物项目**里构建时就设置相对基址：

```ts
// 产物项目的 vite.config.ts
export default defineConfig({ base: './' })
```

`sync-webapp.mjs` 会帮你修正 `index.html` 里的 `/assets/...`，但 CSS 里的 `url(/fonts/x.woff)`
和 JS 里拼出来的绝对路径它改不了（会打印警告）。另外建议产物使用 **hash 路由**（`#/detail/1`），
因为桌面端对 history 路由的深链接回退支持取决于产物本身。

## 外壳已具备的能力

- **无边框窗口**：标题栏 `data-tauri-drag-region` 拖拽、双击最大化、最小化/最大化/关闭按钮
- **快捷键**：`F5`/`Ctrl+R` 刷新，`Ctrl+Shift+R` 忽略缓存刷新，`F11` 全屏，`F12`/`Ctrl+Shift+I` 开发者工具，
  `Ctrl+±`/`Ctrl+0` 缩放，`Ctrl+,` 设置，`Esc` 关抽屉（焦点在产物里时同样生效）
- **外链接管**：产物里 `target="_blank"` 或跨域链接交给系统浏览器，不会在应用内弹新窗口
- **缩放**：只缩放 iframe（放大画布 + `transform` 缩小），外壳始终清晰
- **设置持久化**：主题（跟随系统/浅/深）、缩放、置顶、工具栏/状态栏显隐写入 `localStorage`
- **加载体验**：加载遮罩、15s 超时兜底、失败重试 / 忽略缓存重试
- **缓存穿透**：`忽略缓存重载` 会给入口 URL 加时间戳，避免 WebView 缓存旧产物

## 打包发布

```bash
pnpm tauri:build
# Windows → src-tauri/target/release/bundle/{msi,nsis}/
# macOS   → .app / .dmg
# Linux   → .deb / .AppImage
```

发布前建议改三处：

1. `src-tauri/tauri.conf.json` 的 `productName`、`identifier`、`version`
2. `src-tauri/icons/` 换成自己的图标（或改 `scripts/gen-icons.mjs` 的 `draw()` 后 `pnpm icons`）
3. `bundle.longDescription` 等文案

## 常见问题

**白屏 / 一直转圈**
`public/webapp/index.html` 不存在，或产物里的资源路径没改成相对路径。看状态栏是否显示「加载失败」，
以及控制台里 404 的是哪个文件。

**`tauri dev` 报错找不到 cargo**
需要先装 Rust：<https://rustup.rs>，Windows 还要装「使用 C++ 的桌面开发」工作负载。

**想加托盘、单实例、自动更新**
在 `src-tauri/Cargo.toml` 加插件依赖、`lib.rs` 里 `.plugin(...)` 注册即可，前端能力统一往
`src/lib/tauri.ts` 里加，保持「所有桌面能力只有一个入口」的约定。

**CSP**
`tauri.conf.json` 里 `security.csp` 目前是 `null`（最宽松，方便任意产物直接跑）。
如果产物不依赖外部 CDN，建议收紧成只允许 `'self'` 与必要域名，能显著提升安全性。

**iframe 与外壳通信**
两者同源，`iframe.contentWindow.postMessage` 或用 `window.parent` 都能直接通信；
建议约定一套消息协议（如 `{ type: 'shell:open-external', url }`）放在 `src/lib/` 下统一管理。
