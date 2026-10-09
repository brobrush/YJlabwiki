import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import NotFound from './NotFound.vue'
import './wiki.css'

/**
 * YJlab 维基主题
 * 完全替换 VitePress 默认主题，只保留 Markdown → HTML 的渲染能力。
 *
 * ⚠️ NotFound 必须导出：VitePress 内部执行的是
 *      createRouter(loadPageModule, Theme.NotFound)
 *    缺少它，访问不存在的地址时 route.component 会是 null，
 *    整个页面渲染成空白且控制台不报错。详见 NotFound.vue 顶部注释。
 */
export default {
  Layout,
  NotFound,
} satisfies Theme
