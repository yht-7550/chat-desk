/**
 * 纯 Node 生成应用图标，不依赖任何三方包 / 图像工具。
 *
 * 输出（src-tauri/icons）：
 *   32x32.png  128x128.png  128x128@2x.png  icon.png  icon.ico  icon.icns
 *
 * 想换成自己的图标：直接覆盖这些文件，或修改下面的 draw() 后重跑 `npm run icons`。
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(here, '../src-tauri/icons')

/* ============================== PNG 编码 ============================== */

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([length, typeBuf, data, crc])
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ============================== 图形绘制 ============================== */

const lerp = (a, b, t) => a + (b - a) * t

function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  const cx = Math.min(Math.max(x, x0 + r), x1 - r)
  const cy = Math.min(Math.max(y, y0 + r), y1 - r)
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

function inTriangle(x, y, ax, ay, bx, by, cx, cy) {
  const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by)
  const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy)
  const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

function inCircle(x, y, cx, cy, r) {
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

/** 在归一化坐标系（0..1）里给一个采样点取色 */
function sample(x, y) {
  // 底：圆角方形 + 对角线渐变
  if (!inRoundRect(x, y, 0.02, 0.02, 0.98, 0.98, 0.26)) return null
  const t = Math.min(1, Math.max(0, (x + y) / 2))
  let r = lerp(0x7b, 0x4f, t)
  let g = lerp(0x90, 0x46, t)
  let b = lerp(0xff, 0xe5, t)

  // 对话气泡
  const bubble =
    inRoundRect(x, y, 0.275, 0.285, 0.725, 0.62, 0.065) ||
    inTriangle(x, y, 0.335, 0.6, 0.335, 0.735, 0.485, 0.605)

  if (bubble) {
    r = 0xfb
    g = 0xfc
    b = 0xff
  }

  // 气泡里的三个点
  if (
    inCircle(x, y, 0.395, 0.452, 0.037) ||
    inCircle(x, y, 0.5, 0.452, 0.037) ||
    inCircle(x, y, 0.605, 0.452, 0.037)
  ) {
    r = 0x4f
    g = 0x46
    b = 0xe5
  }

  return [r, g, b]
}

/** 3x3 超采样抗锯齿 */
function render(size) {
  const out = Buffer.alloc(size * size * 4)
  const offsets = [-1 / 3, 0, 1 / 3]
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let ar = 0
      let ag = 0
      let ab = 0
      let aa = 0
      for (const oy of offsets) {
        for (const ox of offsets) {
          const x = (px + 0.5 + ox) / size
          const y = (py + 0.5 + oy) / size
          const c = sample(x, y)
          if (!c) continue
          ar += c[0]
          ag += c[1]
          ab += c[2]
          aa += 1
        }
      }
      const i = (py * size + px) * 4
      if (aa === 0) continue
      out[i] = Math.round(ar / aa)
      out[i + 1] = Math.round(ag / aa)
      out[i + 2] = Math.round(ab / aa)
      out[i + 3] = Math.round((aa / 9) * 255)
    }
  }
  return out
}

/* ============================== ICO / ICNS ============================== */

function encodeIco(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(pngs.length, 4)

  const entries = []
  let offset = 6 + pngs.length * 16
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16)
    entry[0] = size >= 256 ? 0 : size
    entry[1] = size >= 256 ? 0 : size
    entry[2] = 0
    entry[3] = 0
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    entries.push(entry)
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)])
}

function encodeIcns(entries) {
  const chunks = entries.map(({ type, data }) => {
    const head = Buffer.alloc(8)
    head.write(type, 0, 'ascii')
    head.writeUInt32BE(data.length + 8, 4)
    return Buffer.concat([head, data])
  })
  const body = Buffer.concat(chunks)
  const head = Buffer.alloc(8)
  head.write('icns', 0, 'ascii')
  head.writeUInt32BE(body.length + 8, 4)
  return Buffer.concat([head, body])
}

/* ============================== 主流程 ============================== */

mkdirSync(OUT_DIR, { recursive: true })

const cache = new Map()
function png(size) {
  if (!cache.has(size)) cache.set(size, encodePng(size, render(size)))
  return cache.get(size)
}

const files = [
  ['32x32.png', png(32)],
  ['128x128.png', png(128)],
  ['128x128@2x.png', png(256)],
  ['icon.png', png(512)],
]

for (const [name, data] of files) {
  writeFileSync(resolve(OUT_DIR, name), data)
}

writeFileSync(
  resolve(OUT_DIR, 'icon.ico'),
  encodeIco([16, 32, 48, 64, 128, 256].map((size) => ({ size, data: png(size) }))),
)

writeFileSync(
  resolve(OUT_DIR, 'icon.icns'),
  encodeIcns([
    { type: 'ic07', data: png(128) },
    { type: 'ic08', data: png(256) },
    { type: 'ic09', data: png(512) },
  ]),
)

console.log(`图标已生成 → ${OUT_DIR}`)
for (const [name] of files) console.log(`  ${name}`)
console.log('  icon.ico  (16/32/48/64/128/256)')
console.log('  icon.icns (128/256/512)')
