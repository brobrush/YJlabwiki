<script setup lang="ts">
/**
 * 侧栏搜索框 —— 复刻维基百科 Vector 皮肤的双按钮搜索，
 * 数据来自构建时生成的 /search-index.json（无需后端）。
 */
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'

interface Entry {
  title: string
  url: string
  text: string
}

const query = ref('')
const entries = ref<Entry[] | null>(null)
const focused = ref(false)

async function load() {
  if (entries.value) return
  try {
    const res = await fetch(withBase('/search-index.json'))
    entries.value = res.ok ? await res.json() : []
  } catch {
    entries.value = []
  }
}

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q || !entries.value) return []
  const terms = q.split(/\s+/).filter(Boolean)
  const scored: Array<{ e: Entry; score: number }> = []
  for (const e of entries.value) {
    const title = e.title.toLowerCase()
    const body = (e.text || '').toLowerCase()
    let score = 0
    let hit = true
    for (const term of terms) {
      if (title === term) score += 100
      else if (title.includes(term)) score += 30
      else if (body.includes(term)) score += 5
      else {
        hit = false
        break
      }
    }
    if (hit) scored.push({ e, score })
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.e)
})

const showPanel = computed(() => focused.value && query.value.trim().length > 0)

function go(entry?: Entry) {
  const target = entry ?? results.value[0]
  if (target) {
    focused.value = false
    window.location.href = withBase(target.url)
  }
}

function onFocus() {
  focused.value = true
  load()
}

function onBlur() {
  // 延迟关闭，保证点击结果项能被注册
  setTimeout(() => (focused.value = false), 180)
}
</script>

<template>
  <div class="wiki-search">
    <label class="wiki-search__label" for="wiki-search-input">搜索</label>
    <input
      id="wiki-search-input"
      v-model="query"
      class="wiki-search__input"
      type="search"
      autocomplete="off"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.enter.prevent="go()"
    />
    <div class="wiki-search__buttons">
      <button class="wiki-search__btn" type="button" @click="go()">搜索</button>
    </div>

    <ul v-if="showPanel" class="wiki-search__results">
      <li v-for="item in results" :key="item.url">
        <a :href="withBase(item.url)" @mousedown.prevent="go(item)">{{ item.title }}</a>
        <small>{{ item.text.slice(0, 60) }}</small>
      </li>
      <li v-if="results.length === 0" class="wiki-search__empty">没有匹配的条目</li>
    </ul>
  </div>
</template>
