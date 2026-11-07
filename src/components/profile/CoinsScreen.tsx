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
import { InfoSection } from './InfoSection';
import { DayHeader, dayLabel, hhmm, ListFooter } from './ListParts';

const SOURCE_ICON: Record<string, IconName> = { referral: 'people', learning: 'courses', spend: 'cart', admin: 'verified' };

type Row = { kind: 'day'; key: string; label: string } | { kind: 'tx'; key: string; tx: CoinTx; first: boolean; last: boolean };

/**
 * Hồ sơ › Xu của tôi: thẻ số dư + lịch sử cộng / trừ xu ngay bên dưới (GET /v1/me/coins), nhóm theo ngày,
 * tải thêm 20 dòng khi cuộn gần cuối.
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

  // Gom theo ngày: chèn dòng tiêu đề ngày, đánh dấu dòng đầu / cuối nhóm để bo góc khối
  const rows = useMemo(() => {
    const out: Row[] = [];
    let current = '';
    list.items.forEach((tx, i) => {
      const label = dayLabel(tx.createdAt);
      const next = list.items[i + 1];
      if (label !== current) {
        current = label;
        out.push({ kind: 'day', key: `d-${tx.id}`, label });
      }
      const prev = out[out.length - 1];
      out.push({ kind: 'tx', key: `t-${tx.id}`, tx, first: prev.kind === 'day', last: !next || dayLabel(next.createdAt) !== label });
    });
    return out;
  }, [list.items]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubpageHeader title="Xu của tôi" scrolled={scrolled} />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        scrollEventThrottle={16}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <CoinBalanceCard coins={balance} />
            <InfoSection title="Lịch sử">{null}</InfoSection>
            {!list.loading && !list.error && list.items.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.line }]}>
                <Icon name="history" size={28} color={colors.ink400} />
                <Text style={[type.body, styles.center, { color: colors.ink600 }]}>Chưa có lần cộng / trừ xu nào.</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (item.kind === 'day' ? <DayHeader label={item.label} /> : <TxRow tx={item.tx} first={item.first} last={item.last} />)}
        ListFooterComponent={
          <ListFooter loading={list.loading || list.loadingMore} error={list.error} done={!list.hasMore} empty={list.items.length === 0} onRetry={list.reload} />
        }
      />
    </View>
  );
}

function TxRow({ tx, first, last }: { tx: CoinTx; first: boolean; last: boolean }) {
  const { colors } = useTheme();
  const plus = tx.amount > 0;
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.line },
        first && styles.rowFirst,
        last && styles.rowLast,
        !first && { borderTopWidth: 0 },
      ]}
      accessible
      accessibilityLabel={`${tx.description}, ${plus ? 'cộng' : 'trừ'} ${groupThousands(Math.abs(tx.amount))} xu, lúc ${hhmm(tx.createdAt)}`}
    >
      {!first && <View style={[styles.divider, { backgroundColor: colors.line }]} />}
      <View style={[styles.icon, { backgroundColor: plus ? colors.mint50 : colors.surfaceAlt }]}>
        <Icon name={SOURCE_ICON[tx.source] ?? 'coins'} size={18} color={plus ? colors.emerald700 : colors.ink600} />
      </View>
      <View style={styles.grow}>
        <Text style={[styles.desc, { color: colors.ink900 }]} numberOfLines={2}>
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
  content: { paddingTop: 8, paddingHorizontal: 16 },
  header: { gap: 20, marginBottom: -12 },
  empty: { alignItems: 'center', gap: 10, padding: 24, borderRadius: 20, borderWidth: 1, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderLeftWidth: 1, borderRightWidth: 1 },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  rowLast: { borderBottomWidth: 1, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  divider: { position: 'absolute', top: 0, left: 62, right: 14, height: StyleSheet.hairlineWidth },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  desc: { fontFamily: fonts.sans500, fontSize: 15, lineHeight: 21 },
  amount: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
});
