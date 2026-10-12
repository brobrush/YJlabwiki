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

## 仓库绑定状态

站点已绑定到 **[brobrush/YJlabwiki](https://github.com/brobrush/YJlabwiki)**（私有仓库，默认分支 `main`），`docs/.vitepress/config.mts` 顶部的 `REPO` 已配置好：

```ts
const REPO = {
  label: 'GitHub',
  editBase: 'https://github.com/brobrush/YJlabwiki/edit/main/docs/',
  historyBase: 'https://github.com/brobrush/YJlabwiki/commits/main/docs/',
  discussBase: 'https://github.com/brobrush/YJlabwiki/issues/new',
  recentChanges: 'https://github.com/brobrush/YJlabwiki/commits/main',
}
```

如果以后要把仓库改名或迁移到别的账号，改这四行即可，其余地方不用动。

> ⚠️ **仓库是私有的**，所以「编辑」标签只对**已加入协作者的人**有效。普通访客（未登录 GitHub 或没有权限）点「编辑」会看到 GitHub 的 404 页面。想让任何人都能提交修改，需要把仓库改成公开 —— 那样外部读者可以走 fork + Pull Request 的流程。

> 判断逻辑：`Layout.vue` 里会检查 `editBase` 是否还含占位符 `YOUR-ORG`。含则「编辑」「查看历史」渲染成**红链**（维基里"页面不存在"的样式）并跳到编辑指南，同时在正文顶部显示一条提醒；不含则一切正常。所以迁移时只要把 `YOUR-ORG` 换掉，提示会自动消失。

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

### GitHub Pages（当前使用中）

**线上地址：https://brobrush.github.io/YJlabwiki/**

已经配置好了，不需要再做任何操作。机制：

| 环节 | 说明 |
| --- | --- |
| 触发 | 往 `main` 分支提交（包括在网页上点「编辑」改完 Markdown 后提交） |
| 工作流 | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |
| 构建 | `npm ci` → `npm run build`（带 `BASE_PATH=/YJlabwiki/`） |
| 产物 | `docs/.vitepress/dist`，通过 `upload-pages-artifact` + `deploy-pages` 发布 |
| 生效时间 | 通常 1 分钟内 |
| 查看进度 | https://github.com/brobrush/YJlabwiki/actions |

也可以在 Actions 页面手动点 **Run workflow** 强制重新部署。

::: warning 两个必须知道的限制
1. **站点对全网公开**，无法加登录。GitHub Pages 的「私有发布」（访问控制）是 GitHub Enterprise Cloud 专属功能；免费/Pro/Team 套餐下，**即使仓库是私有的，站点也公开在互联网上**。所以这个 wiki 里不要写人员手机号、未公开评审意见、合作方保密材料等。
2. **免费套餐只支持公开仓库**。当初在私有仓库上启用 Pages 会直接报 `Your current plan does not support GitHub Pages for this repository.`，所以本仓库已转为**公开**。
:::

### 换成独立域名

买了域名之后：

1. DNS 加一条 CNAME：`wiki.你的域名.com` → `brobrush.github.io`
2. 仓库 Settings → Pages → Custom domain 填入该域名，勾选 Enforce HTTPS
3. **删掉 workflow 里的 `BASE_PATH: /YJlabwiki/`** —— 绑定域名后站点跑在根路径，不再需要前缀
4. 提交，等一次自动部署

### Cloudflare Pages / Vercel / Netlify

产物就是纯静态文件，换托管商随时可以：

- 构建命令 `npm run build`，输出目录 `docs/.vitepress/dist`
- 跑在根路径时不要设置 `BASE_PATH`

> Cloudflare Pages 相比 GitHub Pages 唯一实质性的优势：可以接 **Cloudflare Access**（免费版 50 人以内）给站点套一层邮箱登录，做到"未登录连 HTML 都拿不到"。如果以后 wiki 里要放不能公开的内容，就换过去。

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
