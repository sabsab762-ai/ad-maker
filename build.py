#!/usr/bin/env python3
"""Build ad-maker: inline src/*.js into src/shell.html -> index.html"""
import os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'src')
ORDER = [
    'core.js',
    'mod-danggeun.js',
    'mod-insta.js',
    'mod-thread.js',
    'mod-lotto.js',
    'mod-video.js',
    'mod-cafe.js',
    'mod-cheat.js',
    'mod-analyze.js',
    'mod-detail.js',
    'init.js',
]

def main():
    shell_path = os.path.join(SRC, 'shell.html')
    with open(shell_path, encoding='utf-8') as f:
        shell = f.read()

    parts = []
    for name in ORDER:
        p = os.path.join(SRC, name)
        with open(p, encoding='utf-8') as f:
            body = f.read()
        parts.append('/* ---- ' + name + ' ---- */\n' + body)
    js = '\n'.join(parts)

    if '/*__APP_JS__*/' not in shell:
        sys.exit('placeholder missing in shell.html')
    out = shell.replace('/*__APP_JS__*/', js)
    out_path = os.path.join(BASE, 'index.html')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(out)
    print('wrote', out_path, len(out), 'chars')

    # also write standalone JS for syntax checking
    with open(os.path.join(BASE, '.build-app.js'), 'w', encoding='utf-8') as f:
        f.write(js)

if __name__ == '__main__':
    main()
