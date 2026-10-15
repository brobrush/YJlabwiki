/**
 * XP 桌面的窗口管理器
 *
 * 状态放在模块级 reactive 数组里，所以路由跳转（SPA 内导航）不会把窗口弄没。
 *
 * 关于「页面窗口」的一个重要限制：
 *   VitePress 的 <Content /> 永远只渲染**当前路由**的内容，
 *   没法同时把两个不同路由的内容渲染到两个窗口里（除非去抓 HTML，那会丢掉交互）。
 *   所以页面窗口只有一个，换页面时是"在这个窗口里导航"，而不是再开一个。
 *   其余窗口（此电脑、TETRIS）可以随便开多个。
 */
import { reactive } from 'vue'

export type WinKind = 'page' | 'mycomputer' | 'tetris'

export interface XpWin {
  id: string
  title: string
  icon: string
  kind: WinKind
  /** 仅 page 窗口：当前显示的路由 */
  path?: string
  x: number
  y: number
  w: number
  h: number
  z: number
  min: boolean
  max: boolean
}

/** 页面窗口的固定 id —— 全站只有一个 */
export const PAGE_WIN_ID = 'win:page'

export const windows = reactive<XpWin[]>([])

let zTop = 10
let seq = 0

/** 桌面可用区域（由 XpDesktop 在挂载和 resize 时写入） */
export const desktopSize = reactive({ w: 1024, h: 700 })

/** 层叠打开时错开一点，像真的 Windows */
function cascade(n: number) {
  const step = 26
  return {
    x: 70 + ((n * step) % 240),
    y: 36 + ((n * step) % 180),
  }
}

function clampToDesktop(w: XpWin) {
  const maxW = Math.max(280, desktopSize.w - 40)
  const maxH = Math.max(200, desktopSize.h - 60)
  w.w = Math.min(w.w, maxW)
  w.h = Math.min(w.h, maxH)
  w.x = Math.min(Math.max(0, w.x), Math.max(0, desktopSize.w - w.w))
  w.y = Math.min(Math.max(0, w.y), Math.max(0, desktopSize.h - w.h))
}

export function focusWindow(id: string) {
  const w = windows.find((x) => x.id === id)
  if (!w) return
  w.z = ++zTop
  if (!w.max) clampToDesktop(w)
}

/** 当前最上层、未最小化的窗口 id（用于判断谁该接收键盘） */
export function topWindowId(): string | null {
  const visible = windows.filter((w) => !w.min)
  if (!visible.length) return null
  return visible.reduce((a, b) => (a.z > b.z ? a : b)).id
}

export function openWindow(opts: {
  id?: string
  title: string
  icon?: string
  kind: WinKind
  path?: string
  w?: number
  h?: number
  x?: number
  y?: number
}): XpWin {
  const id = opts.id ?? `win:${opts.kind}:${++seq}`

  const existing = windows.find((w) => w.id === id)
  if (existing) {
    if (opts.title) existing.title = opts.title
    if (opts.path !== undefined) existing.path = opts.path
    existing.min = false
    focusWindow(id)
    return existing
  }

  const pos = cascade(windows.length)
  const win: XpWin = {
    id,
    title: opts.title,
    icon: opts.icon ?? '📄',
    kind: opts.kind,
    path: opts.path,
    x: opts.x ?? pos.x,
    y: opts.y ?? pos.y,
    w: opts.w ?? 720,
    h: opts.h ?? 480,
    z: ++zTop,
    min: false,
    max: false,
  }
  clampToDesktop(win)
  windows.push(win)
  return win
}

export function closeWindow(id: string) {
  const i = windows.findIndex((w) => w.id === id)
  if (i >= 0) windows.splice(i, 1)
}

export function toggleMinimize(id: string) {
  const w = windows.find((x) => x.id === id)
  if (!w) return
  w.min = !w.min
  if (!w.min) focusWindow(id)
}

export function toggleMaximize(id: string) {
  const w = windows.find((x) => x.id === id)
  if (!w) return
  if (!w.max) {
    // 记住还原时的位置尺寸
    ;(w as any)._restore = { x: w.x, y: w.y, w: w.w, h: w.h }
    w.max = true
  } else {
    w.max = false
    const r = (w as any)._restore
    if (r) {
      w.x = r.x
      w.y = r.y
      w.w = r.w
      w.h = r.h
    }
  }
  focusWindow(id)
}

export function minimizeAll() {
  windows.forEach((w) => (w.min = true))
}

export function closeAll() {
  windows.splice(0, windows.length)
}
