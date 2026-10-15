<script setup lang="ts">
/**
 * 开始菜单（点左下角绿色「开始」打开）
 *
 * 这里装着原来的侧栏内容：各个栏目与条目、所有页面、编辑指南、关于，
 * 以及**切换回其他主题**的入口。
 */
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { useWikiTheme } from '../themes'
import XpIcon from './XpIcon.vue'
import { useXpOpenPage } from './openPage'

const emit = defineEmits<{ (e: 'close'): void }>()

const { theme } = useData()
const { theme: currentTheme, setTheme, themes } = useWikiTheme()
const openPage = useXpOpenPage()

const cfg = computed<any>(() => (theme.value as any)?.wiki ?? {})
const categories = computed<any[]>(() => cfg.value.categories ?? [])
const toolItems = computed<any[]>(() => cfg.value.tools ?? [])
const personalItems = computed<any[]>(() => cfg.value.personal ?? [])

const allLinks = computed<string[]>(() =>
  categories.value.flatMap((c: any) => (c.items ?? []).map((i: any) => i.link)),
)

function go(path: string, title?: string) {
  openPage(path, title)
  emit('close')
}

function openRandom() {
  const pool = allLinks.value
  if (!pool.length) return
  const link = pool[Math.floor(Math.random() * pool.length)]
  const item = categories.value.flatMap((c: any) => c.items).find((i: any) => i.link === link)
  go(link, item?.text)
}

function pickTheme(id: string) {
  setTheme(id)
  emit('close')
}
</script>

<template>
  <div class="xp-start" @click.stop>
    <header class="xp-start__user">
      <XpIcon class="xp-start__avatar" name="computer" :size="24" />
      <span class="xp-start__name">YJlab</span>
    </header>

    <div class="xp-start__cols">
      <!-- 左栏：栏目与条目 -->
      <div class="xp-start__left">
        <div v-for="cat in categories" :key="cat.title" class="xp-start__group">
          <div class="xp-start__grouptitle">{{ cat.title }}</div>
          <button
            v-for="item in cat.items"
            :key="item.link"
            class="xp-start__item"
            @click="go(item.link, item.text)"
          >
            <XpIcon class="xp-start__ico" name="file" :size="15" />{{ item.text }}
          </button>
        </div>

        <div class="xp-start__sep" />

        <!-- 所有页面 / 编辑指南 / 仓库 已经在右栏的「本站工具」里了，这里不重复 -->
        <button class="xp-start__item" @click="go('/about', '关于本站')">
          <XpIcon class="xp-start__ico" name="info" :size="15" />关于本站
        </button>
        <button class="xp-start__item" @click="go('/', '首页')">
          <XpIcon class="xp-start__ico" name="home" :size="15" />首页
        </button>
      </div>

      <!-- 右栏：外观切换 + 本站工具 -->
      <div class="xp-start__right">
        <div class="xp-start__grouptitle">外观</div>
        <button
          v-for="t in themes"
          :key="t.id"
          class="xp-start__item"
          :class="{ 'is-current': currentTheme === t.id }"
          :title="t.hint"
          @click="pickTheme(t.id)"
        >
          <XpIcon class="xp-start__ico" :name="currentTheme === t.id ? 'info' : 'gear'" :size="15" />{{ t.label }}
        </button>

        <div class="xp-start__sep" />

        <div class="xp-start__grouptitle">本站工具</div>
        <button
          v-for="item in toolItems"
          :key="item.text"
          class="xp-start__item"
          @click="item.random ? openRandom() : go(item.link, item.text)"
        >
          <XpIcon class="xp-start__ico" :name="item.random ? 'random' : 'link'" :size="15" />{{ item.text }}
        </button>
        <a
          v-for="item in personalItems"
          :key="item.text"
          class="xp-start__item"
          :href="withBase(item.link)"
          target="_blank"
          rel="noopener"
          @click="emit('close')"
        >
          <XpIcon class="xp-start__ico" name="gear" :size="15" />{{ item.text }}
        </a>
      </div>
    </div>

    <footer class="xp-start__foot">
      <button class="xp-start__footbtn" @click="go('/', '首页')"><XpIcon name="home" :size="14" /> 回到桌面</button>
    </footer>
  </div>
</template>
