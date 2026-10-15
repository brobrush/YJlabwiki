<script setup lang="ts">
/**
 * 桌面上的 TETRIS —— 真能玩的那种。
 *
 * 操作：← → 移动，↑ 旋转，↓ 软降，空格 直落，P 暂停，R 重开。
 * 只有这个窗口在最上层时才响应键盘，不然会和别的窗口抢按键。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{ active: boolean }>()

const COLS = 10
const ROWS = 20
const CELL = 24

const canvas = ref<HTMLCanvasElement | null>(null)
const score = ref(0)
const lines = ref(0)
const level = ref(1)
const paused = ref(false)
const over = ref(false)
const started = ref(false)

type Cell = string | 0
let board: Cell[][] = []
let piece: { s: number[][]; x: number; y: number; c: string } | null = null
let raf = 0
let acc = 0
let last = 0

/* 7 种方块，每种给一个旋转态数组 */
const SHAPES: { c: string; s: number[][] }[] = [
  { c: '#00e5ff', s: [[1, 1, 1, 1]] }, // I
  { c: '#ffd400', s: [[1, 1], [1, 1]] }, // O
  { c: '#c060ff', s: [[0, 1, 0], [1, 1, 1]] }, // T
  { c: '#4a8cff', s: [[1, 0, 0], [1, 1, 1]] }, // J
  { c: '#ff9b21', s: [[0, 0, 1], [1, 1, 1]] }, // L
  { c: '#3ddc4a', s: [[0, 1, 1], [1, 1, 0]] }, // S
  { c: '#ff4d5e', s: [[1, 1, 0], [0, 1, 1]] }, // Z
]

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0))
}

function rotate(m: number[][]): number[][] {
  const h = m.length
  const w = m[0].length
  const out = Array.from({ length: w }, () => Array(h).fill(0))
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[x][h - 1 - y] = m[y][x]
  return out
}

function spawn() {
  const p = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  piece = {
    s: p.s.map((r) => [...r]),
    x: Math.floor((COLS - p.s[0].length) / 2),
    y: 0,
    c: p.c,
  }
  if (collide(piece.s, piece.x, piece.y)) {
    over.value = true
    started.value = false
  }
}

function collide(s: number[][], px: number, py: number): boolean {
  for (let y = 0; y < s.length; y++) {
    for (let x = 0; x < s[y].length; x++) {
      if (!s[y][x]) continue
      const nx = px + x
      const ny = py + y
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true
      if (ny >= 0 && board[ny][nx]) return true
    }
  }
  return false
}

function lock() {
  if (!piece) return
  piece.s.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v && piece!.y + y >= 0) board[piece!.y + y][piece!.x + x] = piece!.c
    }),
  )
  let cleared = 0
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every((c) => c)) {
      board.splice(y, 1)
      board.unshift(Array<Cell>(COLS).fill(0))
      cleared++
      y++
    }
  }
  if (cleared) {
    lines.value += cleared
    score.value += [0, 100, 300, 500, 800][cleared] * level.value
    level.value = 1 + Math.floor(lines.value / 10)
  }
  spawn()
}

function drop() {
  if (!piece || over.value || paused.value || !started.value) return
  if (!collide(piece.s, piece.x, piece.y + 1)) piece.y++
  else lock()
}

function move(dx: number) {
  if (!piece || over.value || paused.value || !started.value) return
  if (!collide(piece.s, piece.x + dx, piece.y)) piece.x += dx
}

function turn() {
  if (!piece || over.value || paused.value || !started.value) return
  const r = rotate(piece.s)
  for (const kick of [0, -1, 1, -2, 2]) {
    if (!collide(r, piece.x + kick, piece.y)) {
      piece.s = r
      piece.x += kick
      return
    }
  }
}

function hardDrop() {
  if (!piece || over.value || paused.value || !started.value) return
  while (!collide(piece.s, piece.x, piece.y + 1)) piece.y++
  score.value += 2
  lock()
}

function draw() {
  const cv = canvas.value
  if (!cv) return
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, cv.width, cv.height)

  // 网格
  ctx.strokeStyle = 'rgba(255,255,255,.07)'
  for (let x = 1; x < COLS; x++) {
    ctx.beginPath()
    ctx.moveTo(x * CELL, 0)
    ctx.lineTo(x * CELL, ROWS * CELL)
    ctx.stroke()
  }
  for (let y = 1; y < ROWS; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * CELL)
    ctx.lineTo(COLS * CELL, y * CELL)
    ctx.stroke()
  }

  const cell = (x: number, y: number, c: string) => {
    ctx.fillStyle = c
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2)
    ctx.fillStyle = 'rgba(255,255,255,.35)'
    ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, 3)
  }

  board.forEach((row, y) => row.forEach((c, x) => c && cell(x, y, c as string)))
  if (piece && !over.value) {
    piece.s.forEach((row, y) =>
      row.forEach((v, x) => v && cell(piece!.x + x, piece!.y + y, piece!.c)),
    )
  }

  if (over.value) {
    ctx.fillStyle = 'rgba(0,0,0,.68)'
    ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.fillStyle = '#ffd400'
    ctx.font = 'bold 26px "Trebuchet MS", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('GAME OVER', cv.width / 2, cv.height / 2)
  } else if (!started.value) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'
    ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px "Trebuchet MS", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('点「开始」或按空格', cv.width / 2, cv.height / 2)
  } else if (paused.value) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'
    ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 22px "Trebuchet MS", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('暂停', cv.width / 2, cv.height / 2)
  }
}

function loop(t: number) {
  raf = requestAnimationFrame(loop)
  const dt = t - (last || t)
  last = t
  if (started.value && !paused.value && !over.value) {
    acc += dt
    const speed = Math.max(90, 620 - (level.value - 1) * 55)
    if (acc > speed) {
      acc = 0
      drop()
    }
  }
  draw()
}

function reset() {
  board = emptyBoard()
  score.value = 0
  lines.value = 0
  level.value = 1
  over.value = false
  paused.value = false
  acc = 0
  spawn()
}

function start() {
  reset()
  started.value = true
}

function togglePause() {
  if (!started.value || over.value) return
  paused.value = !paused.value
}

/* ------------------------------------------------------------ 键盘 */

function onKey(e: KeyboardEvent) {
  if (!props.active) return
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'p', 'P', 'r', 'R']
  if (!keys.includes(e.key)) return
  e.preventDefault()

  if (e.key === 'r' || e.key === 'R') return start()
  if (!started.value) {
    if (e.key === ' ') start()
    return
  }
  switch (e.key) {
    case 'ArrowLeft':
      return move(-1)
    case 'ArrowRight':
      return move(1)
    case 'ArrowUp':
      return turn()
    case 'ArrowDown':
      return drop()
    case ' ':
      return hardDrop()
    case 'p':
    case 'P':
      return togglePause()
  }
}

onMounted(() => {
  reset()
  window.addEventListener('keydown', onKey)
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  cancelAnimationFrame(raf)
})

watch(() => props.active, draw)
</script>

<template>
  <div class="xp-tetris">
    <canvas ref="canvas" :width="COLS * CELL" :height="ROWS * CELL" />
    <aside class="xp-tetris__side">
      <div class="xp-tetris__panel">
        <div class="xp-tetris__row"><b>得分</b><span>{{ score }}</span></div>
        <div class="xp-tetris__row"><b>消行</b><span>{{ lines }}</span></div>
        <div class="xp-tetris__row"><b>等级</b><span>{{ level }}</span></div>
      </div>
      <button class="xp-btn" @click="started ? reset() : start()">
        {{ started ? '重新开始' : '开始' }}
      </button>
      <button class="xp-btn" :disabled="!started || over" @click="togglePause">
        {{ paused ? '继续' : '暂停' }}
      </button>
      <div class="xp-tetris__keys">
        ← → 移动　↑ 旋转<br />↓ 软降　空格 直落<br />P 暂停　R 重开
      </div>
    </aside>
  </div>
</template>
