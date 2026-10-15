<script setup lang="ts">
/**
 * 「我的电脑」窗口
 *
 * 左边是 XP 风格的蓝色任务面板，右边按栏目列出所有页面（当文件图标用），
 * 外加一个假文件 —— 点它同样会打开一个页面窗口。
 */
import { computed } from 'vue'
import { useData } from 'vitepress'
import XpIcon from './XpIcon.vue'
import { useXpOpenPage } from './openPage'

const { theme } = useData()
const openPage = useXpOpenPage()

const categories = computed<any[]>(() => (theme.value as any)?.wiki?.categories ?? [])

/**
 * 那个"假文件" —— 双击/单击会打开下面 path 对应的页面。
 * 想换成别的页面改这两行就行。
 */
const FAKE_FILE = {
  name: '新建 文本文档.txt',
  path: '/about',
  title: '关于 YJlab 维基',
}

function open(path: string, title: string) {
  openPage(path, title)
}

const total = computed(() =>
  categories.value.reduce((n, c) => n + (c.items?.length ?? 0), 0) + 1,
)
</script>

<template>
  <div class="xp-explorer">
    <!-- XP 左侧蓝色任务面板 -->
    <aside class="xp-explorer__tasks">
      <div class="xp-taskbox">
        <div class="xp-taskbox__head">系统任务</div>
        <ul>
          <li @click="open('/', '首页')"><XpIcon name="home" :size="14" /> 回到桌面</li>
          <li @click="open('/all-pages', '所有页面')"><XpIcon name="clipboard" :size="14" /> 查看所有页面</li>
          <li @click="open('/help/', '编辑指南')"><XpIcon name="help" :size="14" /> 怎么编辑</li>
        </ul>
      </div>
      <div class="xp-taskbox">
        <div class="xp-taskbox__head">其他位置</div>
        <ul>
          <li v-for="c in categories" :key="c.title" @click="open(c.items[0].link, c.title)">
            <XpIcon name="folder" :size="14" /> {{ c.title }}
          </li>
        </ul>
      </div>
    </aside>

    <!-- 文件区 -->
    <section class="xp-explorer__files">
      <header class="xp-explorer__bar">
        <span class="xp-explorer__label">地址</span>
        <span class="xp-explorer__addr">我的电脑 \ YJlab 维基</span>
      </header>

      <div class="xp-explorer__scroll">
        <div v-for="cat in categories" :key="cat.title" class="xp-filegroup">
          <h4 class="xp-filegroup__title">{{ cat.title }}</h4>
          <div class="xp-filegroup__items">
            <button
              v-for="item in cat.items"
              :key="item.link"
              class="xp-file"
              @click="open(item.link, item.text)"
            >
              <XpIcon class="xp-file__icon" name="file" :size="30" />
              <span class="xp-file__name">{{ item.text }}</span>
            </button>
          </div>
        </div>

        <div class="xp-filegroup">
          <h4 class="xp-filegroup__title">其他</h4>
          <div class="xp-filegroup__items">
            <button
              class="xp-file"
              @click="open(FAKE_FILE.path, FAKE_FILE.title)"
            >
              <XpIcon class="xp-file__icon" name="textfile" :size="30" />
              <span class="xp-file__name">{{ FAKE_FILE.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <footer class="xp-explorer__status">
        <span>{{ total }} 个对象</span>
        <span class="xp-explorer__hint">单击即打开</span>
      </footer>
    </section>
  </div>
</template>
