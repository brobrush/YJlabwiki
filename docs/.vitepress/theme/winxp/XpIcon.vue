<script setup lang="ts">
/** 渲染一个 XP 风格图标（见 icons.ts） */
import { computed } from 'vue'
import { ICONS } from './icons'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), {
  size: 16,
})

const src = computed(() => ICONS[props.name] ?? ICONS.file)
</script>

<template>
  <img
    class="xp-ico"
    :src="src"
    :width="size"
    :height="size"
    alt=""
    draggable="false"
  />
</template>
