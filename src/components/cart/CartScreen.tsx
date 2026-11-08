import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton } from '@/components/auth/AuthUI';
import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { CourseCover } from '@/components/courses/CourseCover';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { Icon } from '@/components/Icon';
import { apiCartPromo, type CartItem, type CartPromo, kindLabel } from '@/data/cart';
import { formatPrice } from '@/data/courses';
import { useKeyboardForm } from '@/hooks/useKeyboardForm';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { chapterPalette } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { useCart } from './CartContext';

const PANEL_H = 76;

/**
 * Tab Giỏ hàng (chỉ hiện trên thanh tab khi giỏ có món). Trang dạng "đơn hàng" gồm các khối:
 * 1. Sản phẩm — thẻ chứa các hàng (ảnh, loại, tên, giá, nút bỏ; món được giảm có nhãn mã).
 * 2. Mã khuyến mãi — ô nhập + Áp dụng (POST /cart/promo, hiện chỉ giảm cho khoá học); đã áp dụng → vé mã + số tiền giảm, bỏ được.
 *    Giỏ đổi → tự kiểm tra lại mã.
 * 3. Chi tiết thanh toán — tạm tính, giảm giá, tổng.
 * (Sau này thêm khối Xuất hoá đơn doanh nghiệp giữa 2 và 3.)
 * Tổng + "Thanh toán" nổi ngay trên thanh tab (ẩn khi bàn phím mở). Thanh toán: làm ở bước sau.
 */
export function CartScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset();
  const { token } = useAuth();
  const { cart, refresh, remove, loading } = useCart();
  const { showToast } = useDocuments();
  const form = useKeyboardForm();
  const [scrolled, setScrolled] = useState(false);

  const [code, setCode] = useState('');
  const [promo, setPromo] = useState<CartPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const applyCode = useCallback(
    async (value: string, silent = false) => {
      if (!token || !value.trim()) return;
      setApplying(true);
      setPromoError(null);
      try {
        const p = await apiCartPromo(token, value.trim());
        setPromo(p);
        setCode('');
        if (!silent) showToast(`Đã áp dụng mã ${p.code}`);
      } catch (e) {
        setPromo(null);
        setPromoError(e instanceof ApiError ? e.message : 'Không kiểm tra được mã, thử lại sau.');
      } finally {
        setApplying(false);
      }
    },
    [token, showToast],
  );

  // Giỏ đổi (thêm / bỏ món) → kiểm tra lại mã đang áp dụng
  const signature = cart.items.map((i) => `${i.type}${i.id}`).join(',');
  const appliedCode = promo?.code;
  useEffect(() => {
    if (appliedCode) applyCode(appliedCode, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const onRemove = async (item: CartItem) => {
    const err = await remove(item.type, item.id);
    showToast(err ?? `Đã bỏ "${item.title}" khỏi giỏ`);
  };

  const open = (item: CartItem) => {
    if (item.type === 'document' && item.kind === 'book') router.push(`/books/${item.id}`);
  };

  const discount = promo?.discount ?? 0;
  const total = Math.max(0, cart.total - discount);
  const eligible = useMemo(() => new Set((promo?.eligible ?? []).map((e) => `${e.type}${e.id}`)), [promo]);

  const empty = cart.count === 0;
  const panelBottom = BOTTOM_BAR_SPACE + insets.bottom - 8;

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header giống các tab khác: tiêu đề + số món */}
      <View style={[styles.header, { paddingTop: topInset, backgroundColor: colors.bg, borderBottomColor: scrolled ? colors.line : 'transparent' }]}>
        <Text accessibilityRole="header" style={[type.screenTitle, { color: colors.ink900 }]}>
          Giỏ hàng
        </Text>
        {!empty && (
          <View style={[styles.countPill, { backgroundColor: colors.emerald700 }]}>
            <Text style={[styles.countText, { color: colors.onEmerald }]}>{cart.count}</Text>
          </View>
        )}
      </View>

      <ScrollView
        ref={form.scrollRef}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading && !empty} onRefresh={refresh} tintColor={colors.emerald700} />}
        contentContainerStyle={[styles.content, { paddingBottom: form.keyboardOpen ? 24 : panelBottom + PANEL_H + 28 }, empty && styles.contentEmpty]}
      >
        {empty ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.mint50 }]}>
              <Icon name="cart" size={34} strokeWidth={1.8} color={colors.emerald700} duotone />
            </View>
            <Text style={[type.h2, styles.centerText, { color: colors.ink900 }]}>Giỏ hàng đang trống</Text>
            <Text style={[type.body, styles.centerText, { color: colors.ink600 }]}>Thêm khoá học hoặc sách bạn muốn mua, rồi thanh toán một lần.</Text>
            <View style={styles.emptyBtn}>
              <PrimaryButton label="Khám phá khoá học" icon="courses" onPress={() => router.navigate('/courses')} />
            </View>
          </View>
        ) : (
          <>
            {/* 1. Sản phẩm */}
            <Block title="Sản phẩm" right={`${cart.count} món`}>
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
                      <Text style={[styles.kind, { color: colors.ink600 }]} numberOfLines={1}>
                        {kindLabel(item.kind)}
                        {item.subtitle ? ` · ${item.subtitle}` : ''}
                      </Text>
                      <Text style={[styles.title, { color: colors.ink900 }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: colors.ink900 }]}>{formatPrice(item.price)}</Text>
                        {eligible.has(`${item.type}${item.id}`) ? (
                          <View style={[styles.codeTag, { backgroundColor: colors.mint50 }]}>
                            <Icon name="ticket" size={11} strokeWidth={2.4} color={colors.emerald700} />
                            <Text style={[styles.codeTagText, { color: colors.emerald700 }]}>{promo?.code}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Bỏ ${item.title} khỏi giỏ`}
                    onPress={() => onRemove(item)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.remove, { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
                  >
                    <Icon name="trash" size={18} color={colors.ink400} />
                  </Pressable>
                </View>
              ))}
            </Block>

            {/* 2. Mã khuyến mãi */}
            <View {...form.field('promo').wrap}>
              <Block title="Mã khuyến mãi">
                {promo ? (
                  <View style={[styles.voucher, { backgroundColor: colors.mint50, borderColor: colors.emerald500 }]}>
                    <View style={[styles.voucherIcon, { backgroundColor: colors.emerald700 }]}>
                      <Icon name="ticket" size={20} strokeWidth={2} color={colors.onEmerald} />
                    </View>
                    <View style={styles.grow}>
                      <Text style={[styles.voucherCode, { color: colors.emerald800 }]}>{promo.code}</Text>
                      <Text style={[type.caption, { color: colors.emerald700 }]} numberOfLines={2}>
                        {promo.description ? `${promo.description} · ` : ''}Giảm {formatPrice(promo.discount)}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Bỏ mã ${promo.code}`}
                      hitSlop={8}
                      onPress={() => setPromo(null)}
                      style={({ pressed }) => [styles.voucherRemove, { opacity: pressed ? 0.6 : 1 }]}
                    >
                      <Icon name="close" size={18} color={colors.emerald800} />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.promoBox}>
                    <View style={styles.promoRow}>
                      <View style={[styles.promoField, { backgroundColor: colors.bg, borderColor: promoError ? colors.danger : colors.line }]}>
                        <Icon name="ticket" size={18} color={colors.ink400} />
                        <TextInput
                          value={code}
                          onChangeText={(t) => {
                            setCode(t.toUpperCase());
                            if (promoError) setPromoError(null);
                          }}
                          placeholder="Nhập mã khuyến mãi"
                          placeholderTextColor={colors.ink400}
                          autoCapitalize="characters"
                          autoCorrect={false}
                          maxLength={20}
                          returnKeyType="done"
                          onFocus={form.field('promo').onFocus}
                          onSubmitEditing={() => applyCode(code)}
                          accessibilityLabel="Mã khuyến mãi"
                          style={[styles.promoInput, { color: colors.ink900 }]}
                        />
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !code.trim() || applying, busy: applying }}
                        disabled={!code.trim() || applying}
                        onPress={() => applyCode(code)}
                        style={({ pressed }) => [
                          styles.applyBtn,
                          code.trim()
                            ? { backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }
                            : { backgroundColor: colors.surfaceAlt },
                        ]}
                      >
                        {applying ? (
                          <ActivityIndicator color={colors.onEmerald} size="small" />
                        ) : (
                          <Text style={[type.label, { color: code.trim() ? colors.onEmerald : colors.ink400 }]}>Áp dụng</Text>
                        )}
                      </Pressable>
                    </View>
                    {promoError ? (
                      <View style={styles.errorRow}>
                        <Icon name="alert" size={14} color={colors.danger} />
                        <Text style={[type.caption, styles.grow, { color: colors.danger }]}>{promoError}</Text>
                      </View>
                    ) : (
                      <Text style={[type.caption, { color: colors.ink600 }]}>Mã khuyến mãi hiện áp dụng cho khoá học.</Text>
                    )}
                  </View>
                )}
              </Block>
            </View>

            {/* 3. Chi tiết thanh toán */}
            <Block title="Chi tiết thanh toán">
              <View style={styles.summary}>
                <SummaryRow label={`Tạm tính (${cart.count} món)`} value={formatPrice(cart.total)} />
                {discount > 0 ? <SummaryRow label={`Giảm giá · ${promo?.code}`} value={`−${formatPrice(discount)}`} accent /> : null}
                <View style={[styles.dashed, { borderColor: colors.line }]} />
                <View style={styles.sumTotal}>
                  <Text style={[type.label, { color: colors.ink900 }]}>Tổng thanh toán</Text>
                  <Text style={[styles.sumTotalValue, { color: colors.ink900 }]}>{formatPrice(total)}</Text>
                </View>
              </View>
            </Block>
          </>
        )}
      </ScrollView>

      {!empty && !form.keyboardOpen && (
        <View pointerEvents="box-none" style={[styles.panelWrap, { bottom: panelBottom }]}>
          <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.floatShadow }]}>
            <View style={styles.grow}>
              <View style={styles.panelTotalRow}>
                <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
                  Tổng cộng
                </Text>
                {discount > 0 ? <Text style={[styles.strike, { color: colors.ink400 }]}>{formatPrice(cart.total)}</Text> : null}
              </View>
              <Text style={[styles.total, { color: colors.ink900 }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatPrice(total)}
              </Text>
            </View>
            <View style={styles.payBtn}>
              <PrimaryButton label="Thanh toán" onPress={() => showToast('Thanh toán sẽ làm ở bước sau')} />
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/** Khối của trang đơn hàng: tiêu đề nhỏ + thẻ phẳng (nền thẻ, viền mảnh, không bóng). */
function Block({ title, right, children }: { title: string; right?: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text accessibilityRole="header" style={[styles.blockTitle, { color: colors.ink900 }]}>
          {title}
        </Text>
        {right ? <Text style={[type.caption, { color: colors.ink600 }]}>{right}</Text> : null}
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>{children}</View>
    </View>
  );
}

function SummaryRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sumRow}>
      <Text style={[type.input, styles.grow, { color: accent ? colors.emerald700 : colors.ink600 }]}>{label}</Text>
      <Text style={[styles.sumValue, { color: accent ? colors.emerald700 : colors.ink900 }]}>{value}</Text>
    </View>
  );
}

function Thumb({ item }: { item: CartItem }) {
  const { colors } = useTheme();
  if (item.type === 'course') {
    return (
      <View style={[styles.thumbCourse, { backgroundColor: colors.surfaceAlt }]}>
        <CourseCover id={item.id} coverUrl={item.coverUrl} iconSize={26} />
      </View>
    );
  }
  return (
    <View style={styles.thumbSlot}>
      <View style={[styles.thumbBook, { backgroundColor: chapterPalette[item.cover ?? 'teal'].base, boxShadow: colors.shadowBook }]}>
        {item.coverUrl ? <Image source={{ uri: item.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Icon name="book" size={18} color="#ffffff" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  centerText: { textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, zIndex: 10 },
  countPill: { minWidth: 28, height: 26, paddingHorizontal: 9, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  countText: { fontFamily: fonts.sans700, fontSize: 14, lineHeight: 18 },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 24 },
  contentEmpty: { flexGrow: 1 },

  block: { gap: 10 },
  blockHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  blockTitle: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14 },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingVertical: 14 },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  kind: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16 },
  title: { fontFamily: fonts.display600, fontSize: 15, lineHeight: 21 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  price: { fontFamily: fonts.sans700, fontSize: 15, lineHeight: 22 },
  codeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, height: 20, borderRadius: 6 },
  codeTagText: { fontFamily: fonts.sans700, fontSize: 11, lineHeight: 14 },
  remove: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
  thumbCourse: { width: 76, height: 54, borderRadius: 10, overflow: 'hidden' },
  thumbSlot: { width: 76, alignItems: 'center' },
  thumbBook: { width: 46, height: 68, borderRadius: 5, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },

  promoBox: { paddingVertical: 14, gap: 8 },
  promoRow: { flexDirection: 'row', gap: 8 },
  promoField: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingLeft: 12, paddingRight: 8, borderRadius: 14, borderWidth: 1.5 },
  promoInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.sans600,
    fontSize: 15,
    letterSpacing: 0.8,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  applyBtn: { height: 48, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', minWidth: 96 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voucher: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14, padding: 12, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed' },
  voucherIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  voucherCode: { fontFamily: fonts.sans700, fontSize: 15, lineHeight: 20, letterSpacing: 1 },
  voucherRemove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  summary: { paddingVertical: 14, gap: 10 },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sumValue: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  dashed: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 2 },
  sumTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sumTotalValue: { fontFamily: fonts.display600, fontSize: 20, lineHeight: 28 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyBtn: { alignSelf: 'stretch', marginTop: 12 },

  panelWrap: { position: 'absolute', left: 16, right: 16 },
  panel: { height: PANEL_H, flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 18, paddingRight: 12, borderRadius: 20, borderWidth: 1 },
  panelTotalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  total: { fontFamily: fonts.display600, fontSize: 22, lineHeight: 28, flexShrink: 1 },
  strike: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 18, textDecorationLine: 'line-through' },
  payBtn: { width: 144 },
});
