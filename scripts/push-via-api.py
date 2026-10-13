#!/usr/bin/env python3
"""
通过 GitHub REST API 推送提交。

用于 github.com:443 连不上（代理只放行了 api.github.com）的情况。
把本地改动逐个建成 blob、组装成树、建提交、把 main 指过去 ——
对 GitHub 来说和普通 push 没区别，同样会触发 Pages 自动部署。

用法
----
    # 本地就在远端之上（普通情况）
    python3 scripts/push-via-api.py --diff-base <远端当前提交>

    # 本地与远端分叉：把本地改动接到远端最新提交之上
    python3 scripts/push-via-api.py --parent <远端最新提交> --diff-base <分叉点>

它会先核对远端最新提交、并检查两边改动的文件是否重叠，重叠就停手。
"""
import argparse
import base64
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

REPO = 'brobrush/YJlabwiki'
API = 'https://api.github.com'
TOKEN = json.load(open(os.path.expanduser('~/.gh-oauth.json')))['access_token']


def api(method, path, body=None):
    data = json.dumps(body).encode('utf-8') if body is not None else None
    r = urllib.request.Request(API + path, data=data, method=method)
    r.add_header('Authorization', 'token ' + TOKEN)
    r.add_header('Accept', 'application/vnd.github+json')
    if data:
        r.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(r, timeout=90) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        print('  ✗ API 出错 %s %s → %s' % (method, path, e.code))
        print('    ' + e.read().decode('utf-8', 'replace')[:400])
        sys.exit(1)


def api_try(method, path, body=None):
    """和 api() 一样，但出错时返回 (False, None) 而不是退出。"""
    data = json.dumps(body).encode('utf-8') if body is not None else None
    r = urllib.request.Request(API + path, data=data, method=method)
    r.add_header('Authorization', 'token ' + TOKEN)
    r.add_header('Accept', 'application/vnd.github+json')
    if data:
        r.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(r, timeout=90) as resp:
            raw = resp.read()
            return True, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError:
        return False, None


def remote_file_exists(path):
    ok, _ = api_try('GET', f'/repos/{REPO}/contents/{path}?ref=main')
    return ok


def git(*args):
    return subprocess.run(['git', *args], capture_output=True, text=True,
                          check=True).stdout.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--parent', help='远端最新提交（默认自动查询 main）')
    ap.add_argument('--diff-base', required=True, help='本地用于计算改动的基点提交')
    ap.add_argument('--target', default='HEAD', help='要推送的本地提交，默认 HEAD')
    args = ap.parse_args()

    remote_sha = api('GET', f'/repos/{REPO}/git/ref/heads/main')['object']['sha']
    print('远端 main   :', remote_sha[:7])

    parent = args.parent or remote_sha
    # 注意：--parent 通常是短 SHA，remote_sha 是完整 40 位，不能用 != 直接比
    if not remote_sha.startswith(parent):
        print('  ✗ 远端已经变成 %s，不是你指定的 %s —— 先重新确认'
              % (remote_sha[:7], parent[:7]))
        sys.exit(1)

    local = [l.split('\t', 1) for l in
             git('diff', '--name-status', args.diff_base, args.target).splitlines() if l.strip()]

    ok, cmp_result = api_try('GET', f'/repos/{REPO}/compare/{args.diff_base}...{remote_sha}')
    if ok:
        remote_files = {f['filename'] for f in cmp_result.get('files', [])}
        overlap = remote_files & {p for _, p in local}
        if overlap:
            print('  ✗ 以下文件两边都改过，不能自动合并，请人工处理：')
            for f in sorted(overlap):
                print('     ', f)
            sys.exit(1)
        print('重叠检查    : 无重叠 ✓ （远端改了 %d 个，本地改了 %d 个）'
              % (len(remote_files), len(local)))
    else:
        # --diff-base 不在远端时（例如本地提交是重建过的等价提交）compare 会 404。
        # 退化成更保守的检查：只允许纯新增，且远端不能已存在同名文件。
        print('重叠检查    : 无法对比（基点提交不在远端），退化为「仅允许新增」检查')
        risky = [(s, p) for s, p in local if s != 'A']
        if risky:
            print('  ✗ 存在非新增的改动，无法自动判断是否会覆盖别人的修改：')
            for s, p in risky:
                print('     %s %s' % (s, p))
            print('    请等 github.com 恢复后走正常的 git fetch + rebase')
            sys.exit(1)
        for _, p in local:
            if remote_file_exists(p):
                print('  ✗ 远端已存在 %s，继续会覆盖别人的改动' % p)
                sys.exit(1)

    # Git Data API 的 /git/commits/ 只认完整 40 位 SHA，短 SHA 会 404。
    # remote_sha 已经是完整的，且已验证 parent 是它的前缀，直接用 remote_sha。
    base_tree = api('GET', f'/repos/{REPO}/git/commits/{remote_sha}')['tree']['sha']

    entries = []
    for status, path in local:
        if status == 'D':
            entries.append({'path': path, 'mode': '100644', 'type': 'blob', 'sha': None})
            print('  D', path)
            continue
        content = open(path, 'rb').read()
        blob = api('POST', f'/repos/{REPO}/git/blobs',
                   {'content': base64.b64encode(content).decode('ascii'),
                    'encoding': 'base64'})
        entries.append({'path': path, 'mode': '100644', 'type': 'blob', 'sha': blob['sha']})
        print('  %s %s (%d 字节)' % (status, path, len(content)))

    tree = api('POST', f'/repos/{REPO}/git/trees', {'base_tree': base_tree, 'tree': entries})
    print('新 tree     :', tree['sha'][:7])

    commit = api('POST', f'/repos/{REPO}/git/commits', {
        'message': git('log', '-1', '--format=%B', args.target),
        'tree': tree['sha'],
        'parents': [remote_sha],
        'author': {
            'name': git('log', '-1', '--format=%an', args.target),
            'email': git('log', '-1', '--format=%ae', args.target),
            'date': git('log', '-1', '--format=%aI', args.target),
        },
    })
    print('新 commit   :', commit['sha'][:7])

    api('PATCH', f'/repos/{REPO}/git/refs/heads/main',
        {'sha': commit['sha'], 'force': False})
    print('main 已更新 →', commit['sha'][:7])

    # fetch 也走不通，试着同步本地引用。
    # 注意：远端刚建的提交对象本地并不存在，git 会拒绝把 ref 指向不存在的对象，
    # 这里失败是正常的，不代表推送失败 —— 远端已经更新成功了。
    try:
        subprocess.run(['git', 'update-ref', 'refs/remotes/origin/main', commit['sha']],
                       check=True, capture_output=True)
        print('refs/remotes/origin/main 已同步')
    except subprocess.CalledProcessError:
        print('refs/remotes/origin/main 未同步（本地缺该提交对象，正常）')
    print()
    print('⚠️ 本地仓库缺少远端新增提交的对象。等 github.com 恢复后执行：')
    print('   git fetch && git reset --soft origin/main')
    print('   即可让本地与远端完全对齐（文件内容一致，不会有差异）。')


if __name__ == '__main__':
    main()
