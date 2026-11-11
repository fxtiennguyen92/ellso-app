import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { Icon } from '@/components/Icon';
import { SubpageHeader } from '@/components/SubpageHeader';
import { useToast } from '@/components/Toast';
import { UserAvatar } from '@/components/UserAvatar';
import { apiReferrals, type Friend } from '@/data/account';
import { initialsOf } from '@/data/auth';
import { dmy } from '@/data/profile';
import { useCursorList } from '@/hooks/useCursorList';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { AddReferrerSheet } from './AddReferrerSheet';
import { InfoSection } from './InfoSection';
import { ListFooter } from './ListParts';

/**
 * Hồ sơ › Bạn bè. Hai khối:
 * 1. Người giới thiệu: có → tên + email (không đổi được); chưa có → nút "Thêm" mở AddReferrerSheet.
 * 2. Bạn bè đã giới thiệu (GET /v1/me/referrals): tổng số + danh sách tên, ảnh, ngày tham gia; tải thêm khi cuộn tới cuối.
 */
export function FriendsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token, user, refreshUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, showToast] = useToast();

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  const fetchPage = useCallback((cursor: string | null) => (token ? apiReferrals(token, cursor) : Promise.reject(new Error('no token'))), [token]);
  const list = useCursorList(fetchPage);
  const total = list.meta?.total ?? list.items.length;
  const referrer = user?.referrer ?? null;
  const n = list.items.length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubpageHeader title="Bạn bè" scrolled={scrolled} />
      <FlatList
        data={list.items}
        keyExtractor={(f) => String(f.id)}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        scrollEventThrottle={16}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <InfoSection title="Người giới thiệu">
              {referrer ? (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
                  <View style={styles.person}>
                    <UserAvatar initials={initialsOf(referrer.name)} size={48} bg={colors.mint50} fg={colors.emerald800} />
                    <View style={styles.grow}>
                      <Text style={[styles.name, { color: colors.ink900 }]} numberOfLines={1}>
                        {referrer.name}
                      </Text>
                      {referrer.email ? (
                        <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
                          {referrer.email}
                        </Text>
                      ) : null}
                    </View>
                    <Icon name="verified" size={20} color={colors.emerald500} />
                  </View>
                  <View style={[styles.lockNote, { borderTopColor: colors.line }]}>
                    <Icon name="lock" size={14} color={colors.ink400} />
                    <Text style={[type.caption, styles.grow, { color: colors.ink600 }]}>Người giới thiệu đã được xác nhận và không thể thay đổi.</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.card, styles.person, { backgroundColor: colors.card, borderColor: colors.line }]}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.mint50 }]}>
                    <Icon name="userPlus" size={22} color={colors.emerald700} />
                  </View>
                  <View style={styles.grow}>
                    <Text style={[styles.emptyTitle, { color: colors.ink900 }]}>Chưa có người giới thiệu</Text>
                    <Text style={[type.caption, { color: colors.ink600 }]}>Ai đã giới thiệu bạn đến Ellso? Thêm mã của họ.</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Thêm người giới thiệu"
                    onPress={() => setAddOpen(true)}
                    style={({ pressed }) => [styles.addBtn, { backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }]}
                  >
                    <Text style={[type.captionStrong, { color: colors.onEmerald }]}>Thêm</Text>
                  </Pressable>
                </View>
              )}
            </InfoSection>

            <InfoSection title={list.loading ? 'Bạn bè đã giới thiệu' : `Bạn bè đã giới thiệu (${total})`}>
              {!list.loading && !list.error && n === 0 ? (
                <View style={[styles.card, styles.empty, { backgroundColor: colors.card, borderColor: colors.line }]}>
                  <Icon name="people" size={28} color={colors.ink400} />
                  <Text style={[type.body, styles.center, { color: colors.ink600 }]}>
                    Bạn chưa giới thiệu ai. Chia sẻ mã giới thiệu{user?.referralCode ? ` ${user.referralCode}` : ''} (nút QR ở trang Hồ sơ) để bạn bè đăng ký.
                  </Text>
                </View>
              ) : null}
            </InfoSection>
          </View>
        }
        renderItem={({ item, index }) => <FriendRow friend={item} first={index === 0} last={index === n - 1} />}
        ListFooterComponent={<ListFooter loading={list.loading || list.loadingMore} error={list.error} done={!list.hasMore} empty={n === 0} onRetry={list.reload} />}
      />

      <AddReferrerSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          setAddOpen(false);
          showToast('Đã thêm người giới thiệu');
        }}
      />
      {toast}
    </View>
  );
}

function FriendRow({ friend, first, last }: { friend: Friend; first: boolean; last: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.line },
        first && styles.rowFirst,
        last && styles.rowLast,
        !first && { borderTopWidth: 0 },
      ]}
    >
      {!first && <View style={[styles.divider, { backgroundColor: colors.line }]} />}
      <UserAvatar uri={friend.avatar} initials={initialsOf(friend.name)} size={40} bg={colors.mint50} fg={colors.emerald800} />
      <View style={styles.grow}>
        <Text style={[styles.friendName, { color: colors.ink900 }]} numberOfLines={1}>
          {friend.name}
        </Text>
        {friend.joinedAt ? <Text style={[type.caption, { color: colors.ink400 }]}>Tham gia {dmy(friend.joinedAt)}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: 'center' },
  content: { paddingTop: 8, paddingHorizontal: 16 },
  header: { gap: 24, marginBottom: 10 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  name: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  lockNote: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  addBtn: { paddingHorizontal: 16, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 10, padding: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderLeftWidth: 1, borderRightWidth: 1 },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  rowLast: { borderBottomWidth: 1, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  divider: { position: 'absolute', top: 0, left: 66, right: 14, height: StyleSheet.hairlineWidth },
  friendName: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
});
