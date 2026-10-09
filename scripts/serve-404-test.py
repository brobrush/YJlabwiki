#!/usr/bin/env python3
"""
仅用于本地验证 404 效果的测试服务器。

`vitepress preview` 在返回兜底 404 页时**不带 Content-Type**，
浏览器会把响应当成非 HTML，结果是白屏 —— 这是 sirv 的行为，
真实托管平台（Cloudflare Pages / Nginx / Netlify）都会正常返回 text/html。

这个脚本模拟真实平台的行为：找不到文件时用 text/html 返回 404.html。

    python3 scripts/serve-404-test.py [端口]
"""
import http.server
import os
import socketserver
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    'docs', '.vitepress', 'dist')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4190


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_GET(self):
        # /__slow?ms=2000 —— 故意慢速的 1x1 图片，用来把 load 事件拖后，
        # 好让无头浏览器的截图能拍到客户端渲染完成后的画面。
        if self.path.startswith('/__slowimg'):
            import time
            import urllib.parse
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            time.sleep(int(q.get('ms', ['1500'])[0]) / 1000)
            gif = bytes.fromhex(
                '47494638396101000100800000ffffff00000021f90401000000002c'
                '00000000010001000002024401003b')
            self.send_response(200)
            self.send_header('Content-Type', 'image/gif')
            self.send_header('Content-Length', str(len(gif)))
            self.end_headers()
            self.wfile.write(gif)
            return
        # 去掉查询串再解析路径
        raw = self.path.split('?', 1)[0].split('#', 1)[0]
        target = self.translate_path(raw)
        if os.path.isdir(target):
            target = os.path.join(target, 'index.html')
        if not os.path.exists(target) and os.path.exists(target + '.html'):
            # 模拟真实托管平台的 cleanUrls 行为：/all-pages → all-pages.html
            self.path = raw + '.html'
            return super().do_GET()
        if os.path.exists(target):
            return super().do_GET()

        with open(os.path.join(ROOT, '404.html'), 'rb') as fh:
            body = fh.read()
        self.send_response(int(os.environ.get('FALLBACK_STATUS', '404')))
        self.send_header('Content-Type', 'text/html;charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    # 必须用多线程版本：浏览器会并发发起多个连接，
    # 单线程的 TCPServer 会互相阻塞，导致页面永远加载不完成。
    with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler) as httpd:
        print(f'404 测试服务器: http://127.0.0.1:{PORT}/', flush=True)
        httpd.serve_forever()
