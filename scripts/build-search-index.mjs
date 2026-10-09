/**
 * 构建时生成全文检索索引：docs/public/search-index.json
 *
 * 用法：npm run index（dev / build 前会自动执行）
 * 产出：[{ title, url, text }]，由侧栏搜索框在浏览器里直接过滤，无需后端。
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, relative, sep, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const DOCS = join(ROOT, 'docs')
const OUT = join(DOCS, 'public', 'search-index.json')

const SKIP_DIRS = new Set(['.vitepress', 'public', 'node_modules'])

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.vitepress') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      out.push(...(await walk(full)))
    } else if (entry.name.endsWith('.md')) {
      out.push(full)
    }
  }
  return out
}

/** markdown 源文件路径 → 站点 URL（与 cleanUrls 行为一致） */
function toUrl(file) {
  const rel = relative(DOCS, file).split(sep).join('/').replace(/\.md$/, '')
  const parts = rel.split('/')
  const last = parts[parts.length - 1]
  if (last === 'index') {
    const dir = parts.slice(0, -1).join('/')
    return dir ? `/${dir}/` : '/'
  }
  return `/${rel}`
}

function parse(raw) {
  let body = raw
  let frontTitle = ''
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (fm) {
    body = raw.slice(fm[0].length)
    const t = fm[1].match(/^title:\s*(.+)$/m)
    if (t) frontTitle = t[1].trim().replace(/^["']|["']$/g, '')
  }
  const h1 = body.match(/^#\s+(.+)$/m)
  const title = frontTitle || (h1 ? h1[1].trim() : '')
  return { title, body }
}

function toPlainText(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}[:>|-]{1,3}\s*/gm, ' ')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

const files = (await walk(DOCS)).sort()
const index = []

for (const file of files) {
  const raw = await readFile(file, 'utf8')
  const { title, body } = parse(raw)
  const url = toUrl(file)
  index.push({
    title: title || basename(file, '.md'),
    url,
    text: toPlainText(body).slice(0, 600),
  })
}

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, JSON.stringify(index, null, 0), 'utf8')
console.log(`[search-index] ${index.length} 个条目 → docs/public/search-index.json`)
