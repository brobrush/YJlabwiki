/**
 * 在 XP 模式里"打开一个页面"
 *
 * 每个页面一个窗口（id = 'page:<路径>'），已经开着就置顶，所以能同时开多个。
 *
 * ⚠️ router.go() 必须传 **带 base** 的地址。
 *    VitePress 内部是按长度剥 base 的：
 *      pagePath = sanitizeFileName(pagePath.slice(base.length).replace(/\//g, '_')) + '.md'
 *    传 '/chronicle/gen-1' 会给它 slice(11) 变成 'ronicle/gen-1'，然后查不到 → 显示"页面不存在"。
 *    本地开发 base 是 '/'，withBase 是空操作，所以这个 bug 只在子路径部署下才暴露 ——
 *    改这里的东西时，一定要用 BASE_PATH=/YJlabwiki/ 构建后验证。
 */
import { useRouter, withBase } from 'vitepress'
import { focusWindow, minimizeAll, openWindow, windows } from './windows'
import { cachedPage, loadPage, stripBase } from './xpPages'

export function useXpOpenPage() {
  const router = useRouter()

  return function openPage(rawPath: string, title?: string) {
    // 归一化：链接给的可能是 '/chronicle/'，而 route.path 剥完 base 是 '/chronicle'。
    // 不统一的话同一页会因为 id 不同被开出两个窗口（踩过）。
    const path = stripBase(rawPath || '/')

    // '/' = 回到桌面：把窗口全收进任务栏，而不是关掉
    if (path === '/') {
      minimizeAll()
      router.go(withBase('/'))
      return
    }

    const id = 'page:' + path
    const existing = windows.find((w) => w.id === id)

    if (existing) {
      if (title) existing.title = title
      existing.min = false
      focusWindow(id)
    } else {
      openWindow({
        id,
        kind: 'page',
        path,
        title: title || path,
        icon: 'globe',
        w: 820,
        h: 560,
      })
    }

    // 抓完正文后，用页面自己的标题覆盖窗口标题 ——
    // 侧栏里的链接文字常常是「总览」这种含糊的名字
    loadPage(path, title).then(() => {
      const t = cachedPage(path)?.title
      const w = windows.find((x) => x.id === id)
      if (w && t) w.title = t
    })
    router.go(withBase(path))
  }
}
