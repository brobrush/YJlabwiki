# YJlab 维基

应急科技创新实验室的内部维基。外观复刻 Wikipedia Vector (2010) 皮肤，内容为 Markdown，
构建成纯静态站点，由 GitHub Pages 托管。

- **线上**：https://brobrush.github.io/YJlabwiki/
- **仓库**：https://github.com/brobrush/YJlabwiki

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物在 docs/.vitepress/dist/
```

> `npm install` 若报 esbuild 错误，执行 `npm install-scripts approve esbuild` 后重装。

## 想改内容

**不用看这个 README。** 站内的[编辑指南](https://brobrush.github.io/YJlabwiki/help/)写了怎么写、
有哪些语法、页面怎么命名、新增页面要改哪两处。最简单的方式：在页面上点右上角「编辑」，
直接在浏览器里改 Markdown，提交后约 1 分钟自动上线。

## 想改站点本身

| 想改什么 | 改哪里 |
| --- | --- |
| 侧栏分类与条目 | `docs/.vitepress/config.mts` 的 `SIDEBAR` |
| 仓库地址（「编辑」「查看历史」标签指向） | 同文件顶部的 `REPO` |
| 站点名、描述 | 同文件的 `defineConfig` |
| 配色、字体、排版 | `docs/.vitepress/theme/wiki.css` |
| 布局（侧栏 / 标签页 / 页脚） | `docs/.vitepress/theme/Layout.vue` |
| 404 页 | `docs/.vitepress/theme/NotFound.vue` |
| 侧栏搜索 | `docs/.vitepress/theme/WikiSearch.vue` |
| 主题（皮肤） | `docs/.vitepress/theme/themes.ts` 注册，每个主题一个 css |

`docs/` 下按栏目分目录：`chronicle/` 世代编年史、`groups/` 组别、`tools/` 工具介绍、
`help/` 帮助；`public/` 放图片与 favicon；`scripts/` 是构建与调试脚本。

### 主题（皮肤）

默认是维基百科风，侧栏「**外观**」里可以切换。加一个新主题只要三步：

1. 在 `docs/.vitepress/theme/` 下新建 `<id>.css`，**所有规则都用
   `html[data-wiki-theme='<id>']` 打头** —— 这样各主题互不污染，也不会动到默认皮肤
2. 在 `themes.ts` 的 `THEMES` 数组里加一项
3. 在 `theme/index.ts` 里 `import './<id>.css'`

侧栏的选择器是遍历 `THEMES` 渲染的，不用改。选择存在 `localStorage`；
`config.mts` 的 `head` 里有一段内联脚本在页面绘制前套用主题，避免刷新时闪一下
（⚠️ 那段脚本把 `'yjlab-wiki-theme'` 和 `'wiki'` 写死了，改 `STORAGE_KEY` / `DEFAULT_THEME` 时要同步）。

> **写主题 CSS 时注意**：VitePress 的 `<Content />` 会在正文外包一层 `<div>`，
> 所以标题必须用 `h1:first-of-type` 而不是 `> h1:first-child` —— 后者永远匹配不到，
> 标题会退化成黑字无下划线，在深色主题下直接看不见（踩过这个坑）。

## 改代码前必读

三处**删了会静默出问题**的地方：

1. **`docs/.vitepress/theme/index.ts` 必须导出 `NotFound`。** VitePress 内部执行的是
   `createRouter(loadPageModule, Theme.NotFound)`；缺了它，访问不存在的地址会**整页空白且控制台不报错**。
2. **`docs/.vitepress/markdown-cjk.ts` 不能删。** CommonMark 规定 `**` 左边紧挨标点就不能闭合，
   中文写作里 `**注意：**请勿…` 会原样吐出星号。这个插件在解析前后做私用区字符加脱壳来修掉它。
3. **搜索索引在构建前生成。** `npm run build` 已包含 `npm run index`；如果只跑 `vitepress build`，站内搜索会没有数据。

## 部署

GitHub Pages 自动部署，配置在 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)：
push 到 `main` 即触发，约 1 分钟上线。进度看仓库的 Actions 页。

⚠️ 项目站点跑在子路径 `/YJlabwiki/` 下，所以 workflow 里设了 `BASE_PATH=/YJlabwiki/`。
**将来绑定独立域名时要把这一行删掉**，否则所有链接都会指向错误路径。

两个本地调试的坑：

- `npm run preview` 启动时会缓存文件清单，重新 `build` 后必须重启它，否则页面是无样式的裸 HTML。
  日常用 `npm run dev`。
- `python3 scripts/serve-404-test.py` 模拟真实托管平台的 cleanUrls 与 404 行为
  （`vitepress preview` 在这两点上不准，会让你误判站点有问题）。

## 交接

- 用**实验室公共账号**管仓库，不要挂在个人账号上
- 仓库至少留 2 个管理员，凭据存进组内共享的密码库
- 站点内容**对全网公开** —— GitHub Pages 免费版无法加登录，不要往里写隐私与保密材料
