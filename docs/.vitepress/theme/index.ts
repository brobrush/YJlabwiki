import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import './wiki.css'

/**
 * YJlab 维基主题
 * 完全替换 VitePress 默认主题，只保留 Markdown → HTML 的渲染能力。
 */
export default {
  Layout,
} satisfies Theme
