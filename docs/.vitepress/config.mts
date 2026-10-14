import { defineConfig } from 'vitepress'
import container from 'markdown-it-container'
import { cjkPunctPlugin } from './markdown-cjk'

/* ============================================================================
 *  YJlab 实验室维基 —— 站点配置
 *
 *  日常只需要改几处：
 *    1) REPO —— 仓库地址（决定「编辑」「查看历史」「讨论」标签跳到哪）
 *    2) SIDEBAR —— 侧栏三大分类（世代编年史 / 组别 / 工具介绍）的条目
 *    3）STEINS GATE —— 一切都是命运石之门的选择
 * ==========================================================================*/

/* 站点部署在子路径下时用环境变量覆盖，例如 GitHub Pages 项目站点：
 *     BASE_PATH=/YJlabwiki/ npm run build
 * 绑定独立域名、跑在根路径时不需要设置（默认就是 /）。
 */
const BASE_PATH = (() => {
  const raw = process.env.BASE_PATH ?? '/'
  return raw.endsWith('/') ? raw : raw + '/'
})()

const REPO = {
  label: 'GitHub',
  // 仓库首页
  home: 'https://github.com/brobrush/YJlabwiki',
  // 「编辑」标签：打开网页版 Markdown 编辑器，改完 commit，站点自动重建
  editBase: 'https://github.com/brobrush/YJlabwiki/edit/main/docs/',
  // 「查看历史」标签：该页面的提交记录
  historyBase: 'https://github.com/brobrush/YJlabwiki/commits/main/docs/',
  // 「讨论」标签：新建 issue
  discussBase: 'https://github.com/brobrush/YJlabwiki/issues/new',
  // 侧栏「最近更改」：整个仓库的提交历史
  recentChanges: 'https://github.com/brobrush/YJlabwiki/commits/main',
}

/* 侧栏三大分类。link 用文件路径（不带 .md），text 是显示名。 */
const SIDEBAR = [
  {
    title: '世代编年史',
    items: [
      { text: '总览', link: '/chronicle/' },
      { text: '第一世代 · 猴王初问世', link: '/chronicle/gen-1' },
      { text: '第二世代 · shit ocean', link: '/chronicle/gen-2' },
      { text: '第三世代 · 注定伟大', link: '/chronicle/gen-3' },
      { text: '大事记', link: '/chronicle/timeline' },
    ],
  },
  {
    title: '组别',
    items: [
      { text: '总览', link: '/groups/' },
      { text: 'ROS组', link: '/groups/ros' },
      { text: '嵌入式组', link: '/groups/embedded' },
      { text: '建模组', link: '/groups/modeling' },
      { text: 'AI组', link: '/groups/ai' },
      { text: '（前）VR组', link: '/groups/vr' },
      { text: '（前）web组', link: '/groups/web' },
    ],
  },
  {
    title: '工具介绍',
    items: [
      { text: '总览', link: '/tools/' },
      { text: '螺丝刀类', link: '/tools/screwdriver' },
      { text: '电钻', link: '/tools/drill' },
      // 每新增一件工具，在这里加一行：
      // { text: '工具名', link: '/tools/英文文件名' },
    ],
  },
]

export default defineConfig({
  lang: 'zh-CN',
  title: 'YJlab',
  description: 'YJlab 实验室维基 —— 世代编年史与组别档案',
  base: BASE_PATH,
  cleanUrls: true,
  lastUpdated: true,
  appearance: false, // 维基百科没有夜间模式，关掉切换按钮
  head: [
    // 注意：head 里的资源路径不会自动加 base 前缀，必须手动拼
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE_PATH}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#f6f6f6' }],
    /*
     * 防闪烁：在页面绘制之前把用户选过的主题写到 <html> 上。
     * 否则客户端挂载前会先渲染默认的维基百科皮肤，切了主题的人每次刷新都会闪一下。
     *
     * ⚠️ 下面 'yjlab-wiki-theme' 和 'wiki' 两个字面量必须与
     *    theme/themes.ts 里的 STORAGE_KEY / DEFAULT_THEME 保持一致。
     */
    [
      'script',
      {},
      `(function(){try{var t=localStorage.getItem('yjlab-wiki-theme');` +
        `if(t&&t!=='wiki'){document.documentElement.setAttribute('data-wiki-theme',t)}}catch(e){}})()`,
    ],
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
        { text: '所有页面', link: '/all-pages' },
        { text: '编辑指南', link: '/help/' },
        { text: '关于本站', link: '/about' },
        { text: '沙盒', link: '/sandbox' },
      ],
      categories: SIDEBAR,
      tools: [
        { text: '最近更改', link: REPO.recentChanges, external: true },
        { text: '所有页面', link: '/all-pages' },
        { text: '随机条目', random: true },
      ],
      /* 右上角「个人工具」栏 */
      personal: [
        { text: '编辑指南', link: '/help/' },
        { text: '所有页面', link: '/all-pages' },
        { text: '仓库', link: REPO.home, external: true },
      ],
      /* 右上角最后一个入口：点它去 GitHub 登录后才能编辑 */
      login: { text: '登录 GitHub', link: 'https://github.com/login' },
      edit: {
        label: REPO.label,
        editBase: REPO.editBase,
        historyBase: REPO.historyBase,
        discussBase: REPO.discussBase,
      },
    },
  },
})
