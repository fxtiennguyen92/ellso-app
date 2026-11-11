import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton } from '@/components/auth/AuthUI';
import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { CenterDialog } from '@/components/CenterDialog';
import { CourseCover } from '@/components/courses/CourseCover';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { Icon } from '@/components/Icon';
import { apiCartPromo, type CartItem, type CartPromo, kindLabel } from '@/data/cart';
import { formatPrice } from '@/data/courses';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { chapterPalette, illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { useCart } from './CartContext';
import { PromoSheet } from './PromoSheet';
import { RowBones } from '@/components/skeletons';

const formatCoins = (n: number) => n.toLocaleString('vi-VN');

/** Màu chữ loại sản phẩm: Khoá học = xanh lá (thương hiệu), Sách = tím, PDF = cam đất, Video = xanh dương (bảng màu chương). */
const kindColor = (kind: string, dark: boolean, emerald: string) => {
  const pal = { book: chapterPalette.plum, pdf: chapterPalette.terracotta, video: chapterPalette.steel }[kind];
  if (!pal) return emerald;
  return dark ? pal.inkDark : pal.base;
};

/**
 * Tab Giỏ hàng (chỉ hiện trên thanh tab khi giỏ có món). Các khối:
 * 1. Sản phẩm — thẻ chứa các hàng (ảnh, loại, tên, giá, nhãn mã nếu được giảm, nút bỏ).
 * 2. Giảm giá — một thẻ 2 dòng:
 *    • Mã khuyến mãi: nút "Thêm mã" → popup giữa màn nhập / kiểm tra / áp dụng (PromoSheet). Đã áp dụng → vé mã (viền đứt) + nút xoá.
 *      Giỏ đổi → tự kiểm tra lại mã.
 *    • Xu của tôi: số dư, nút "Sử dụng": trừ tối đa có thể = min(số dư, floor(còn phải trả / tỉ lệ)).
 * 4. Thanh toán — cuối nội dung (không nổi): dòng mã, dòng "Dùng N xu" (nếu có), tổng (giá gạch nếu có giảm), nút Thanh toán (chưa làm).
 * (Sau này: khối Xuất hoá đơn doanh nghiệp trước khối Thanh toán.)
 */
export function CartScreen() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset();
  const { token } = useAuth();
  const { cart, refresh, remove, loading, loaded } = useCart();
  const { showToast } = useDocuments();
  const [scrolled, setScrolled] = useState(false);

  const [promo, setPromo] = useState<CartPromo | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [useCoins, setUseCoins] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Giỏ đổi (thêm / bỏ món) → kiểm tra lại mã đang áp dụng; không còn hợp lệ thì bỏ mã + báo
  const signature = cart.items.map((i) => `${i.type}${i.id}`).join(',');
  useEffect(() => {
    if (!promo || !token) return;
    apiCartPromo(token, promo.code)
      .then(setPromo)
      .catch(() => {
        setPromo(null);
        showToast(`Mã ${promo.code} không còn áp dụng cho giỏ hàng`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // Xoá món: hỏi xác nhận trước (popup giữa màn)
  const [confirmItem, setConfirmItem] = useState<CartItem | null>(null);
  // Giữ món vừa hỏi để nội dung popup không trống trong lúc popup mờ dần khi đóng
  const [askedItem, setAskedItem] = useState<CartItem | null>(null);
  useEffect(() => {
    if (confirmItem) setAskedItem(confirmItem);
  }, [confirmItem]);
  const [removing, setRemoving] = useState(false);
  const onRemove = async () => {
    if (!confirmItem) return;
    setRemoving(true);
    const err = await remove(confirmItem.type, confirmItem.id);
    setRemoving(false);
    setConfirmItem(null);
    showToast(err ?? `Đã xoá "${confirmItem.title}" khỏi giỏ`);
  };

  const open = (item: CartItem) => {
    if (item.type === 'document' && item.kind === 'book') router.push(`/books/${item.id}`);
  };

  // Tiền: mã giảm trước, xu trừ trên phần còn lại
  const discount = promo?.discount ?? 0;
  const afterPromo = Math.max(0, cart.total - discount);
  const { balance, rate } = cart.coins;
  const coinsUsable = rate > 0 ? Math.min(balance, Math.floor(afterPromo / rate)) : 0;
  const coinsUsed = useCoins ? coinsUsable : 0;
  const coinMoney = coinsUsed * rate;
  const total = afterPromo - coinMoney;
  const eligible = useMemo(() => new Set((promo?.eligible ?? []).map((e) => `${e.type}${e.id}`)), [promo]);

  const empty = cart.count === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header: tiêu đề + số món (đệm dưới = đệm ngang 16) */}
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
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading && !empty} onRefresh={refresh} tintColor={colors.emerald700} />}
        contentContainerStyle={[styles.content, { paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + 24 }, empty && loaded && styles.contentEmpty]}
      >
        {empty && !loaded ? (
          <RowBones count={2} thumb={64} />
        ) : empty ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.mint50 }]}>
              <Icon name="cart" size={34} strokeWidth={1.8} color={colors.emerald700} duotone />
            </View>
            <Text style={[type.h2, styles.centerText, { color: colors.ink900 }]}>Giỏ hàng đang trống</Text>
            <Text style={[type.body, styles.centerText, { color: colors.ink600 }]}>Thêm khoá học hoặc sách bạn muốn mua, rồi thanh toán một lần.</Text>
            <View style={styles.emptyBtn}>
              {/* Không biết trước đó học viên đang mua sách hay khoá học → luôn về Trang chủ */}
              <PrimaryButton label="Quay lại" onPress={() => router.navigate('/')} />
            </View>
          </View>
        ) : (
          <>
            {/* 1. Sản phẩm */}
            <Block title="Sản phẩm">
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
                {cart.items.map((item, i) => (
                  <View key={`${item.type}-${item.id}`} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
                    {/* Trái: ảnh · Loại (màu riêng) · Tên 1 dòng · Tác giả. Phải: giá (thẳng cột với Tổng tiền) + nút xoá */}
                    <Pressable
                      accessibilityRole={item.kind === 'book' ? 'link' : undefined}
                      accessibilityLabel={`${kindLabel(item.kind)}: ${item.title}, ${formatPrice(item.price)}`}
                      onPress={() => open(item)}
                      style={styles.rowMain}
                    >
                      <Thumb item={item} />
                      <View style={styles.rowText}>
                        <View style={styles.kindRow}>
                          <Text style={[styles.kind, { color: kindColor(item.kind, scheme === 'dark', colors.emerald700) }]} numberOfLines={1}>
                            {kindLabel(item.kind)}
                          </Text>
                          {eligible.has(`${item.type}${item.id}`) ? (
                            <View style={[styles.codeTag, { backgroundColor: colors.mint50 }]}>
                              <Icon name="ticket" size={11} strokeWidth={2.4} color={colors.emerald700} />
                              <Text style={[styles.codeTagText, { color: colors.emerald700 }]}>{promo?.code}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[styles.title, { color: colors.ink900 }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.subtitle ? (
                          <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                    <View style={styles.rowRight}>
                      <Text style={[styles.price, { color: colors.ink900 }]}>{formatPrice(item.price)}</Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Bỏ ${item.title} khỏi giỏ`}
                        onPress={() => setConfirmItem(item)}
                        hitSlop={8}
                        style={({ pressed }) => [styles.remove, { opacity: pressed ? 0.5 : 1 }]}
                      >
                        {/* Đỏ nhẹ (danger mờ) để gợi ý thao tác xoá mà không quá gắt */}
                        <Icon name="trash" size={17} color={colors.danger} opacity={0.7} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </Block>

            {/* 2. Giảm giá: mã khuyến mãi + xu của tôi trong cùng một thẻ */}
            <Block title="Giảm giá">
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
                {promo ? (
                  <View style={styles.discRow}>
                    <View style={[styles.voucher, { backgroundColor: colors.mint50, borderColor: colors.emerald500 }]}>
                      <View style={[styles.voucherIcon, { backgroundColor: colors.emerald700 }]}>
                        <Icon name="ticket" size={18} strokeWidth={2} color={colors.onEmerald} />
                      </View>
                      <View style={styles.grow}>
                        <Text style={[styles.voucherCode, { color: colors.emerald800 }]}>{promo.code}</Text>
                        <Text style={[type.caption, { color: colors.emerald700 }]} numberOfLines={2}>
                          {promo.description ? `${promo.description} · ` : ''}Giảm {formatPrice(promo.discount)}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Xoá mã ${promo.code}`}
                        hitSlop={8}
                        onPress={() => setPromo(null)}
                        style={({ pressed }) => [styles.voucherRemove, { backgroundColor: pressed ? colors.mint100 : 'transparent' }]}
                      >
                        <Icon name="trash" size={18} color={colors.emerald800} />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.discRow}>
                    <View style={[styles.discIcon, { backgroundColor: colors.mint50 }]}>
                      <Icon name="ticket" size={20} color={colors.emerald700} />
                    </View>
                    <View style={styles.grow}>
                      <Text style={[type.label, { color: colors.ink900 }]}>Mã khuyến mãi</Text>
                      <Text style={[type.caption, { color: colors.ink600 }]}>Áp dụng cho khoá học trong giỏ</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Thêm mã khuyến mãi"
                      onPress={() => setPromoOpen(true)}
                      hitSlop={6}
                      style={({ pressed }) => [styles.addBtn, { backgroundColor: pressed ? colors.mint100 : colors.mint50 }]}
                    >
                      <Icon name="plus" size={15} strokeWidth={2.6} color={colors.emerald700} />
                      <Text style={[type.captionStrong, { color: colors.emerald700 }]}>Thêm mã</Text>
                    </Pressable>
                  </View>
                )}
                <View style={[styles.divider, { backgroundColor: colors.line }]} />
                <CoinsRow balance={balance} rate={rate} usable={coinsUsable} using={useCoins && coinsUsable > 0} onToggle={() => setUseCoins((v) => !v)} />
              </View>
            </Block>

            {/* 4. Thanh toán — nằm trong nội dung (cuối trang), không nổi */}
            <Block title="Thanh toán">
              <View style={[styles.card, styles.summary, { backgroundColor: colors.card, borderColor: colors.line }]}>
                {discount > 0 ? <SummaryRow icon="ticket" label={`Mã ${promo?.code}`} value={`−${formatPrice(discount)}`} /> : null}
                {coinMoney > 0 ? <SummaryRow icon="star" label={`Dùng ${formatCoins(coinsUsed)} xu`} value={`−${formatPrice(coinMoney)}`} /> : null}
                {discount > 0 || coinMoney > 0 ? <View style={[styles.dashed, { borderColor: colors.line }]} /> : null}
                <View style={styles.sumTotal}>
                  <Text style={[type.label, { color: colors.ink900 }]}>Tổng tiền</Text>
                  <View style={styles.sumTotalRight}>
                    {total < cart.total ? <Text style={[styles.strike, { color: colors.ink400 }]}>{formatPrice(cart.total)}</Text> : null}
                    <Text style={[styles.sumTotalValue, { color: colors.ink900 }]}>{formatPrice(total)}</Text>
                  </View>
                </View>
                <View style={styles.payBtn}>
                  <PrimaryButton label="Thanh toán" onPress={() => showToast('Thanh toán sẽ làm ở bước sau')} />
                </View>
              </View>
            </Block>
          </>
        )}
      </ScrollView>

      <CenterDialog visible={!!confirmItem} onClose={() => !removing && setConfirmItem(null)} title="Xoá khỏi giỏ hàng?">
        <Text style={[type.body, { color: colors.ink600 }]}>
          Bạn muốn xoá <Text style={{ fontFamily: fonts.sans700, color: colors.ink900 }}>{askedItem?.title}</Text> khỏi giỏ hàng?
        </Text>
        <View style={styles.confirmRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmItem(null)}
            disabled={removing}
            style={({ pressed }) => [styles.confirmBtn, styles.cancelBtn, { borderColor: colors.line, backgroundColor: pressed ? colors.surfaceAlt : colors.card }]}
          >
            <Text style={[type.label, { color: colors.ink900 }]}>Huỷ</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: removing }}
            onPress={onRemove}
            disabled={removing}
            style={({ pressed }) => [styles.confirmBtn, { backgroundColor: colors.danger, opacity: pressed || removing ? 0.85 : 1 }]}
          >
            {removing ? <ActivityIndicator color="#ffffff" /> : <Text style={[type.label, { color: '#ffffff' }]}>Xoá</Text>}
          </Pressable>
        </View>
      </CenterDialog>

      <PromoSheet
        visible={promoOpen}
        onClose={() => setPromoOpen(false)}
        onApplied={(p) => {
          setPromo(p);
          setPromoOpen(false);
          showToast(`Đã áp dụng mã ${p.code}`);
        }}
      />
    </View>
  );
}

/** Dòng Xu của tôi (trong thẻ Giảm giá): đồng xu vàng, số dư + ghi chú quy đổi, nút "Sử dụng" ↔ "Đang dùng" (trừ tối đa có thể). */
function CoinsRow({ balance, rate, usable, using, onToggle }: { balance: number; rate: number; usable: number; using: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  const note =
    balance === 0
      ? 'Bạn chưa có xu'
      : usable === 0
        ? `Đơn từ ${formatPrice(rate)} mới dùng được xu`
        : using
          ? `Đang trừ ${formatCoins(usable)} xu = ${formatPrice(usable * rate)}`
          : `Dùng được ${formatCoins(usable)} xu = ${formatPrice(usable * rate)}`;

  return (
    <View style={styles.discRow}>
      <View style={styles.coin}>
        <Svg width={40} height={40} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="cartCoin" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={illo.goldHi} />
              <Stop offset="1" stopColor={illo.goldLo} />
            </LinearGradient>
          </Defs>
          <Circle cx={20} cy={20} r={20} fill="url(#cartCoin)" />
          <Circle cx={20} cy={20} r={14.5} fill="none" stroke={illo.goldEdge} strokeOpacity={0.35} strokeWidth={1.5} />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.coinIcon]}>
          <Icon name="star" size={19} strokeWidth={2} color={illo.goldInk} fill={illo.goldHi} fillOpacity={1} />
        </View>
      </View>
      <View style={styles.grow}>
        <Text style={[type.label, { color: colors.ink900 }]}>
          Xu của tôi · <Text style={{ color: colors.amberChipText }}>{formatCoins(balance)} xu</Text>
        </Text>
        <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={2}>
          {note}
        </Text>
      </View>
      {usable > 0 ? (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: using }}
          accessibilityLabel={`Dùng xu để trừ vào thanh toán, ${formatCoins(usable)} xu`}
          onPress={onToggle}
          style={({ pressed }) => [
            styles.useBtn,
            using
              ? { backgroundColor: colors.mint50, borderColor: colors.emerald500, borderWidth: 1.5 }
              : { backgroundColor: pressed ? colors.emerald800 : colors.emerald700, boxShadow: `0px ${pressed ? 1 : 3}px 0px ${colors.emeraldEdge}` },
            pressed && !using && { transform: [{ translateY: 2 }] },
          ]}
        >
          {using ? <Icon name="check" size={14} strokeWidth={3} color={colors.emerald700} /> : null}
          <Text style={[type.captionStrong, { color: using ? colors.emerald700 : colors.onEmerald }]}>{using ? 'Đang dùng' : 'Sử dụng'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Khối của trang: tiêu đề + (tuỳ chọn) nút cùng hàng bên phải. */
function Block({ title, action, children }: { title: string; action?: ReactNode; children?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text accessibilityRole="header" style={[styles.blockTitle, { color: colors.ink900 }]}>
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function SummaryRow({ icon, label, value }: { icon: 'ticket' | 'star'; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sumRow}>
      <Icon name={icon} size={16} color={colors.emerald700} />
      <Text style={[type.input, styles.grow, { color: colors.ink600 }]}>{label}</Text>
      <Text style={[styles.sumValue, { color: colors.emerald700 }]}>{value}</Text>
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
  blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 32 },
  blockTitle: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 12, borderRadius: 9999 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, minWidth: 0, gap: 1 },
  kindRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowRight: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', paddingVertical: 2 },
  kind: { fontFamily: fonts.sans700, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  title: { fontFamily: fonts.display600, fontSize: 15, lineHeight: 21 },
  price: { fontFamily: fonts.sans700, fontSize: 15, lineHeight: 22 },
  codeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, height: 20, borderRadius: 6 },
  codeTagText: { fontFamily: fonts.sans700, fontSize: 11, lineHeight: 14 },
  remove: { height: 28, alignItems: 'flex-end', justifyContent: 'flex-end' },
  thumbCourse: { width: 76, height: 54, borderRadius: 10, overflow: 'hidden' },
  thumbSlot: { width: 76, alignItems: 'center' },
  thumbBook: { width: 46, height: 68, borderRadius: 5, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },

  discRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  discIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
  voucher: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed' },
  voucherIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  voucherCode: { fontFamily: fonts.sans700, fontSize: 15, lineHeight: 20, letterSpacing: 1 },
  voucherRemove: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  coin: { width: 40, height: 40 },
  coinIcon: { alignItems: 'center', justifyContent: 'center' },
  useBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 12, borderRadius: 10 },

  summary: { paddingVertical: 14, gap: 10 },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sumValue: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  dashed: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 2 },
  sumTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sumTotalValue: { fontFamily: fonts.display600, fontSize: 20, lineHeight: 28 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyBtn: { alignSelf: 'stretch', marginTop: 12 },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  confirmBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { borderWidth: 1.5 },

  sumTotalRight: { alignItems: 'flex-end' },
  strike: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16, textDecorationLine: 'line-through' },
  payBtn: { marginTop: 6 },
});
