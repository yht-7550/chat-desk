#!/usr/bin/env node
/**
 * 把另一个项目的静态打包产物同步到 public/webapp。
 *
 *   npm run webapp:sync -- ../other-project/dist
 *   npm run webapp:sync -- ../other-project/dist --watch
 *   npm run webapp:clean
 *
 * 做了三件事：
 *   1. 清空并复制产物到 public/webapp（只动这一个目录，路径写死防误删）；
 *   2. 把 HTML 里以 "/" 开头的资源引用改成相对路径，让产物能挂在子路径下；
 *   3. 扫描产物里剩下的根绝对路径引用并给出提示。
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  watch,
  writeFileSync,
} from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '..')
const TARGET = resolve(ROOT, 'public/webapp')
const EXPECTED = join('public', 'webapp')

if (!TARGET.endsWith(EXPECTED)) {
  console.error(`拒绝操作：目标目录异常（${TARGET}）`)
  process.exit(1)
}

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const positional = args.filter((a) => !a.startsWith('--'))

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
}

function fail(message) {
  console.error(C.red(`✗ ${message}`))
  process.exit(1)
}

function clean() {
  rmSync(TARGET, { recursive: true, force: true })
}

/** 手写递归复制：比 fs.cpSync 在含中文的路径下更稳，也避免跟随软链接 */
function copyDir(from, to) {
  mkdirSync(to, { recursive: true })
  for (const name of readdirSync(from)) {
    const src = join(from, name)
    const dest = join(to, name)
    const info = statSync(src)
    if (info.isDirectory()) copyDir(src, dest)
    else if (info.isFile()) copyFileSync(src, dest)
  }
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

/** 把 HTML 里的根绝对路径改成相对路径 */
function rewriteHtml(file) {
  const before = readFileSync(file, 'utf8')
  const after = before.replace(
    /(\s(?:src|href|poster|action|data-src)=)(["'])\/(?!\/)/g,
    (_m, attr, quote) => `${attr}${quote}./`,
  )
  if (after !== before) {
    writeFileSync(file, after, 'utf8')
    return true
  }
  return false
}

/** 统计产物里仍然存在的根绝对路径引用（多见于 CSS url() 或 JS 字符串） */
function scanAbsoluteRefs(files) {
  const hits = []
  for (const file of files) {
    const ext = extname(file).toLowerCase()
    if (!['.css', '.js', '.mjs', '.json', '.html'].includes(ext)) continue
    const text = readFileSync(file, 'utf8')
    const matches = text.match(/["'(]\/[a-zA-Z0-9_@.-]+\//g)
    if (matches && matches.length > 0) {
      hits.push({ file, count: matches.length })
    }
  }
  return hits
}

function sync() {
  const source = positional[0] || process.env.WEBAPP_SRC
  if (!source) {
    fail('请指定产物目录，例如：npm run webapp:sync -- ../other-project/dist')
  }

  const src = resolve(ROOT, source)
  if (!existsSync(src)) fail(`目录不存在：${src}`)
  if (!statSync(src).isDirectory()) fail(`不是目录：${src}`)
  if (!existsSync(join(src, 'index.html'))) {
    fail(`没找到 ${join(src, 'index.html')}，请确认这是打包输出目录（不是源码目录）`)
  }

  console.log(C.dim(`源目录：${src}`))
  clean()
  copyDir(src, TARGET)

  const files = walk(TARGET)
  const htmlFiles = files.filter((f) => extname(f).toLowerCase() === '.html')
  const rewritten = htmlFiles.filter((f) => rewriteHtml(f))

  const bytes = files.reduce((sum, f) => sum + statSync(f).size, 0)
  console.log(
    C.green(`✓ 已同步 ${files.length} 个文件`) +
      C.dim(`（${(bytes / 1024 / 1024).toFixed(2)} MB）→ ${relative(ROOT, TARGET)}`),
  )
  if (rewritten.length) {
    console.log(
      C.cyan(`· 修正了 ${rewritten.length} 个 HTML 的根绝对路径`) +
        C.dim(`：${rewritten.map((f) => relative(TARGET, f)).join(', ')}`),
    )
  }

  const hits = scanAbsoluteRefs(files)
  if (hits.length) {
    console.log(
      C.yellow('! 以下文件仍有根绝对路径引用，挂到 /webapp/ 下可能 404：'),
    )
    for (const hit of hits.slice(0, 8)) {
      console.log(C.dim(`    ${relative(TARGET, hit.file)}（${hit.count} 处）`))
    }
    if (hits.length > 8) console.log(C.dim(`    … 另有 ${hits.length - 8} 个文件`))
    console.log(
      C.yellow('  建议在产物项目里设置 base: "./"（Vite）或 PUBLIC_URL="." 后重新打包。'),
    )
  }

  console.log(C.dim('入口：public/webapp/index.html'))
  console.log(C.dim('开发服务器会直接读取该目录，保存后刷新窗口即可看到效果。'))
}

function watchMode() {
  const source = positional[0]
  if (!source) fail('--watch 需要同时指定源目录')
  sync()
  const src = resolve(ROOT, source)
  let timer
  console.log(C.dim(`\n监听 ${src} 的变更…（Ctrl+C 退出）`))
  watch(src, { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        sync()
      } catch (error) {
        console.error(C.red(`同步失败：${error.message}`))
      }
    }, 400)
  })
}

if (flags.has('--clean')) {
  clean()
  console.log(C.green(`✓ 已清空 ${relative(ROOT, TARGET)}`))
} else if (flags.has('--help') || flags.has('-h')) {
  console.log(`用法：
  npm run webapp:sync -- <产物目录>          复制产物到 public/webapp
  npm run webapp:sync -- <产物目录> --watch  监听源目录，改动即同步
  npm run webapp:clean                       清空 public/webapp`)
} else if (flags.has('--watch')) {
  watchMode()
} else {
  sync()
}
