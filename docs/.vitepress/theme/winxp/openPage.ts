/**
 * 在 XP 模式里"打开一个页面" —— 统一入口。
 *
 * 页面窗口只有一个（见 windows.ts 顶部的说明），所以这里是
 * 「把页面窗口挪到目标路由并聚焦」，而不是再开一个新窗口。
 */
import { useRouter } from 'vitepress'
import { PAGE_WIN_ID, focusWindow, openWindow, windows } from './windows'

export function useXpOpenPage() {
  const router = useRouter()

  return function openPage(path: string, title?: string) {
    const existing = windows.find((w) => w.id === PAGE_WIN_ID)
    if (existing) {
      existing.title = title || path
      existing.path = path
      existing.min = false
      focusWindow(PAGE_WIN_ID)
    } else {
      openWindow({
        id: PAGE_WIN_ID,
        kind: 'page',
        title: title || path,
        path,
        icon: 'globe',
        w: 800,
        h: 560,
      })
    }
    router.go(path)
  }
}
