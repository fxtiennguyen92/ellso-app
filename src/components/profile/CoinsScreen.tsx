import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { Icon, type IconName } from '@/components/Icon';
import { SubpageHeader } from '@/components/SubpageHeader';
import { apiCoinHistory, type CoinTx } from '@/data/account';
import { groupThousands } from '@/data/profile';
import { useCursorList } from '@/hooks/useCursorList';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { CoinBalanceCard } from './CoinCard';
import { DayHeader, dayLabel, hhmm, ListFooter } from './ListParts';

const SOURCE_ICON: Record<string, IconName> = { referral: 'people', learning: 'courses', spend: 'cart', admin: 'verified' };

type Row = { kind: 'day'; key: string; label: string } | { kind: 'tx'; key: string; tx: CoinTx; first: boolean };

/**
 * Hồ sơ › Xu của tôi.
 * - Phần trên ĐỨNG YÊN: khối "Số xu hiện có" (phẳng, chỉ là thông tin) + tiêu đề "Biến động xu" → cuộn bao nhiêu vẫn thấy số xu.
 * - Chỉ danh sách bên dưới cuộn (GET /v1/me/coins): nhóm theo ngày (tiêu đề ngày dính trên đầu danh sách), mỗi lần
 *   cộng / trừ là một dòng phẳng có đường kẻ mảnh (không làm thẻ cho đỡ tốn chỗ); tải thêm 20 dòng khi gần cuối.
 */
export function CoinsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token, user, refreshUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);

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

  // Gom theo ngày: chèn dòng tiêu đề ngày (dính khi cuộn), dòng đầu nhóm không có đường kẻ trên
  const { rows, sticky } = useMemo(() => {
    const out: Row[] = [];
    const idx: number[] = [];
    let current = '';
    list.items.forEach((tx) => {
      const label = dayLabel(tx.createdAt);
      if (label !== current) {
        current = label;
        idx.push(out.length);
        out.push({ kind: 'day', key: `d-${tx.id}`, label });
        out.push({ kind: 'tx', key: `t-${tx.id}`, tx, first: true });
      } else out.push({ kind: 'tx', key: `t-${tx.id}`, tx, first: false });
    });
    return { rows: out, sticky: idx };
  }, [list.items]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubpageHeader title="Xu của tôi" />

      {/* Phần cố định */}
      <View style={[styles.fixed, { borderBottomColor: scrolled ? colors.line : 'transparent' }]}>
        <CoinBalanceCard coins={balance} />
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.ink600 }]}>
          Biến động xu
        </Text>
      </View>

      <FlatList
        style={styles.screen}
        data={rows}
        keyExtractor={(r) => r.key}
        stickyHeaderIndices={sticky}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 2)}
        scrollEventThrottle={16}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
            <View style={[styles.dayWrap, { backgroundColor: colors.bg }]}>
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
  fixed: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 4, gap: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18, textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 4 },
  dayWrap: { paddingHorizontal: 16 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  divider: { position: 'absolute', top: 0, left: 64, right: 20, height: StyleSheet.hairlineWidth },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  desc: { fontFamily: fonts.sans500, fontSize: 15, lineHeight: 21 },
  amount: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
});
