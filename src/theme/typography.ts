import type { TextStyle } from 'react-native';

/**
 * Tên font đúng với key đã nạp trong useFonts (src/app/_layout.tsx).
 * Mỗi độ đậm là một family riêng → KHÔNG đặt fontWeight cùng lúc (Android sẽ bỏ font).
 */
export const fonts = {
  display500: 'Lexend_500Medium',
  display600: 'Lexend_600SemiBold',
  display700: 'Lexend_700Bold',
  sans400: 'BeVietnamPro_400Regular',
  sans500: 'BeVietnamPro_500Medium',
  sans600: 'BeVietnamPro_600SemiBold',
  sans700: 'BeVietnamPro_700Bold',
} as const;

/** Các kiểu chữ dùng trên màn Home (cỡ / dòng theo design). */
export const type = {
  screenTitle: { fontFamily: fonts.display600, fontSize: 28, lineHeight: 36 },
  h2: { fontFamily: fonts.display600, fontSize: 20, lineHeight: 28 },
  greetingName: { fontFamily: fonts.display600, fontSize: 22, lineHeight: 30 },
  sectionTitle: { fontFamily: fonts.display600, fontSize: 22, lineHeight: 30 },
  cardTitle: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.sans400, fontSize: 16, lineHeight: 26 },
  input: { fontFamily: fonts.sans400, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.sans600, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 20 },
  captionStrong: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 20 },
  chip: { fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  eyebrow: {
    fontFamily: fonts.sans600,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;