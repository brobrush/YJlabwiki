/**
 * 主题（皮肤）注册表
 *
 * ── 怎么新增一个主题 ──────────────────────────────────────────
 *  1. 在 docs/.vitepress/theme/ 下新建 `<id>.css`，所有规则都用
 *     `html[data-wiki-theme='<id>']` 打头，保证只影响该主题
 *  2. 在下面的 THEMES 数组里加一项
 *  3. 在 docs/.vitepress/theme/index.ts 里 import 那个 css
 *  4. 改 docs/.vitepress/theme/Layout.vue 里的主题选择器不用动 —— 它是遍历 THEMES 渲染的
 *
 * ⚠️ DEFAULT_THEME 和 STORAGE_KEY 的值同时被 config.mts 里那段
 *    「防闪烁」内联脚本硬编码引用，改这里也要同步改那边。
 */

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

/** 侧栏「外观」里的选项，按显示顺序排列 */
export const THEMES: WikiTheme[] = [
  {
    id: 'wiki',
    label: '维基百科',
    hint: '经典 Vector 皮肤，也就是你现在看到的这个（默认）',
  },
  {
    id: 'legend',
    label: '传奇打金服',
    hint: '黑底金字、屠龙宝刀、点击就送 —— 纯属娱乐',
  },
]

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
