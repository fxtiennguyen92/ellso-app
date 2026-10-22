import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Icon, type IconName } from '@/components/Icon';
import { formatPrice } from '@/data/courses';
import { type Access, type Doc, typeLabel } from '@/data/documents';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { accessStyle } from './docAccess';

type Option = { title: string; desc: string; action: string; icon: IconName; run: () => void };

/**
 * Bảng "Cách mở tài liệu": liệt kê MỌI điều kiện của tài liệu (đủ một là mở);
 * điều kiện đầu tiên là nút chính, các điều kiện sau là nút viền.
 */
export function AccessSheet({ doc, onClose, onNotice }: { doc: Doc | null; onClose: () => void; onNotice: (msg: string) => void }) {
  const { colors } = useTheme();

  const go = (path: Parameters<typeof router.push>[0]) => {
    onClose();
    setTimeout(() => router.push(path), 250);
  };

  const option = (a: Access): Option => {
    switch (a.kind) {
      case 'plus':
        return { title: 'Có gói thành viên', desc: 'Mở mọi tài liệu thuộc gói khi gói còn hạn.', action: 'Nâng cấp gói', icon: 'crown', run: () => go('/profile/quan-ly-goi') };
      case 'buy':
        return {
          title: 'Mua riêng tài liệu này',
          desc: 'Mua một lần, xem mãi trong app.',
          action: `Mua · ${formatPrice(a.price)}`,
          icon: 'tag',
          run: () => {
            onClose();
            onNotice('Thanh toán sẽ làm ở bước sau');
          },
        };
      case 'lesson':
        return {
          title: `Mở ${a.lesson} của khoá ${a.courseTitle}`,
          desc: `Tài liệu đi kèm ${a.lesson}. Bài đã mở là xem được, không cần học xong.`,
          action: 'Đi tới bài học',
          icon: 'link',
          run: () => go(`/courses/${a.courseId}`),
        };
      case 'course':
        return { title: `Sở hữu khoá ${a.courseTitle}`, desc: 'Mua khoá, nhập mã kích hoạt hoặc được gán khoá học.', action: 'Xem khoá học', icon: 'courses', run: () => go('/courses') };
      case 'free':
      default:
        return { title: 'Miễn phí', desc: 'Ai cũng xem được.', action: 'Xem ngay', icon: 'check', run: onClose };
    }
  };

  const options = doc ? doc.access.map(option) : [];

  return (
    <BottomSheet visible={!!doc} onClose={onClose} title="Cách mở tài liệu">
      {doc && (
        <View style={styles.wrap}>
          <View style={[styles.docInfo, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="lock" size={18} color={colors.ink600} />
            <View style={styles.grow}>
              <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
                {doc.author} · {typeLabel[doc.type].title}
              </Text>
              <Text style={[type.label, { color: colors.ink900 }]} numberOfLines={2}>
                {doc.title}
              </Text>
            </View>
          </View>

          <Text style={[type.caption, { color: colors.ink600 }]}>
            {options.length > 1 ? 'Đủ một trong các điều kiện sau là mở được:' : 'Điều kiện để mở:'}
          </Text>

          {doc.access.map((a, i) => {
            const o = options[i];
            const s = accessStyle(a, false, colors);
            const primary = i === 0;
            return (
              <View key={i} style={[styles.option, { borderColor: colors.line }]}>
                <View style={styles.optionHead}>
                  <View style={[styles.optionIcon, { backgroundColor: s.bg }]}>
                    <Icon name={o.icon} size={18} color={s.fg} />
                  </View>
                  <View style={styles.grow}>
                    <Text style={[styles.optionTitle, { color: colors.ink900 }]}>{o.title}</Text>
                    <Text style={[type.caption, { color: colors.ink600 }]}>{o.desc}</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={o.run}
                  style={({ pressed }) => [
                    styles.btn,
                    primary
                      ? { backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }
                      : { borderWidth: 1.5, borderColor: colors.emerald700, backgroundColor: pressed ? colors.mint50 : 'transparent' },
                  ]}
                >
                  <Text style={[type.label, { color: primary ? colors.onEmerald : colors.emerald700 }]}>{o.action}</Text>
                </Pressable>
              </View>
            );
          })}

          <Text style={[type.caption, styles.note, { color: colors.ink400 }]}>Tài liệu chỉ xem trong app, không tải về.</Text>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  docInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14 },
  option: { gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  optionHead: { flexDirection: 'row', gap: 12 },
  optionIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  btn: { height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  note: { textAlign: 'center' },
});