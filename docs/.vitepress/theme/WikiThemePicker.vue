<script setup lang="ts">
/**
 * 侧栏「外观」选择器 —— 对应维基百科侧栏里的「外观」设置。
 * 状态来自 themes.ts 的共享 ref，选中的主题记在 localStorage，刷新、跳页都保持。
 */
import { useWikiTheme } from './themes'

const { theme, setTheme, themes } = useWikiTheme()
</script>

<template>
  <nav class="wiki-portal wiki-portal--theme" aria-label="外观">
    <h3 class="wiki-portal__title">外观</h3>
    <ul>
      <li
        v-for="t in themes"
        :key="t.id"
        :class="{ 'is-active': theme === t.id }"
        :title="t.hint"
      >
        <a href="#" @click.prevent="setTheme(t.id)">{{ t.label }}</a>
      </li>
    </ul>
  </nav>
</template>
