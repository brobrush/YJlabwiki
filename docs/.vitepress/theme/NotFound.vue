<script setup lang="ts">
/**
 * 「页面不存在」兜底组件
 *
 * ── 为什么必须有这个文件 ──────────────────────────────────────────
 * VitePress 的客户端路由是这样初始化的：
 *
 *     createRouter(loadPageModule, Theme.NotFound)
 *
 * 当访问的地址匹配不到任何页面时，它把 route.component 设为
 * **主题导出的 NotFound 组件**；如果主题没有导出它，这里就是 null，
 * 结果是整个页面渲染成一片空白（而且控制台不报任何错）。
 *
 * 所以 theme/index.ts 里必须 `export { default as NotFound } from './NotFound.vue'`。
 * 只放一个 docs/404.md 是没用的 —— 那只影响构建产物，不影响这条路由分支。
 */
import { computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'

const route = useRoute()
const { theme } = useData()

/** 访问失败的那个路径，例如 /chronicle/gen-9 */
const missingPath = computed(() => {
  const p = route.path.replace(/^\//, '')
  try {
    return decodeURIComponent(p)
  } catch {
    return p
  }
})

/** 推测它对应的 Markdown 文件，用于「创建本页」预填文件名 */
const missingFile = computed(() => {
  const p = missingPath.value
  if (!p || p.endsWith('/')) return `${p}index.md`
  return `${p}.md`
})

const editCfg = computed<any>(() => (theme.value as any)?.wiki?.edit ?? {})
const repoConfigured = computed(() => {
  const base = editCfg.value.editBase ?? ''
  return !!base && !base.includes('YOUR-ORG')
})

/** 直接在 GitHub 上新建这个页面 */
const createUrl = computed(() => {
  if (!repoConfigured.value) return withBase('/help/')
  const newBase = editCfg.value.editBase.replace('/edit/', '/new/').replace(/\/+$/, '')
  return `${newBase}?filename=${encodeURIComponent(missingFile.value)}`
})
</script>

<template>
  <h1>页面不存在</h1>

  <p>
    <strong>YJlab 维基</strong>上还没有名为「{{ missingPath }}」的页面。
    它可能已被移动或删除，也可能是地址输入有误。
  </p>

  <h2>你可以</h2>
  <ul>
    <li>检查地址栏里的拼写</li>
    <li>用左上角的搜索框搜索相关条目</li>
    <li>在<a :href="withBase('/all-pages')">所有页面</a>列表里翻一翻</li>
    <li>回到<a :href="withBase('/')">首页</a></li>
  </ul>

  <div class="wiki-ambox">
    <div class="wiki-ambox__label">这个页面本该存在？</div>
    <p>
      点右上角的「<strong>创建本页</strong>」标签，可以直接新建
      <code>{{ missingFile }}</code>；
      也可以<a :href="createUrl" target="_blank" rel="noopener">在仓库里手动新建</a>。
      写完提交，几分钟后这个地址就能正常访问了。
    </p>
  </div>

  <h2>常用入口</h2>
  <ul>
    <li><a :href="withBase('/chronicle/')">世代编年史</a> · <a :href="withBase('/groups/')">组别</a></li>
    <li><a :href="withBase('/help/')">编辑指南</a> · <a :href="withBase('/about')">关于本站</a></li>
  </ul>
</template>
