/**
 * 页面正文缓存 —— XP 模式下每个窗口各自抓自己那一页的静态 HTML
 *
 * 为什么不在窗口里直接用 VitePress 的 <Content />：
 *   它永远只渲染**当前路由**，所以全站只能有一个页面窗口。
 *   要做成"能同时开多个页面"，就得让每个窗口拿到独立的正文。
 *
 * 这个站是纯静态的，每页都已经预渲染成 HTML 了，所以直接 fetch 那一页、
 * 把 .wiki-body 抓出来塞进窗口就行 —— 简单可靠，也不受路由时机影响。
 *
 * 代价：抓来的正文是静态快照，里面的 Vue 交互组件不会活。
 * 网页里的链接由 XpDesktop 的事件委托接管，所以点击跳转照常能用。
 */
import { reactive } from 'vue'
import { withBase } from 'vitepress'

export interface XpPage {
  title: string
  html: string
  state: 'loading' | 'ok' | 'error'
}

const cache = reactive<Record<string, XpPage>>({})
const inflight = new Map<string, Promise<void>>()

export function cachedPage(path: string): XpPage | undefined {
  return cache[path]
}

/**
 * 剥掉 base 前缀，得到"应用内路径"。
 *
 * 注意：VitePress 的 route.path **是带 base 的**（线上形如 '/YJlabwiki/groups/'），
 * 而站点链接的 href 也是带 base 的。两者都要先剥成 '/groups/' 再去 withBase 拼接，
 * 否则会拼出 '/YJlabwiki/YJlabwiki/...' 直接 404，
 * 而且窗口 id 会一个带 base 一个不带，同一个页面开出两个窗口。
 */
export function stripBase(url: string): string {
  const base = withBase('/') // 线上 '/YJlabwiki/'，本地 '/'
  let h = url.split('#')[0].split('?')[0]
  if (base !== '/' && h.startsWith(base)) h = '/' + h.slice(base.length)
  h = h.replace(/\/{2,}/g, '/')
  h = h.replace(/\/index\.html$/, '/').replace(/\.html$/, '')
  if (h.length > 1) h = h.replace(/\/+$/, '') // '/groups/' 和 '/groups' 视作同一页
  return h || '/'
}

/** 把 href 还原成站内应用路径；外链返回 null */
export function hrefToPath(href: string): string | null {
  if (!href) return null
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return null // http: mailto: 等外链
  if (!href.startsWith('/')) return null
  return stripBase(href)
}

export async function loadPage(path: string, title?: string): Promise<void> {
  const hit = cache[path]
  if (hit && hit.state === 'ok') {
    if (title) hit.title = title
    return
  }
  const running = inflight.get(path)
  if (running) {
    if (title && cache[path]) cache[path].title = title
    return running
  }

  const job = (async () => {
    cache[path] = { title: title || path, html: '', state: 'loading' }
    try {
      // 必须用 withBase 拼上 base 前缀，否则子路径部署下会 404
      const res = await fetch(withBase(path), { credentials: 'same-origin' })
      if (!res.ok) throw new Error('HTTP ' + res.status)

      const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
      const body = doc.querySelector('.wiki-body')
      const categories = doc.querySelector('.wiki-categories')
      const docTitle = (doc.querySelector('title')?.textContent || '').split('|')[0].trim()

      cache[path] = {
        title: docTitle || title || path,
        html:
          (body
            ? body.innerHTML
            : '<p class="xp-page__empty">这一页没有正文。</p>') +
          (categories ? categories.outerHTML : ''),
        state: 'ok',
      }
    } catch (e) {
      cache[path] = {
        title: title || path,
        html:
          '<p class="xp-page__empty">这一页读不出来（' +
          (e as Error).message +
          '）。</p>',
        state: 'error',
      }
    } finally {
      inflight.delete(path)
    }
  })()

  inflight.set(path, job)
  return job
}
