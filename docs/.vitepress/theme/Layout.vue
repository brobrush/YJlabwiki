<script setup lang="ts">
/**
 * Wikipedia「Vector (2010)」皮肤布局
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │ 个人工具栏（右上）                                    │
 * ├────────────┬─────────────────────────────────────────┤
 * │  YJlab     │ [条目][讨论]              [阅读][编辑][查看历史] │
 * │  实验室维基 ├─────────────────────────────────────────┤
 * │  搜索…     │                                         │
 * │  导航      │   正文（Markdown 渲染结果）              │
 * │  世代编年史 │                                         │
 * │  组别      │   分类栏 / 页脚                          │
 * └────────────┴─────────────────────────────────────────┘
 */
import { computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import WikiSearch from './WikiSearch.vue'
import WikiThemePicker from './WikiThemePicker.vue'

const { site, page, theme, frontmatter } = useData()
const route = useRoute()

const cfg = computed<any>(() => (theme.value as any).wiki ?? {})
const wordmark = computed(() => cfg.value.wordmark ?? { red: 'YJ', rest: 'lab' })
const tagline = computed(() => cfg.value.tagline ?? '')
const categories = computed<any[]>(() => cfg.value.categories ?? [])
const navItems = computed<any[]>(() => cfg.value.nav ?? [])
const toolItems = computed<any[]>(() => cfg.value.tools ?? [])
const personalItems = computed<any[]>(() => cfg.value.personal ?? [])
const editCfg = computed<any>(() => cfg.value.edit ?? {})

/* ---------------------------------------------------------------- 路径信息 */

const currentPath = computed(() => route.path.replace(/index\.html$/, '').replace(/\.html$/, ''))

const relPath = computed<string>(() => page.value.relativePath ?? '')

function isActive(link?: string) {
  if (!link) return false
  const normalized = link.endsWith('/') ? link : link.replace(/\.html$/, '')
  const current = currentPath.value
  if (normalized === '/') return current === '/' || current === ''
  return current === normalized || current === normalized + '/' || current === normalized + '.html'
}

function href(link: string) {
  if (/^(https?:)?\/\//.test(link) || link.startsWith('mailto:')) return link
  return withBase(link)
}

function isExternal(link: string) {
  return /^(https?:)?\/\//.test(link)
}

/* ---------------------------------------------------------------- 页面信息 */

const pageTitle = computed<string>(
  () => (frontmatter.value.title as string) || page.value.title || '',
)

/* ------------------------------------------------------------ 编辑相关链接 */

const editBase = computed<string>(() => editCfg.value.editBase ?? '')
const historyBase = computed<string>(() => editCfg.value.historyBase ?? '')
const discussBase = computed<string>(() => editCfg.value.discussBase ?? '')

/** 仓库地址还没填时，改成指向编辑指南（顺便演示维基红链样式） */
const repoConfigured = computed(() => !!editBase.value && !editBase.value.includes('YOUR-ORG'))

const editUrl = computed(() =>
  repoConfigured.value && relPath.value ? editBase.value + relPath.value : withBase('/help/'),
)
const historyUrl = computed(() =>
  repoConfigured.value && relPath.value ? historyBase.value + relPath.value : withBase('/help/'),
)
const discussUrl = computed(() => {
  if (!repoConfigured.value || !discussBase.value) return withBase('/help/')
  const title = encodeURIComponent(`[讨论] ${pageTitle.value}`)
  const sep = discussBase.value.includes('?') ? '&' : '?'
  return `${discussBase.value}${sep}title=${title}`
})

const pageCategories = computed<string[]>(() => {
  const c = frontmatter.value.categories
  if (Array.isArray(c)) return c as string[]
  if (typeof c === 'string') return [c]
  return []
})

const lastUpdated = computed<string>(() => {
  const raw = (page.value as any).lastUpdated ?? (frontmatter.value as any).lastUpdated
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
})

/** 仓库地址没填时，首页顶部提示一条 */
const showSetupNotice = computed(() => !repoConfigured.value)

/* ------------------------------------------------------------ 随机条目 */

const allEntryLinks = computed<string[]>(() => {
  const out: string[] = []
  for (const cat of categories.value) {
    for (const item of cat.items ?? []) {
      if (item.link) out.push(item.link)
    }
  }
  return out
})

function randomEntry(e: Event) {
  e.preventDefault()
  const pool = allEntryLinks.value
  if (!pool.length) return
  const pick = pool[Math.floor(Math.random() * pool.length)]
  window.location.href = withBase(pick)
}

/** 分类名 → 对应的分类索引页（取侧栏该分类的第一条） */
function categoryHref(name: string) {
  const cat = categories.value.find((c: any) => c.title === name)
  const first = cat?.items?.find((i: any) => i.link)
  return first ? withBase(first.link) : withBase('/')
}

/* -------------------------------------------------------------- 404 处理 */

const isNotFound = computed(() => (page.value as any)?.isNotFound === true)

/** 访问失败的那个路径，例如 /chronicle/gen-9 */
const missingPath = computed(() => {
  const p = route.path.replace(/^\//, '')
  try {
    return decodeURIComponent(p)
  } catch {
    return p
  }
})

/** 推测该路径对应的 Markdown 文件，供「创建本页」预填文件名 */
const missingFile = computed(() => {
  const p = missingPath.value
  if (!p || p.endsWith('/')) return `${p}index.md`
  return `${p}.md`
})

/** 404 时「编辑」标签变成「创建本页」，直接打开 GitHub 的新建文件页 */
const createUrl = computed(() => {
  if (!repoConfigured.value) return withBase('/help/')
  const newBase = editBase.value.replace('/edit/', '/new/').replace(/\/+$/, '')
  return `${newBase}?filename=${encodeURIComponent(missingFile.value)}`
})

/* ------------------------------------------------------------ 页脚与个人栏 */

/** 侧栏「工具」里那条外链（最近更改） */
const recentChangesUrl = computed<string>(() => {
  const t = toolItems.value.find((i: any) => i.external && i.link)
  return t?.link ?? withBase('/help/')
})

const loginUrl = computed<string>(() => cfg.value.login?.link ?? 'https://github.com/login')
const loginText = computed<string>(() => cfg.value.login?.text ?? '登录 GitHub')
</script>

<template>
  <div class="wiki-page-base" />
  <div class="wiki-shell">
    <!-- ============================ 左侧面板 ============================ -->
    <aside class="wiki-panel">
      <a class="wiki-logo" :href="withBase('/')">
        <span class="wiki-logo__mark">
          <span class="wiki-logo__red">{{ wordmark.red }}</span>{{ wordmark.rest }}
        </span>
        <span class="wiki-logo__tagline">{{ tagline }}</span>
      </a>

      <WikiSearch />

      <!-- 导航 -->
      <nav v-if="navItems.length" class="wiki-portal wiki-portal--nav">
        <h3 class="wiki-portal__title">导航</h3>
        <ul>
          <li v-for="item in navItems" :key="item.link" :class="{ 'is-active': isActive(item.link) }">
            <a :href="href(item.link)">{{ item.text }}</a>
          </li>
        </ul>
      </nav>

      <!-- ▼ 三大分类：世代编年史 / 组别 / 工具介绍（由 config.mts 的 SIDEBAR 驱动）▼ -->
      <nav
        v-for="cat in categories"
        :key="cat.title"
        class="wiki-portal"
        :aria-label="cat.title"
      >
        <h3 class="wiki-portal__title">{{ cat.title }}</h3>
        <ul>
          <li
            v-for="item in cat.items"
            :key="item.link"
            :class="{ 'is-active': isActive(item.link) }"
          >
            <a :href="href(item.link)">{{ item.text }}</a>
          </li>
        </ul>
      </nav>

      <!-- 外观：切换主题（维基百科 / 传奇打金服 / …），选择记在 localStorage -->
      <WikiThemePicker />

      <!-- 工具 -->
      <nav v-if="toolItems.length" class="wiki-portal wiki-portal--tools">
        <h3 class="wiki-portal__title">本站工具</h3>
        <ul>
          <li v-for="item in toolItems" :key="item.text">
            <a
              v-if="item.random"
              href="#"
              @click="randomEntry"
            >{{ item.text }}</a>
            <a v-else :href="href(item.link)">{{ item.text }}</a>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- ============================ 个人工具栏 ============================ -->
    <div class="wiki-head">
      <ul>
        <li v-for="item in personalItems" :key="item.text">
          <a :href="href(item.link)">{{ item.text }}</a>
        </li>
        <li>
          <a :href="loginUrl" target="_blank" rel="noopener">{{ loginText }}</a>
        </li>
      </ul>
    </div>

    <!-- ============================== 标签页 ============================== -->
    <div class="wiki-tabs">
      <div class="wiki-tabs__left">
        <div class="wiki-tab is-active">
          <span :class="{ 'wiki-tab__redlink': isNotFound }">条目</span>
        </div>
        <div class="wiki-tab"><a :href="discussUrl" target="_blank" rel="noopener">讨论</a></div>
      </div>
      <div class="wiki-tabs__right">
        <div class="wiki-tab is-active"><span>阅读</span></div>
        <div class="wiki-tab">
          <a
            :href="isNotFound ? createUrl : editUrl"
            :class="{ 'wiki-tab__redlink': !repoConfigured || isNotFound }"
            target="_blank"
            rel="noopener"
          >{{ isNotFound ? '创建本页' : '编辑' }}</a>
        </div>
        <div class="wiki-tab" v-if="!isNotFound">
          <a
            :href="historyUrl"
            :class="{ 'wiki-tab__redlink': !repoConfigured }"
            target="_blank"
            rel="noopener"
          >查看历史</a>
        </div>
      </div>
    </div>

    <!-- ============================== 正文区 ============================== -->
    <div class="wiki-content-wrap">
      <main class="wiki-content">
        <div v-if="showSetupNotice" class="wiki-sitenotice">
          本维基尚未绑定代码仓库 —— 请先在
          <code>docs/.vitepress/config.mts</code> 里填写 <code>REPO</code>，
          之后「编辑」「讨论」「查看历史」标签即可直接跳到网页编辑器。
        </div>

        <div class="wiki-body">
          <!--
            404 时 Content 渲染的是 docs/404.md 的内容
            （VitePress 把它作为找不到页面时的兜底组件）。
            千万不要删掉 docs/404.md —— 否则未知地址会是一片空白。
          -->
          <Content />
        </div>

        <!-- 分类栏 -->
        <div v-if="pageCategories.length && !isNotFound" class="wiki-categories">
          <span class="wiki-categories__label">分类</span>：
          <template v-for="(c, i) in pageCategories" :key="c">
            <a :href="categoryHref(c)">{{ c }}</a><span v-if="i < pageCategories.length - 1"> | </span>
          </template>
        </div>

        <p v-if="lastUpdated && !isNotFound" class="wiki-lastmod">本页面最后修订于 {{ lastUpdated }}。</p>

        <!-- 页脚 -->
        <footer class="wiki-footer">
          <ul>
            <li><a :href="withBase('/help/')">编辑指南</a></li>
            <li><a :href="withBase('/all-pages')">所有页面</a></li>
            <li><a :href="withBase('/about')">关于 YJlab</a></li>
            <li><a :href="recentChangesUrl" target="_blank" rel="noopener">最近更改</a></li>
          </ul>
          <p>
            除非另有说明，本维基内容采用
            <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh" target="_blank" rel="noopener">
              知识共享 署名-相同方式共享 4.0 国际
            </a>
            协议授权。本站为实验室内部资料，风格致敬
            <a href="https://zh.wikipedia.org/" target="_blank" rel="noopener">维基百科</a>。
          </p>
        </footer>
      </main>
    </div>
  </div>
</template>
