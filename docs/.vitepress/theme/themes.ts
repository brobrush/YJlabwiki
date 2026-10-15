/**
 * 主题（皮肤）注册表
 *
 * ── 怎么新增一个主题 ──────────────────────────────────────────
 *  1. 在 docs/.vitepress/theme/ 下新建 `<id>.css`，所有规则都用
 *     `html[data-wiki-theme='<id>']` 打头，保证只影响该主题
 *  2. 在下面的 THEMES 数组里加一项
 *  3. 在 docs/.vitepress/theme/index.ts 里 import 那个 css
 *  4. 侧栏的选择器不用改 —— 它是遍历 THEMES 渲染的
 *
 * 需要改页面**结构**（不只是配色）的主题，要在 Layout.vue 里单独分支。
 * WindowsXP 就是这样：它把整站换成一台模拟电脑，代码在 winxp/ 目录。
 *
 * ⚠️ DEFAULT_THEME 和 STORAGE_KEY 的值同时被 config.mts 里那段
 *    「防闪烁」内联脚本硬编码引用，改这里也要同步改那边。
 */
import { ref } from 'vue'

export interface WikiTheme {
  /** 对应 html[data-wiki-theme="<id>"]；默认主题不加属性 */
  id: string
  /** 侧栏里显示的名字 */
  label: string
  /** 悬停提示 */
  hint?: string
}

export const DEFAULT_THEME = 'wiki'

export const STORAGE_KEY = 'yjlab-wiki-theme'

/** 主题属性名，写在 <html> 上 */
export const THEME_ATTR = 'data-wiki-theme'

/** 会替换整站结构的主题（不是纯配色），Layout 里要单独分支 */
export const STRUCTURAL_THEMES = ['winxp']

/** 侧栏「外观」里的选项，按显示顺序排列 */
export const THEMES: WikiTheme[] = [
  {
    id: 'wiki',
    label: '维基百科',
    hint: '经典 Vector 皮肤（默认）',
  },
  {
    id: 'legend',
    label: '传奇打金服',
    hint: '黑底金字、屠龙宝刀、点击就送 —— 纯属娱乐',
  },
  {
    id: 'winxp',
    label: 'Windows XP',
    hint: '整站变成一台 XP 电脑：桌面、开始菜单、可拖拽的窗口，还能打俄罗斯方块',
  },
]

/* ------------------------------------------------------------------ 状态 */

/**
 * 当前主题。模块级 ref —— 所有组件共享同一份，
 * 侧栏选择器一改，Layout 立刻跟着换布局。
 */
const current = ref(DEFAULT_THEME)
let initialized = false

/** 把主题写到 <html> 上：默认主题 = 移除属性 */
export function applyTheme(id: string) {
  const root = document.documentElement
  if (!id || id === DEFAULT_THEME) {
    root.removeAttribute(THEME_ATTR)
  } else {
    root.setAttribute(THEME_ATTR, id)
  }
}

export function readStoredTheme(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function storeTheme(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* 隐私模式下 localStorage 可能不可用，忽略即可 */
  }
}

/**
 * 在组件里使用主题。
 *
 * SSR 读不到 localStorage，所以首屏永远是默认主题，挂载后再同步真实值。
 * Layout 靠 `mounted` 判断该怎么渲染，这样不会触发 hydration 不匹配。
 */
export function useWikiTheme() {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true
    current.value = readStoredTheme()
    applyTheme(current.value)
  }

  function setTheme(id: string) {
    current.value = id
    applyTheme(id)
    storeTheme(id)
  }

  function reset() {
    initialized = false
  }

  return { theme: current, setTheme, themes: THEMES, reset }
}
