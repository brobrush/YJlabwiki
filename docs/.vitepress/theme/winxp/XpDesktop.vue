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
 * 页面窗口的正文来自 xpPages.ts（各自 fetch 静态 HTML），
 * 所以**多个页面窗口可以同时开着**，互不干扰。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import {
  desktopSize,
  openWindow,
  topWindowId,
  windows,
  type XpWin,
} from './windows'
import { useWikiTheme } from '../themes'
import { cachedPage, hrefToPath, loadPage, stripBase } from './xpPages'
import { useXpOpenPage } from './openPage'
import XpIcon from './XpIcon.vue'
import XpWindow from './XpWindow.vue'
import XpTaskbar from './XpTaskbar.vue'
import XpStartMenu from './XpStartMenu.vue'
import XpMyComputer from './XpMyComputer.vue'
import XpTetris from './XpTetris.vue'

const route = useRoute()
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
    icon: 'computer',
    w: 760,
    h: 480,
  })
}

function openTetris() {
  openWindow({
    id: 'win:tetris',
    kind: 'tetris',
    title: 'TETRIS',
    icon: 'game',
    w: 400,
    h: 540,
  })
}

/* -------------------------------------------------- 与路由同步
 *
 * 只负责"路由指向某页时，那个页面的窗口得存在"。
 * 不做置顶（不然每次跳转都会把窗口拽到最前面，很烦），
 * 关闭窗口时也不改路由 —— 免得点个叉就把当前地址跳走。
 */

function ensurePageWindow() {
  // route.path 带 base，必须先剥掉再当应用路径用
  const path = stripBase(route.path || '/')
  if (path === '/') return

  const title =
    (frontmatter.value.title as string) || page.value.title || path.replace(/^\//, '')

  if (!windows.find((w) => w.id === 'page:' + path)) {
    openWindow({
      id: 'page:' + path,
      kind: 'page',
      path,
      title,
      icon: 'globe',
      w: 820,
      h: 560,
    })
  }
  loadPage(path, title)
}

/* -------------------------------------------------- 页面窗口正文 */

function pageHtml(path: string | undefined) {
  if (!path) return ''
  const p = cachedPage(path)
  if (!p || p.state === 'loading') return '<p class="xp-page__note">载入中…</p>'
  return p.html
}

/**
 * 事件委托：抓来的正文是静态快照，里面的 <a> 不会自己走 SPA 路由，
 * 所以在这里统一接管 —— 站内链接开/聚焦对应窗口，外链和锚点放行。
 */
function onPageClick(e: MouseEvent) {
  const a = (e.target as HTMLElement | null)?.closest?.('a')
  if (!a) return

  const raw = a.getAttribute('href') || ''

  // 页内锚点：在窗口里滚过去，不要动整个文档
  if (raw.startsWith('#')) {
    e.preventDefault()
    const box = (e.currentTarget as HTMLElement).querySelector(raw)
    box?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }

  const path = hrefToPath(raw)
  if (path === null) return // 外链，交给浏览器

  e.preventDefault()
  openPage(path, a.textContent?.trim() || undefined)
}

/* -------------------------------------------------- 生命周期 */

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  ensurePageWindow()
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measure)
  document.removeEventListener('click', onDocClick)
})

function onDocClick() {
  startOpen.value = false
}

watch(() => route.path, ensurePageWindow)
watch(() => frontmatter.value.title, ensurePageWindow)
</script>

<template>
  <div ref="root" class="xp-desktop" @click="startOpen = false">
    <!-- 桌面图标 -->
    <div class="xp-icons">
      <button class="xp-dicon" @click="openTetris">
        <XpIcon class="xp-dicon__img xp-dicon__img--game" name="game" :size="34" />
        <span class="xp-dicon__label">TETRIS</span>
      </button>
      <button class="xp-dicon" @click="openMyComputer">
        <XpIcon class="xp-dicon__img" name="computer" :size="34" />
        <span class="xp-dicon__label">我的电脑</span>
      </button>
    </div>

    <!-- 桌面上的小提示牌 -->
    <div class="xp-hint" @click.stop>
      <b>欢迎使用 YJlab 维基</b>
      <span>侧栏、所有页面和切换主题都在左下角的「开始」里。</span>
    </div>

    <!-- 窗口层 -->
    <XpWindow v-for="w in windows" :key="w.id" :win="w">
      <XpMyComputer v-if="w.kind === 'mycomputer'" />
      <XpTetris v-else-if="w.kind === 'tetris'" :active="topId === w.id" />
      <div v-else class="xp-page">
        <div
          class="wiki-body xp-page__body"
          @click="onPageClick"
          v-html="pageHtml(w.path)"
        />
      </div>
    </XpWindow>

    <!-- 开始菜单 -->
    <XpStartMenu v-if="startOpen" @close="startOpen = false" />

    <!-- 任务栏 -->
    <XpTaskbar :start-open="startOpen" @toggle-start="startOpen = !startOpen" />
  </div>
</template>
