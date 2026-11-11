import { useCallback, useMemo, useRef } from 'react';
import { Animated, FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { Icon, type IconName } from '@/components/Icon';
import { apiCoinHistory, type CoinTx } from '@/data/account';
import { groupThousands } from '@/data/profile';
import { useCursorList } from '@/hooks/useCursorList';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { COIN_HERO_BODY, COIN_HERO_BODY_MIN, COIN_HERO_ROW, CoinHero } from './CoinCard';
import { DayHeader, dayLabel, hhmm, ListFooter } from './ListParts';

const SOURCE_ICON: Record<string, IconName> = { referral: 'people', learning: 'courses', spend: 'cart', admin: 'verified' };

type Row = { kind: 'day'; key: string; label: string } | { kind: 'tx'; key: string; tx: CoinTx; first: boolean };

/**
 * Hồ sơ › Xu của tôi.
 * - Hero vàng (CoinHero) phủ trên cùng, luôn thấy: số xu to + số liệu tháng; cuộn danh sách thì hero thu gọn theo
 *   đúng quãng cuộn (dòng đầu luôn nằm ngay dưới hero), số xu thu nhỏ nhưng vẫn hiện.
 * - Danh sách "Biến động xu" (GET /v1/me/coins): nhóm theo ngày, mỗi lần cộng / dùng xu là một hàng phẳng có đường kẻ
 *   mảnh; tải thêm 20 dòng khi gần cuối.
 */
export function CoinsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token, user, refreshUser } = useAuth();
  const topInset = Platform.OS === 'web' ? 20 : insets.top + 8;

  const fetchPage = useCallback(
    (cursor: string | null) => {
      if (!token) return Promise.reject(new Error('no token'));
      if (!cursor) refreshUser();
      return apiCoinHistory(token, cursor);
    },
    [token, refreshUser],
  );
  const list = useCursorList(fetchPage);
  const balance = list.meta?.balance ?? user?.coins ?? 0;

  // Hero thu gọn theo cuộn (chiều cao → không dùng native driver)
  const scrollY = useRef(new Animated.Value(0)).current;
  const full = topInset + COIN_HERO_ROW + COIN_HERO_BODY;
  const range = COIN_HERO_BODY - COIN_HERO_BODY_MIN;
  const heroHeight = scrollY.interpolate({ inputRange: [0, range], outputRange: [full, full - range], extrapolate: 'clamp' });
  const collapse = scrollY.interpolate({ inputRange: [0, range], outputRange: [0, 1], extrapolate: 'clamp' });

  const rows = useMemo(() => {
    const out: Row[] = [];
    let current = '';
    list.items.forEach((tx) => {
      const label = dayLabel(tx.createdAt);
      if (label !== current) {
        current = label;
        out.push({ kind: 'day', key: `d-${tx.id}`, label });
        out.push({ kind: 'tx', key: `t-${tx.id}`, tx, first: true });
      } else out.push({ kind: 'tx', key: `t-${tx.id}`, tx, first: false });
    });
    return out;
  }, [list.items]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <FlatList
        style={styles.screen}
        data={rows}
        keyExtractor={(r) => r.key}
        // FlatList thường + setValue: Animated.FlatList trên web không tải thêm khối hàng khi cuộn
        onScroll={(e) => scrollY.setValue(e.nativeEvent.contentOffset.y)}
        initialNumToRender={20}
        scrollEventThrottle={16}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: full + 8, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.ink600 }]}>
            Biến động xu
          </Text>
        }
        ListEmptyComponent={
          !list.loading && !list.error ? (
            <View style={styles.empty}>
              <Icon name="history" size={28} color={colors.ink400} />
              <Text style={[type.body, styles.center, { color: colors.ink600 }]}>Chưa có lần cộng / dùng xu nào.</Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) =>
          item.kind === 'day' ? (
            <View style={styles.dayWrap}>
              <DayHeader label={item.label} />
            </View>
          ) : (
            <TxRow tx={item.tx} first={item.first} />
          )
        }
        ListFooterComponent={
          <ListFooter loading={list.loading || list.loadingMore} error={list.error} done={!list.hasMore} empty={list.items.length === 0} onRetry={list.reload} />
        }
      />

      <Animated.View style={[styles.hero, { height: heroHeight }]}>
        <CoinHero
          topInset={topInset}
          coins={balance}
          earnedMonth={list.meta ? list.meta.earnedMonth : null}
          spentMonth={list.meta ? list.meta.spentMonth : null}
          collapse={collapse}
        />
      </Animated.View>
    </View>
  );
}

function TxRow({ tx, first }: { tx: CoinTx; first: boolean }) {
  const { colors } = useTheme();
  const plus = tx.amount > 0;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${tx.description}, ${plus ? 'cộng' : 'dùng'} ${groupThousands(Math.abs(tx.amount))} xu, lúc ${hhmm(tx.createdAt)}`}
    >
      {!first && <View style={[styles.divider, { backgroundColor: colors.line }]} />}
      <View style={[styles.icon, { backgroundColor: plus ? colors.mint50 : colors.surfaceAlt }]}>
        <Icon name={SOURCE_ICON[tx.source] ?? 'coins'} size={16} color={plus ? colors.emerald700 : colors.ink600} />
      </View>
      <View style={styles.grow}>
        <Text style={[styles.desc, { color: colors.ink900 }]} numberOfLines={1}>
          {tx.description}
        </Text>
        <Text style={[type.caption, { color: colors.ink400 }]} numberOfLines={1}>
          {tx.sourceLabel} · {hhmm(tx.createdAt)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: plus ? colors.emerald700 : colors.ink900 }]}>
        {plus ? '+' : '−'}
        {groupThousands(Math.abs(tx.amount))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: 'center' },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  sectionTitle: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18, textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 20, paddingTop: 12 },
  dayWrap: { paddingHorizontal: 16 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  divider: { position: 'absolute', top: 0, left: 64, right: 20, height: StyleSheet.hairlineWidth },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  desc: { fontFamily: fonts.sans500, fontSize: 15, lineHeight: 21 },
  amount: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
});
