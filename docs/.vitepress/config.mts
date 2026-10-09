import { defineConfig } from 'vitepress'
import container from 'markdown-it-container'
import { cjkPunctPlugin } from './markdown-cjk'

/* ============================================================================
 *  YJlab 实验室维基 —— 站点配置
 *
 *  日常只需要改两处：
 *    1) REPO —— 仓库地址（决定「编辑」「查看历史」「讨论」标签跳到哪）
 *    2) SIDEBAR —— 侧栏「世代编年史 / 组别」两大分类的条目
 * ==========================================================================*/

const REPO = {
  label: 'GitHub',
  // 「编辑」标签：打开网页版 Markdown 编辑器，改完 commit，站点自动重建
  editBase: 'https://github.com/YOUR-ORG/yjlab-wiki/edit/main/docs/',
  // 「查看历史」标签：该页面的提交记录
  historyBase: 'https://github.com/YOUR-ORG/yjlab-wiki/commits/main/docs/',
  // 「讨论」标签：新建 issue
  discussBase: 'https://github.com/YOUR-ORG/yjlab-wiki/issues/new',
  // 侧栏「最近更改」：整个仓库的提交历史
  recentChanges: 'https://github.com/YOUR-ORG/yjlab-wiki/commits/main',
}

/* 侧栏两大分类。link 用文件路径（不带 .md），text 是显示名。 */
const SIDEBAR = [
  {
    title: '世代编年史',
    items: [
      { text: '总览', link: '/chronicle/' },
      { text: '第一世代 · 草创', link: '/chronicle/gen-1' },
      { text: '第二世代 · 成形', link: '/chronicle/gen-2' },
      { text: '第三世代 · 当下', link: '/chronicle/gen-3' },
      { text: '大事记', link: '/chronicle/timeline' },
    ],
  },
  {
    title: '组别',
    items: [
      { text: '总览', link: '/groups/' },
      { text: '算法组', link: '/groups/algorithm' },
      { text: '硬件组', link: '/groups/hardware' },
      { text: '实验平台组', link: '/groups/platform' },
      { text: '论文与成果组', link: '/groups/publication' },
    ],
  },
]

export default defineConfig({
  lang: 'zh-CN',
  title: 'YJlab',
  description: 'YJlab 实验室维基 —— 世代编年史与组别档案',
  base: process.env.BASE_PATH ?? '/',
  cleanUrls: true,
  lastUpdated: true,
  appearance: false, // 维基百科没有夜间模式，关掉切换按钮
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#f6f6f6' }],
  ],

  markdown: {
    /*
     * 维基百科风格的提示框语法：
     *   ::: hatnote 消歧义说明            ← 可写在一行，也可是正文
     *   ::: ambox 本条目需要补充           ← 参数是加粗标题
     *   ::: infobox 信息框标题            ← 参数是信息框标题，内部通常放表格
     */
    config(md) {
      // 消歧义提示：参数与正文都渲染为行内 Markdown（链接可用）
      md.use(container, 'hatnote', {
        render(tokens: any[], idx: number) {
          const token = tokens[idx]
          if (token.nesting !== 1) return '</div>\n'
          const info = token.info.trim().slice('hatnote'.length).trim()
          const lead = info ? md.renderInline(info) : ''
          return `<div class="wiki-hatnote">${lead}\n`
        },
      })

      // 通告框 / 信息框：参数作为加粗标题（纯文本，不解析 Markdown）
      const box = (name: string, cls: string) => {
        md.use(container, name, {
          render(tokens: any[], idx: number) {
            const token = tokens[idx]
            if (token.nesting !== 1) return '</div>\n'
            const info = token.info.trim().slice(name.length).trim()
            const label = info
              ? `<div class="${cls}__label">${md.utils.escapeHtml(info)}</div>\n`
              : ''
            return `<div class="${cls}">\n${label}`
          },
        })
      }
      box('ambox', 'wiki-ambox')
      box('infobox', 'wiki-infobox')

      // 修复「中文标点紧挨 `**` 导致加粗失效」的 CommonMark 兼容问题
      md.use(cjkPunctPlugin)
    },
  },

  themeConfig: {
    /* 自定义主题配置：Layout.vue 读取这里的全部内容 */
    wiki: {
      wordmark: { red: 'YJ', rest: 'lab' },
      tagline: '实验室维基',
      nav: [
        { text: '首页', link: '/' },
        { text: '编辑指南', link: '/help/' },
        { text: '沙盒', link: '/sandbox' },
      ],
      categories: SIDEBAR,
      tools: [
        { text: '最近更改', link: REPO.recentChanges, external: true },
        { text: '随机条目', random: true },
      ],
      /* 右上角「个人工具」栏 */
      personal: [
        { text: '编辑指南', link: '/help/' },
        { text: '管理员入口', link: REPO.editBase.replace(/\/edit\/.*$/, ''), external: true },
      ],
      edit: {
        label: REPO.label,
        editBase: REPO.editBase,
        historyBase: REPO.historyBase,
        discussBase: REPO.discussBase,
      },
    },
  },
})
