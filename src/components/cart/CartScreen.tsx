import { useFocusEffect, router } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/AuthUI';
import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { CourseCover } from '@/components/courses/CourseCover';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { Icon } from '@/components/Icon';
import { type CartItem, kindLabel } from '@/data/cart';
import { formatPrice } from '@/data/courses';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { chapterPalette } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { useCart } from './CartContext';

const PANEL_H = 76;

/**
 * Tab Giỏ hàng (chỉ hiện trên thanh tab khi giỏ có món). Danh sách = hàng phẳng (ảnh, loại, tên, giá, nút bỏ);
 * tổng tiền + "Thanh toán" nổi ngay trên thanh tab (luôn thấy khi cuộn). Thanh toán: làm ở bước sau.
 */
export function CartScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset();
  const { cart, refresh, remove, loading } = useCart();
  const { showToast } = useDocuments();
  const [scrolled, setScrolled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onRemove = async (item: CartItem) => {
    const err = await remove(item.type, item.id);
    showToast(err ?? `Đã bỏ "${item.title}" khỏi giỏ`);
  };

  const open = (item: CartItem) => {
    if (item.type === 'document' && item.kind === 'book') router.push(`/books/${item.id}`);
  };

  const empty = cart.count === 0;
  const panelBottom = BOTTOM_BAR_SPACE + insets.bottom - 8;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: topInset, backgroundColor: colors.bg, borderBottomColor: scrolled ? colors.line : 'transparent' }]}>
        <Text accessibilityRole="header" style={[type.screenTitle, { color: colors.ink900 }]}>
          Giỏ hàng
        </Text>
        {!empty && <Text style={[type.caption, { color: colors.ink600 }]}>{cart.count} sản phẩm</Text>}
      </View>

      <ScrollView
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading && !empty} onRefresh={refresh} tintColor={colors.emerald700} />}
        contentContainerStyle={{ paddingBottom: panelBottom + PANEL_H + 24, flexGrow: 1 }}
      >
        {empty ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.mint50 }]}>
              <Icon name="cart" size={34} strokeWidth={1.8} color={colors.emerald700} duotone />
            </View>
            <Text style={[type.h2, { color: colors.ink900, textAlign: 'center' }]}>Giỏ hàng đang trống</Text>
            <Text style={[type.body, { color: colors.ink600, textAlign: 'center' }]}>Thêm khoá học hoặc sách bạn muốn mua, rồi thanh toán một lần.</Text>
            <View style={styles.emptyBtn}>
              <PrimaryButton label="Khám phá khoá học" icon="courses" onPress={() => router.navigate('/courses')} />
            </View>
          </View>
        ) : (
          <View style={styles.list}>
            {cart.items.map((item, i) => (
              <View key={`${item.type}-${item.id}`} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
                <Pressable
                  accessibilityRole={item.kind === 'book' ? 'link' : undefined}
                  accessibilityLabel={`${kindLabel(item.kind)}: ${item.title}, ${formatPrice(item.price)}`}
                  onPress={() => open(item)}
                  style={styles.rowMain}
                >
                  <Thumb item={item} />
                  <View style={styles.rowText}>
                    <Text style={[type.chip, { color: colors.ink600 }]} numberOfLines={1}>
                      {kindLabel(item.kind).toUpperCase()}
                      {item.subtitle ? ` · ${item.subtitle}` : ''}
                    </Text>
                    <Text style={[styles.title, { color: colors.ink900 }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={[styles.price, { color: colors.ink900 }]}>{formatPrice(item.price)}</Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Bỏ ${item.title} khỏi giỏ`}
                  onPress={() => onRemove(item)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.remove, { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
                >
                  <Icon name="trash" size={19} color={colors.ink400} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {!empty && (
        <View pointerEvents="box-none" style={[styles.panelWrap, { bottom: panelBottom }]}>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.floatShadow }]}>
            <View style={styles.grow}>
              <Text style={[type.caption, { color: colors.ink600 }]}>Tổng cộng</Text>
              <Text style={[styles.total, { color: colors.ink900 }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatPrice(cart.total)}
              </Text>
            </View>
            <View style={styles.payBtn}>
              <PrimaryButton label="Thanh toán" onPress={() => showToast('Thanh toán sẽ làm ở bước sau')} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function Thumb({ item }: { item: CartItem }) {
  const { colors } = useTheme();
  if (item.type === 'course') {
    return (
      <View style={[styles.thumbCourse, { backgroundColor: colors.surfaceAlt }]}>
        <CourseCover id={item.id} coverUrl={item.coverUrl} iconSize={30} />
      </View>
    );
  }
  return (
    <View style={styles.thumbSlot}>
      <View style={[styles.thumbBook, { backgroundColor: chapterPalette[item.cover ?? 'teal'].base, boxShadow: colors.shadowBook }]}>
        {item.coverUrl ? <Image source={{ uri: item.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Icon name="book" size={20} color="#ffffff" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  header: { paddingHorizontal: 16, paddingBottom: 16, gap: 2, borderBottomWidth: 1, zIndex: 10 },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowText: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  price: { fontFamily: fonts.sans700, fontSize: 15, lineHeight: 22 },
  remove: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  thumbCourse: { width: 84, height: 60, borderRadius: 12, overflow: 'hidden' },
  thumbSlot: { width: 84, alignItems: 'center' },
  thumbBook: { width: 52, height: 76, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32, paddingBottom: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyBtn: { alignSelf: 'stretch', marginTop: 12 },
  panelWrap: { position: 'absolute', left: 16, right: 16 },
  panel: { height: PANEL_H, flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 18, paddingRight: 12, borderRadius: 20, borderWidth: 1 },
  total: { fontFamily: fonts.display600, fontSize: 22, lineHeight: 28 },
  payBtn: { width: 160 },
});
