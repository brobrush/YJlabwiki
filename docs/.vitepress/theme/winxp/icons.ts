/**
 * XP 图标注册表
 *
 * 图标是本仓库自绘的 SVG，放在 winxp/icons/ 下。
 * **不是微软的原版图标** —— Windows XP 的图标美术版权归微软，
 * 不能直接拿来用；这里只是用同样的视觉语言（塑料质感的渐变 + 描边）自己画。
 *
 * 用 import 而不是写 `/theme/...` 绝对路径：Vite 会给资源加上哈希和 base 前缀，
 * 部署到 /YJlabwiki/ 这种子路径下才不会 404。
 */
import clipboard from './icons/clipboard.svg'
import computer from './icons/computer.svg'
import file from './icons/file.svg'
import folder from './icons/folder.svg'
import game from './icons/game.svg'
import gear from './icons/gear.svg'
import globe from './icons/globe.svg'
import help from './icons/help.svg'
import home from './icons/home.svg'
import info from './icons/info.svg'
import link from './icons/link.svg'
import random from './icons/random.svg'
import textfile from './icons/textfile.svg'

export const ICONS: Record<string, string> = {
  clipboard,
  computer,
  file,
  folder,
  game,
  gear,
  globe,
  help,
  home,
  info,
  link,
  random,
  textfile,
}

export type IconName = keyof typeof ICONS
