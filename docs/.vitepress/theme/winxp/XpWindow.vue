<script setup lang="ts">
/**
 * XP 风格的可操作窗口
 *
 * 支持：拖动标题栏、右下角/右边缘/下边缘缩放、最小化、最大化（双击标题栏也行）、
 *       关闭、点击任意位置置顶、非活动时标题栏变灰。
 */
import { computed, ref } from 'vue'
import XpIcon from './XpIcon.vue'
import {
  type XpWin,
  closeWindow,
  desktopSize,
  focusWindow,
  toggleMaximize,
  toggleMinimize,
  topWindowId,
} from './windows'

const props = defineProps<{ win: XpWin }>()

const isActive = computed(() => topWindowId() === props.win.id)

/* ------------------------------------------------------------ 拖动 */

let drag: { dx: number; dy: number } | null = null

function startDrag(e: MouseEvent) {
  if (props.win.max) return
  const target = e.target as HTMLElement
  if (target.closest('.xp-wbtn')) return // 点按钮不算拖拽
  focusWindow(props.win.id)
  drag = { dx: e.clientX - props.win.x, dy: e.clientY - props.win.y }
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', endDrag)
  e.preventDefault()
}

function onDrag(e: MouseEvent) {
  if (!drag) return
  props.win.x = Math.min(
    Math.max(-props.win.w + 90, e.clientX - drag.dx),
    desktopSize.w - 60,
  )
  props.win.y = Math.min(Math.max(0, e.clientY - drag.dy), desktopSize.h - 30)
}

function endDrag() {
  drag = null
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', endDrag)
}

/* ------------------------------------------------------------ 缩放 */

const resizing = ref<'' | 'se' | 'e' | 's'>('')

function startResize(e: MouseEvent, dir: 'se' | 'e' | 's') {
  if (props.win.max) return
  focusWindow(props.win.id)
  resizing.value = dir
  const start = {
    x: e.clientX,
    y: e.clientY,
    w: props.win.w,
    h: props.win.h,
  }
  function move(ev: MouseEvent) {
    if (dir === 'se' || dir === 'e') {
      props.win.w = Math.max(260, start.w + (ev.clientX - start.x))
    }
    if (dir === 'se' || dir === 's') {
      props.win.h = Math.max(160, start.h + (ev.clientY - start.y))
    }
  }
  function up() {
    resizing.value = ''
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
  e.preventDefault()
  e.stopPropagation()
}

/* ------------------------------------------------------------ 尺寸 */

const style = computed(() => {
  const w = props.win
  if (w.max) {
    return {
      left: '0px',
      top: '0px',
      width: desktopSize.w + 'px',
      height: desktopSize.h + 'px',
      zIndex: w.z,
      display: w.min ? 'none' : 'flex',
    }
  }
  return {
    left: w.x + 'px',
    top: w.y + 'px',
    width: w.w + 'px',
    height: w.h + 'px',
    zIndex: w.z,
    display: w.min ? 'none' : 'flex',
  }
})

function onTitleDblClick() {
  toggleMaximize(props.win.id)
}

function onCloseClick() {
  closeWindow(props.win.id)
}
</script>

<template>
  <div
    class="xp-win"
    :class="{ 'is-active': isActive, 'is-max': win.max }"
    :style="style"
    @mousedown="focusWindow(win.id)"
  >
    <div class="xp-win__title" @mousedown="startDrag" @dblclick="onTitleDblClick">
      <XpIcon class="xp-win__icon" :name="win.icon" :size="16" />
      <span class="xp-win__text">{{ win.title }}</span>
      <span class="xp-btns">
        <button class="xp-wbtn xp-wbtn--min" title="最小化" @click.stop="toggleMinimize(win.id)">
          <span />
        </button>
        <button
          class="xp-wbtn xp-wbtn--max"
          :title="win.max ? '向下还原' : '最大化'"
          @click.stop="toggleMaximize(win.id)"
        >
          <span />
        </button>
        <button class="xp-wbtn xp-wbtn--close" title="关闭" @click.stop="onCloseClick">
          <span>✕</span>
        </button>
      </span>
    </div>

    <div class="xp-win__body">
      <slot />
    </div>

    <template v-if="!win.max">
      <div class="xp-rs xp-rs--e" @mousedown="startResize($event, 'e')" />
      <div class="xp-rs xp-rs--s" @mousedown="startResize($event, 's')" />
      <div class="xp-rs xp-rs--se" @mousedown="startResize($event, 'se')" />
    </template>
  </div>
</template>
