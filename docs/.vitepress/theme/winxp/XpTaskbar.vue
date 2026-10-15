<script setup lang="ts">
/**
 * 底部任务栏：开始按钮 + 已打开窗口的按钮 + 右下角时钟
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { focusWindow, toggleMinimize, topWindowId, windows } from './windows'

defineProps<{ startOpen: boolean }>()
const emit = defineEmits<{ (e: 'toggle-start'): void }>()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000 * 20)
})
onBeforeUnmount(() => clearInterval(timer))

const clock = computed(() =>
  now.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
)

const top = computed(() => topWindowId())

function clickWin(id: string, min: boolean) {
  if (min) toggleMinimize(id)
  else if (top.value === id) toggleMinimize(id)
  else focusWindow(id)
}
</script>

<template>
  <!--
    ⚠️ .stop 不能省。XpDesktop 的根元素上有 @click="startOpen = false"
    （点桌面空白处收起开始菜单），如果不阻止冒泡，点开始按钮会先打开、
    再被根元素立刻关掉 —— 表现就是"开始菜单点不开"。
  -->
  <div class="xp-taskbar" @click.stop>
    <button
      class="xp-startbtn"
      :class="{ 'is-open': startOpen }"
      @click.stop="emit('toggle-start')"
    >
      <span class="xp-startbtn__flag">🪟</span>
      <span class="xp-startbtn__text">开始</span>
    </button>

    <div class="xp-taskbar__sep" />

    <div class="xp-taskbar__wins">
      <button
        v-for="w in windows"
        :key="w.id"
        class="xp-taskbtn"
        :class="{ 'is-active': top === w.id && !w.min }"
        @click="clickWin(w.id, w.min)"
      >
        <span class="xp-taskbtn__ico">{{ w.icon }}</span>
        <span class="xp-taskbtn__text">{{ w.title }}</span>
      </button>
    </div>

    <div class="xp-tray">
      <span class="xp-tray__ico" title="音量">🔊</span>
      <span class="xp-tray__ico" title="网络">🖧</span>
      <span class="xp-tray__clock">{{ clock }}</span>
    </div>
  </div>
</template>
