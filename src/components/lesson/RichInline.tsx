import { Linking, Platform, type StyleProp, Text, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

/**
 * Chữ có định dạng trong dòng từ Editor.js (server đã lọc, chỉ còn b/strong, i/em, u, mark, code, a, br) → các <Text> lồng nhau.
 * Không dùng WebView / thư viện HTML: chỉ bấy nhiêu thẻ nên tự tách là đủ, nhẹ và chạy giống nhau trên iOS / Android / web.
 */

type Run = { text: string; b?: boolean; i?: boolean; u?: boolean; mark?: boolean; code?: boolean; href?: string };

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });

export function parseInline(html: string): Run[] {
  const runs: Run[] = [];
  const stack: Omit<Run, 'text'>[] = [{}];
  const re = /<(\/?)([a-z]+)([^>]*)>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (text: string) => {
    if (text) runs.push({ ...stack[stack.length - 1], text: decode(text) });
  };
  while ((m = re.exec(html))) {
    push(html.slice(last, m.index));
    last = re.lastIndex;
    const [, close, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    if (tag === 'br') {
      push('\n');
      continue;
    }
    if (close) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const top = { ...stack[stack.length - 1] };
    if (tag === 'b' || tag === 'strong') top.b = true;
    else if (tag === 'i' || tag === 'em') top.i = true;
    else if (tag === 'u') top.u = true;
    else if (tag === 'mark') top.mark = true;
    else if (tag === 'code') top.code = true;
    else if (tag === 'a') top.href = /href="([^"]*)"/i.exec(attrs)?.[1];
    stack.push(top);
  }
  push(html.slice(last));
  return runs;
}

export const plainText = (html: string) => parseInline(html).map((r) => r.text).join('');

export const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, SFMono-Regular, Menlo, monospace' });

/** Một đoạn chữ có định dạng. `style` là kiểu chữ gốc (cỡ, màu, font thường). */
export function RichInline({ html, style, selectable }: { html: string; style: StyleProp<TextStyle>; selectable?: boolean }) {
  const { colors, scheme } = useTheme();
  const runs = parseInline(html);
  return (
    <Text style={style} selectable={selectable}>
      {runs.map((r, i) => {
        const s: { -readonly [K in keyof TextStyle]: TextStyle[K] } = {};
        if (r.b) s.fontFamily = fonts.sans700;
        if (r.i) s.fontStyle = 'italic';
        if (r.u || r.href) s.textDecorationLine = 'underline';
        if (r.mark) s.backgroundColor = scheme === 'dark' ? 'rgba(250,204,21,0.28)' : '#fdf0b0';
        if (r.code) {
          s.fontFamily = MONO;
          s.fontSize = 14;
          s.backgroundColor = colors.surfaceAlt;
          s.color = colors.ink900;
        }
        if (r.href) s.color = colors.emerald700;
        const href = r.href;
        return (
          <Text
            key={i}
            style={s}
            onPress={href && /^(https?:|mailto:)/i.test(href) ? () => Linking.openURL(href).catch(() => {}) : undefined}
            accessibilityRole={href ? 'link' : undefined}
          >
            {r.text}
          </Text>
        );
      })}
    </Text>
  );
}
