import type MarkdownIt from 'markdown-it'

/**
 * 中文标点 × Markdown 强调符号 的冲突修复
 * ---------------------------------------------------------------------------
 * 问题：CommonMark 规定 `**` 能否“闭合”取决于它左边的字符是不是标点。
 *       中文写作里 `**注意：**请勿…`、`**第一世代（草创期）**是…` 这种写法
 *       会让 `**` 左边紧挨着全角标点（：、）等），于是被判为“不能闭合”，
 *       结果星号原样显示在页面上。
 *
 * 做法：在行内解析之前，把所有非 ASCII 标点临时替换成 Unicode 私用区字符
 *       （PUA，U+E000–U+F8FF）。PUA 不算标点也不算空白，`**` 的判定就正常了；
 *       解析完再换回真字符，页面上看到的仍是原本的中文标点，源码也不被改动。
 */

interface Token {
  type: string
  content?: string
  children?: Token[]
  attrs?: Array<[string, string]> | null
}

interface CoreState {
  src: string
  inlineMode: boolean
  tokens: Token[]
}

export function cjkPunctPlugin(md: MarkdownIt) {
  const toPua = new Map<string, string>()
  const fromPua = new Map<string, string>()
  let next = 0xe000

  /** 只处理非 ASCII 标点，ASCII 标点保持 CommonMark 的标准行为 */
  const needsShield = (ch: string) =>
    ch.charCodeAt(0) > 0x7f && (md.utils as any).isPunctChar(ch)

  const shield = (s: string): string => {
    let out = ''
    for (const ch of s) {
      if (!needsShield(ch)) {
        out += ch
        continue
      }
      let pua = toPua.get(ch)
      if (!pua) {
        if (next > 0xf8ff) {
          out += ch
          continue
        }
        pua = String.fromCharCode(next++)
        toPua.set(ch, pua)
        fromPua.set(pua, ch)
      }
      out += pua
    }
    return out
  }

  const unshield = (s?: string): string | undefined => {
    if (!s) return s
    let out = ''
    for (const ch of s) out += fromPua.get(ch) ?? ch
    return out
  }

  // 行内解析前：加壳
  md.core.ruler.before('inline', 'cjk-punct-shield', (state: CoreState) => {
    if (state.inlineMode) {
      state.src = shield(state.src)
      return
    }
    for (const token of state.tokens) {
      if (token.type === 'inline' && token.content) {
        token.content = shield(token.content)
      }
    }
  })

  // 全部文本变换结束后：脱壳
  md.core.ruler.after('text_join', 'cjk-punct-unshield', (state: CoreState) => {
    for (const token of state.tokens) {
      if (token.type !== 'inline') continue
      token.content = unshield(token.content)
      for (const child of token.children ?? []) {
        child.content = unshield(child.content)
        if (child.attrs) {
          child.attrs = child.attrs.map(
            ([k, v]) => [k, typeof v === 'string' ? (unshield(v) as string) : v] as [string, string],
          )
        }
      }
    }
  })
}
