#!/usr/bin/env python3
"""
XP 主题的截图测试脚手架（只在本机验证用，不参与构建）

用法：
    python3 scripts/xp-shot.py <路由> <输出名> [要执行的 JS]

它做三件事：
  1. 往该路由对应的 dist HTML 里注入 localStorage 主题种子和一张慢加载图
     —— 慢图是为了把 load 事件拖后，让无头浏览器的截图能拍到客户端渲染结果
  2. 把可选的 JS 注入成一个延时执行的脚本，用来模拟点击
  3. 用 firefox --headless 截图

跑完记得 `npm run build` 把注入清掉（dist 本来就在 .gitignore 里）。
"""
import os
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'docs' / '.vitepress' / 'dist'
PREVIEW = ROOT / '.preview'
PORT = os.environ.get('XP_PORT', '4220')

SEED = '<script>try{localStorage.setItem("yjlab-wiki-theme","winxp")}catch(e){}</script>'
DELAY_MS = os.environ.get('XP_DELAY', '2000')
SLOW = ('<img src="/__slowimg?ms=' + DELAY_MS +
        '" alt="" style="position:absolute;width:1px;height:1px;opacity:0">')


def dist_file_for(route: str) -> pathlib.Path:
    r = route.strip('/')
    if r == '':
        return DIST / 'index.html'
    p = DIST / r
    if p.is_dir():
        return p / 'index.html'
    return DIST / (r + '.html')


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)

    route, name = sys.argv[1], sys.argv[2]
    js = sys.argv[3] if len(sys.argv) > 3 else ''

    target = dist_file_for(route)
    if not target.exists():
        print('找不到文件:', target)
        sys.exit(1)

    # 先重建，避免上一次注入残留在同一个 HTML 里累加
    subprocess.run(['npm', 'run', 'build'], cwd=ROOT, capture_output=True)

    html = target.read_text(encoding='utf-8')
    injected = SEED
    if js:
        injected += (
            '<script>setTimeout(function(){try{' + js + '}catch(e){'
            'document.title="JSERR:"+e.message}},900)</script>'
        )
    html = html.replace('<head>', '<head>' + injected, 1)
    html = html.replace('</body>', SLOW + '\n</body>', 1)
    target.write_text(html, encoding='utf-8')

    PREVIEW.mkdir(exist_ok=True)
    out = PREVIEW / f'{name}.png'
    out.unlink(missing_ok=True)
    profile = PREVIEW / 'ffprof'
    profile.mkdir(exist_ok=True)
    url = f'http://127.0.0.1:{PORT}{route}'
    subprocess.run(
        ['timeout', '150', 'firefox', '--headless', '--profile', str(profile),
         '--window-size=1280,800', '--screenshot', str(out), url],
        capture_output=True,
    )
    subprocess.run(['rm', '-rf', str(profile)])
    print(f'  {name}.png  {out.stat().st_size if out.exists() else "失败"} 字节  ← {url}')


if __name__ == '__main__':
    main()
