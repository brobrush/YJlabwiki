<script setup lang="ts">
/**
 * XP 桌面 —— 整个页面就是一台电脑
 *
 *   ┌────────────────────────────────────────────┐
 *   │ 桌面图标：TETRIS、我的电脑                  │
 *   │                                            │
 *   │   ┌── 窗口 ──────────────┐                 │
 *   │   │ 可拖动 / 缩放 / 最小化 │                │
 *   │   └───────────────────────┘                │
 *   ├────────────────────────────────────────────┤
 *   │ [开始] │ 窗口按钮…            │  🔊 🖧 12:34 │
 *   └────────────────────────────────────────────┘
 *
 * 页面内容的呈现方式：VitePress 的 <Content /> 只会渲染**当前路由**，
 * 所以"打开页面的窗口"只有一个 —— 换页面等于在这个窗口里导航。
 * 详见 windows.ts 顶部说明。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRoute, useRouter } from 'vitepress'
import {
  PAGE_WIN_ID,
  closeWindow,
  desktopSize,
  openWindow,
  topWindowId,
  windows,
} from './windows'
import { useWikiTheme } from '../themes'
import XpWindow from './XpWindow.vue'
import XpTaskbar from './XpTaskbar.vue'
import XpStartMenu from './XpStartMenu.vue'
import XpMyComputer from './XpMyComputer.vue'
import XpTetris from './XpTetris.vue'
import { useXpOpenPage } from './openPage'

const route = useRoute()
const router = useRouter()
const { page, frontmatter } = useData()
const { setTheme } = useWikiTheme()
const openPage = useXpOpenPage()

const root = ref<HTMLElement | null>(null)
const startOpen = ref(false)
const topId = computed(() => topWindowId())

/* -------------------------------------------------- 桌面可用区域 */

function measure() {
  const el = root.value
  if (!el) return
  desktopSize.w = el.clientWidth
  desktopSize.h = el.clientHeight
}

/* -------------------------------------------------- 桌面图标 */

function openMyComputer() {
  openWindow({
    id: 'win:mycomputer',
    kind: 'mycomputer',
    title: '我的电脑',
    icon: '🖥️',
    w: 760,
    h: 480,
  })
}

function openTetris() {
  openWindow({
    id: 'win:tetris',
    kind: 'tetris',
    title: 'TETRIS',
    icon: '🎮',
    w: 400,
    h: 540,
  })
}

/* -------------------------------------------------- 页面窗口同步 */

function syncPageWindow() {
  const path = route.path
  // 根路径 = 桌面，没有页面窗口
  if (path === '/' || path === '' || path === '/index.html') {
    closeWindow(PAGE_WIN_ID)
    return
  }

  const title =
    (frontmatter.value.title as string) || page.value.title || path.replace(/^\//, '')

  const ex = windows.find((w) => w.id === PAGE_WIN_ID)
  if (ex) {
    ex.title = title
    ex.path = path
  } else {
    openWindow({
      id: PAGE_WIN_ID,
      kind: 'page',
      title,
      path,
      icon: '🌐',
      w: 820,
      h: 560,
    })
  }
}

/** 关闭窗口：页面窗口关掉时回到桌面 */
function closeWin(id: string) {
  closeWindow(id)
  if (id === PAGE_WIN_ID) router.go('/')
}

/* -------------------------------------------------- 生命周期 */

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  syncPageWindow()
  // 点桌面空白处收起开始菜单
  document.addEventListener('click', onDocClick)

  /*
   * ⚠️ 这一句必须留着，否则「直接刷新某个内容页」时窗口里是空白。
   *
   * VitePress 首次加载用的是页面的 **.lean.js** 版本 —— 它只包含动态部分，
   * 静态正文靠 SSR 已经吐出来的 DOM 补全（hydration）。
   * 而 XP 模式会把那层 DOM 整个换成桌面，lean 组件就渲染不出任何东西了。
   *
   * 解决办法：再走一次路由。VitePress 内部 isInitialPageLoad 在第一次
   * loadPage 之后就置为 false，所以这一次会加载**完整版**组件。
   * 目标地址与当前完全相同，不会多出历史记录。
   */
  if (route.path && route.path !== '/') {
    router.go(window.location.href)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  document.removeEventListener('click', onDocClick)
})

function onDocClick() {
  startOpen.value = false
}

watch(() => route.path, syncPageWindow)
watch(() => frontmatter.value.title, syncPageWindow)
</script>

<template>
  <div ref="root" class="xp-desktop" @click="startOpen = false">
    <!-- 桌面图标 -->
    <div class="xp-icons">
      <button class="xp-dicon" @dblclick="openTetris" @click="openTetris">
        <span class="xp-dicon__img xp-dicon__img--game">🎮</span>
        <span class="xp-dicon__label">TETRIS</span>
      </button>
      <button class="xp-dicon" @dblclick="openMyComputer" @click="openMyComputer">
        <span class="xp-dicon__img">🖥️</span>
        <span class="xp-dicon__label">我的电脑</span>
      </button>
    </div>

    <!-- 桌面上的一个小提示牌，告诉人开始菜单在哪 -->
    <div class="xp-hint" @click.stop>
      <b>欢迎使用 YJlab 维基</b>
      <span>侧栏、所有页面和切换主题都在左下角的「开始」里。</span>
    </div>

    <!-- 窗口层 -->
    <XpWindow
      v-for="w in windows"
      :key="w.id"
      :win="w"
      :on-close="closeWin"
    >
      <XpMyComputer v-if="w.kind === 'mycomputer'" />
      <XpTetris v-else-if="w.kind === 'tetris'" :active="topId === w.id" />
      <div v-else class="xp-page">
        <div class="wiki-body xp-page__body">
          <Content />
        </div>
      </div>
    </XpWindow>

    <!-- 开始菜单 -->
    <XpStartMenu v-if="startOpen" @close="startOpen = false" />

    <!-- 任务栏 -->
    <XpTaskbar
      :start-open="startOpen"
      @toggle-start="startOpen = !startOpen"
    />
  </div>
</template>
