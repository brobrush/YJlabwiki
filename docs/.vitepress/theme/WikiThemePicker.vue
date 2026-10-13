<script setup lang="ts">
/**
 * 侧栏「外观」选择器 —— 对应维基百科侧栏里的「外观」设置。
 * 选中的主题记在 localStorage，刷新、跳页都保持。
 */
import { onMounted, ref } from 'vue'
import {
  DEFAULT_THEME,
  THEMES,
  applyTheme,
  readStoredTheme,
  storeTheme,
} from './themes'

const current = ref(DEFAULT_THEME)

onMounted(() => {
  // SSR 阶段拿不到 localStorage，挂载后再同步一次真实状态
  current.value = readStoredTheme()
  applyTheme(current.value)
})

function pick(id: string) {
  current.value = id
  applyTheme(id)
  storeTheme(id)
}
</script>

<template>
  <nav class="wiki-portal wiki-portal--theme" aria-label="外观">
    <h3 class="wiki-portal__title">外观</h3>
    <ul>
      <li
        v-for="t in THEMES"
        :key="t.id"
        :class="{ 'is-active': current === t.id }"
        :title="t.hint"
      >
        <a href="#" @click.prevent="pick(t.id)">{{ t.label }}</a>
      </li>
    </ul>
  </nav>
</template>
