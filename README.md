# YJlab 维基

实验室内部维基，外观复刻 Wikipedia「Vector (2010)」皮肤，内容为 Markdown，构建产物是纯静态文件 —— 可以直接打包上传到任何静态托管。

- 站点字标：**<span style="color:#d73333">YJ</span>lab**（`YJ` 为维基红 `#d73333`）
- 侧栏两大分类：**世代编年史** / **组别**
- 编辑能力：页面上点「编辑」标签即可用浏览器直接改正文，保存后自动重建

---

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173 实时预览
npm run build      # 产物在 docs/.vitepress/dist/
npm run preview    # 本地预览构建产物
```

> `npm install` 后若 esbuild 报错，是 npm 拦截了 postinstall 脚本，执行 `npm install-scripts approve esbuild` 后重装即可。

> **`npm run preview` 需要重启才生效**：它在启动时会缓存一次文件清单，重新 `build` 后资源哈希变了，旧的服务进程会 404（页面变成无样式的裸 HTML）。改完内容重新构建后，请重启 preview，或者日常直接用 `npm run dev`。

---

## 先做这一件事：填仓库地址

打开 `docs/.vitepress/config.mts`，把顶部的 `REPO` 换成你的真实仓库：

```ts
const REPO = {
  label: 'GitHub',
  editBase: 'https://github.com/你的组织/yjlab-wiki/edit/main/docs/',
  historyBase: 'https://github.com/你的组织/yjlab-wiki/commits/main/docs/',
  discussBase: 'https://github.com/你的组织/yjlab-wiki/issues/new',
  recentChanges: 'https://github.com/你的组织/yjlab-wiki/commits/main',
}
```

填之前，页面上的「编辑」「查看历史」会显示成**红链**（维基百科里表示"页面不存在"的样式）并跳到编辑指南；填之后就会正常跳转到网页编辑器。

---

## 目录结构

```
yjlab-wiki/
├── docs/
│   ├── .vitepress/
│   │   ├── config.mts          站点配置：仓库地址、侧栏分类、Markdown 扩展
│   │   └── theme/
│   │       ├── index.ts        主题入口
│   │       ├── Layout.vue      Vector 皮肤布局（侧栏 / 标签页 / 页脚）
│   │       ├── WikiSearch.vue  侧栏搜索框
│   │       └── wiki.css        维基百科配色与排版
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── images/             图片放这里
│   │   └── search-index.json   构建时自动生成（已 gitignore）
│   ├── index.md                首页
│   ├── chronicle/              世代编年史
│   ├── groups/                 组别
│   ├── help/index.md           编辑指南
│   └── sandbox.md              沙盒
├── scripts/build-search-index.mjs   生成全文检索索引
└── .pages.yml                  Pages CMS 表单式后台配置
```

---

## 编辑方式（三种，任选）

### 1. 网页上直接改（推荐）

打开任意页面 → 点右上角「**编辑**」标签 → 在网页编辑器里改 Markdown → 写一句改动说明 → **Commit changes**。约一分钟后站点自动重建。

### 2. 表单式后台（给不熟悉 Git 的人）

用 [Pages CMS](https://pagescms.org/) 登录 GitHub 并授权本仓库，即可获得「世代编年史 / 组别」两个栏目，像填表单一样编辑。配置已写在 `.pages.yml` 里。

### 3. 本地编辑

```bash
npm run dev
git add -A && git commit -m "更新第三世代" && git push
```

**关于"管理员账号"**：本站是静态站，没有独立注册系统。"管理员"就是代码仓库上的协作者 —— 在 GitHub 仓库的 Settings → Collaborators 里加人即可。要真正的多用户账号体系（网页注册、权限分级），得换成 MediaWiki / Wiki.js 这类带数据库的动态维基。

---

## 写页面时的语法

标准 Markdown 之外，额外提供三个维基风格的容器：

```md
::: hatnote
本条目介绍的是常设组别。关于历史沿革，请见[世代编年史](/chronicle/)。
:::

::: ambox 本条目需要补充
这一节还缺少 2023 年之后的信息。
:::

::: infobox 算法组
| 项目 | 内容 |
| --- | --- |
| 成立时间 | 2021 年 |
:::
```

**中文标点可以放心写在加粗里面**。标准的 CommonMark 有个坑：`**注意：**请勿…`、`**第一世代（猴王初问世）**是…` 这类写法会因为 `**` 左边紧挨全角标点而导致加粗失效、星号原样显示。本项目通过 `docs/.vitepress/markdown-cjk.ts` 在解析前把非 ASCII 标点临时换成私用区字符、解析后再换回来，已经把这个问题修掉了，按中文习惯正常写即可。

每个页面的 frontmatter：

```yaml
---
title: 第一世代 · 猴王初问世
categories:
  - 世代编年史
---
```

新增页面后，记得在 `config.mts` 的 `SIDEBAR` 数组里加上 `{ text, link }`，否则不会出现在侧栏。

---

## 部署

### Cloudflare Pages（推荐，免费）

1. 仓库推到 GitHub
2. [dash.cloudflare.com](https://dash.cloudflare.com/) → Workers & Pages → Create → Pages → 连接 Git 仓库
3. 构建命令 `npm run build`，输出目录 `docs/.vitepress/dist`
4. 保存后拿到 `xxx.pages.dev`，**此时已经可以正常使用**
5. 买了域名后 → Custom domains → 填 `wiki.你的域名.com` → 按提示加一条 CNAME，完成

### Vercel / Netlify

同上：构建命令 `npm run build`，输出目录 `docs/.vitepress/dist`。

### 自己的服务器（Nginx）

```bash
npm run build
rsync -av --delete docs/.vitepress/dist/ user@server:/var/www/yjlab-wiki/
```

```nginx
server {
  listen 443 ssl;
  server_name wiki.example.com;
  root /var/www/yjlab-wiki;
  index index.html;

  # cleanUrls：/chronicle/gen-1 → /chronicle/gen-1.html
  location / {
    try_files $uri $uri.html $uri/ =404;
  }
}
```

部署到中国大陆服务器前必须完成 ICP 备案，且域名需在国内注册商购买。

---

## 如果站点部署在子路径下

`config.mts` 已支持 `BASE_PATH` 环境变量：

```bash
BASE_PATH=/wiki/ npm run build
```

但**更推荐用子域**（`wiki.你的域名.com`），站点跑在根路径，本地与线上完全一致，不会出现资源 404。

---

## 交接注意事项

维基最常见的死法不是没人写，而是**买域名和维护账号的人毕业了**：

1. 用**实验室公共邮箱**注册 GitHub / 域名商 / 托管平台账号，不要用个人邮箱
2. 仓库至少给 **2 个管理员**权限，密码存进组内共享的密码库
3. 域名**直接买 5 年**并开启自动续费
4. 在 `docs/help/index.md` 里写清"谁是当前维护者"，每年更新一次

---

## 参考

- 配色与排版数值取自 [Wikipedia:Vector](https://www.mediawiki.org/wiki/Skin:Vector)（2010 版皮肤）
- 内容授权默认采用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.zh)，如需改为内部保密，请修改 `Layout.vue` 页脚
