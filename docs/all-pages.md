---
title: 所有页面
---

<script setup>
import { ref, onMounted, computed } from 'vue'
import { withBase } from 'vitepress'

const pages = ref([])
const state = ref('loading') // loading | ok | failed

onMounted(async () => {
  try {
    const res = await fetch(withBase('/search-index.json'))
    if (!res.ok) throw new Error(String(res.status))
    pages.value = await res.json()
    state.value = 'ok'
  } catch {
    state.value = 'failed'
  }
})

/** 顶层目录 → 显示名 */
const SECTIONS = {
  '': '首页与其他',
  chronicle: '世代编年史',
  groups: '组别',
  tools: '工具介绍',
  help: '帮助',
}

const groups = computed(() => {
  const map = new Map()
  for (const p of pages.value) {
    // 顶层文件（/about、/sandbox、/）归入「首页与其他」，
    // 只有带目录的页面（/chronicle/gen-1）才按第一级目录分组
    const parts = p.url.split('/').filter(Boolean)
    const seg = parts.length <= 1 ? '' : parts[0]
    if (!map.has(seg)) map.set(seg, [])
    map.get(seg).push(p)
  }
  const order = ['', 'chronicle', 'groups', 'tools', 'help']
  const rank = (k) => (order.indexOf(k) === -1 ? order.length : order.indexOf(k))
  return [...map.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([seg, items]) => ({
      label: SECTIONS[seg] ?? seg,
      items: [...items].sort((a, b) => a.title.localeCompare(b.title, 'zh')),
    }))
})
</script>

::: hatnote
本页列出站内全部页面，相当于维基百科的「Special:所有页面」。找特定内容请用左上角的搜索框。
:::

**所有页面**按分类汇总本站的全部条目。侧栏只收录主要条目，这里则是完整清单 —— 包括那些没有挂到侧栏上的页面。

<div v-if="state === 'loading'">正在加载页面列表…</div>

<div v-else-if="state === 'failed'">
  页面列表加载失败。请刷新重试，或直接使用左上角的搜索框。
</div>

<template v-else>
  <p>本站目前共有 <strong>{{ pages.length }}</strong> 个页面。</p>

  <template v-for="g in groups" :key="g.label">
    <h2>{{ g.label }}</h2>
    <ul>
      <li v-for="p in g.items" :key="p.url">
        <a :href="withBase(p.url)">{{ p.title }}</a>
      </li>
    </ul>
  </template>
</template>

## 相关页面

- [世代编年史](/chronicle/) · [组别](/groups/)
- [编辑指南](/help/) —— 想新增页面请看这里
- [关于本站](/about)
