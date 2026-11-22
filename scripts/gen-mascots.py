#!/usr/bin/env python3
"""
Sinh src/components/mascots/mascotArt.generated.tsx từ assets/mascots/*.svg.

Mỗi SVG gốc (viewBox 0 0 400 440, theo tài liệu claude/ellso-mascots.md) được tách thành các LỚP theo thứ tự vẽ:
- nhóm <g id="L-xxx"> → một lớp động tên "xxx" (tai, lá, mắt mở/nhắm, miệng…), Mascot.tsx gắn chuyển động theo tên;
- các phần tử khác liên tiếp nhau → gộp thành một lớp tĩnh "s0", "s1"…
Mỗi lớp vẽ trong một <Svg> riêng chồng lên nhau, nên xoay / nhún từng lớp bằng Animated.View (chạy native driver).
Gradient / clipPath được chép vào lớp nào dùng tới, id có tiền tố riêng cho từng lần vẽ (nhiều mascot trên một màn).

Chạy lại sau khi sửa SVG:  python3 scripts/gen-mascots.py
"""
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'mascots'
OUT = ROOT / 'src' / 'components' / 'mascots' / 'mascotArt.generated.tsx'
NS = '{http://www.w3.org/2000/svg}'
MASCOTS = [('tho', 'tho.svg'), ('mam', 'mam.svg'), ('tia', 'tia.svg'), ('cuMinh', 'cu-minh.svg'), ('so', 'so.svg')]
TAGS = {
    'ellipse': 'Ellipse', 'circle': 'Circle', 'rect': 'Rect', 'path': 'Path', 'g': 'G',
    'radialGradient': 'RadialGradient', 'linearGradient': 'LinearGradient', 'stop': 'Stop', 'clipPath': 'ClipPath',
}
SKIP_ATTR = {'role', 'aria-label', 'xmlns'}


def camel(a: str) -> str:
    return re.sub(r'-([a-z])', lambda m: m.group(1).upper(), a)


def attr_value(v: str) -> str:
    if 'url(#' in v:
        return '{`' + re.sub(r'url\(#([^)]+)\)', r'url(#${p}\1)', v) + '`}'
    return '"' + v.replace('"', '&quot;') + '"'


def jsx(el, indent=6, is_def=False) -> str:
    tag = el.tag.replace(NS, '')
    comp = TAGS[tag]
    parts = []
    for k, v in el.attrib.items():
        if k in SKIP_ATTR:
            continue
        if k == 'id':
            if is_def:
                parts.append('id={`${p}' + v + '`}')
            continue  # id nhóm (L-…, eye-open-l…) không cần trong RN
        parts.append(f'{camel(k)}={attr_value(v)}')
    pad = ' ' * indent
    children = list(el)
    head = f'<{comp}' + (' ' + ' '.join(parts) if parts else '')
    if not children:
        return f'{pad}{head} />'
    inner = '\n'.join(jsx(c, indent + 2, is_def) for c in children)
    return f'{pad}{head}>\n{inner}\n{pad}</{comp}>'


def refs(el) -> set:
    found = set()
    for node in el.iter():
        for v in node.attrib.values():
            found.update(re.findall(r'url\(#([^)]+)\)', v))
    return found


def build(name: str, file: str) -> str:
    root = ET.parse(SRC / file).getroot()
    defs = {}
    layers = []  # (key, [elements])
    static = []
    n = 0
    for child in root:
        tag = child.tag.replace(NS, '')
        if tag == 'defs':
            for d in child:
                defs[d.attrib['id']] = d
            continue
        cid = child.attrib.get('id', '')
        if tag == 'g' and cid.startswith('L-'):
            if static:
                layers.append((f's{n}', static))
                n += 1
                static = []
            layers.append((cid[2:], list(child)))
        else:
            static.append(child)
    if static:
        layers.append((f's{n}', static))

    out = [f'  {name}: [']
    for key, els in layers:
        used = set()
        for e in els:
            used |= refs(e)
        body = []
        if used:
            body.append('      <Defs>')
            body += [jsx(defs[i], 8, True) for i in sorted(used)]
            body.append('      </Defs>')
        body += [jsx(e) for e in els]
        out.append(f"    {{\n      key: '{key}',\n      render: (p) => (\n        <>\n" + '\n'.join('  ' + l for l in '\n'.join(body).split('\n')) + '\n        </>\n      ),\n    },')
    out.append('  ],')
    return '\n'.join(out)


def main():
    blocks = [build(n, f) for n, f in MASCOTS]
    names = ' | '.join(f"'{n}'" for n, _ in MASCOTS)
    code = f"""/* eslint-disable */
// TỰ SINH bởi scripts/gen-mascots.py từ assets/mascots/*.svg — đừng sửa tay.
import type {{ ReactElement }} from 'react';
import {{ Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop }} from 'react-native-svg';

export type MascotName = {names};

/** Một lớp vẽ (canvas 400 × 440). `p` = tiền tố id gradient / clipPath của lần vẽ này. */
export type MascotLayer = {{ key: string; render: (p: string) => ReactElement }};

export const MASCOT_ART: Record<MascotName, MascotLayer[]> = {{
{chr(10).join(blocks)}
}};
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(code)
    print('wrote', OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
