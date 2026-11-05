import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon, type IconName } from '@/components/Icon';
import { useAuth } from '@/auth/AuthProvider';
import { initialsOf } from '@/data/auth';
import {
  type ContentBlock,
  dayMonth,
  feeParts,
  formatSession,
  type HomeTraining,
  loadTraining,
  registerTraining,
  type TrainingDetail,
} from '@/data/home';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

type Tab = 'overview' | 'schedule';
type Session = TrainingDetail['sessions'][number];

const placeKey = (s: Session) => (s.location ? `${s.location.label}|${s.location.address ?? ''}` : '');

/**
 * Bottom sheet "Chương trình huấn luyện" (bấm thẻ ở Home), cao ~85% màn hình, 2 tab:
 * - Tổng quan: banner, mô tả, danh sách thông tin (ngày bắt đầu, số buổi, giờ học, địa điểm, học phí), nội dung CMS.
 * - Lịch: hàng ngang các buổi (mặc định chọn buổi sắp tới gần nhất), bên dưới là giờ + địa điểm của buổi đang chọn.
 *   Mọi buổi cùng một địa điểm thì ghi rõ để người dùng khỏi phải dò từng buổi.
 * Nút đăng ký nổi phía dưới (không nằm trong footer). Chi tiết tải từ GET /v1/trainings/{id}.
 */
export function TrainingSheet({ training, onClose, onChanged }: { training: HomeTraining | null; onClose: () => void; onChanged: () => void }) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { height } = useWindowDimensions();

  const [shown, setShown] = useState<HomeTraining | null>(training); // giữ nội dung lúc bảng đang trượt xuống
  const [detail, setDetail] = useState<TrainingDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    if (!training) return;
    setShown(training);
    setDetail(null);
    setLoadError(null);
    setTab('overview');
    setError(null);
    setJustRegistered(false);
    let alive = true;
    loadTraining(training.id, token)
      .then((d) => {
        if (!alive) return;
        setDetail(d);
        // Mặc định chọn buổi sắp diễn ra gần nhất (hết rồi thì buổi cuối)
        const i = d.sessions.findIndex((s) => s.state === 'upcoming' || s.state === 'ongoing');
        setSelected(i >= 0 ? i : Math.max(0, d.sessions.length - 1));
      })
      .catch((e: unknown) => alive && setLoadError(e instanceof ApiError ? e.message : 'Không tải được chi tiết chương trình.'));
    return () => {
      alive = false;
    };
  }, [training, token]);

  const t = detail ?? shown;
  if (!t) return null;

  const registered = t.registered || justRegistered;
  const full = !registered && t.seatsLeft === 0;

  const register = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await registerTraining(t.id, token);
      setJustRegistered(true);
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? { message: e.message, code: e.code } : { message: 'Có lỗi xảy ra, thử lại sau.' });
    } finally {
      setBusy(false);
    }
  };

  const total = t.sessionsCount || t.schedule.length;

  return (
    <BottomSheet visible={!!training} onClose={onClose} title="Chương trình huấn luyện">
      <View style={{ height: height * 0.78 }}>
        {/* Đầu bảng: tên + HLV + tab (không cuộn) */}
        <View style={styles.top}>
          <Text style={[type.h2, { color: colors.ink900 }]} numberOfLines={2}>
            {t.title}
          </Text>
          <View style={styles.person}>
            <View style={[styles.avatar, { backgroundColor: colors.mint50, borderColor: colors.mint100 }]}>
              <Text style={[styles.avatarText, { color: colors.emerald700 }]}>{initialsOf(t.trainer ?? 'Ellso')}</Text>
            </View>
            <Text style={[type.caption, { color: colors.ink600 }]}>
              Huấn luyện viên <Text style={{ fontFamily: fonts.sans600, color: colors.ink900 }}>{t.trainer ?? 'Ellso'}</Text>
            </Text>
          </View>
          <View style={[styles.tabs, { borderBottomColor: colors.line }]} accessibilityRole="tablist">
            {(
              [
                ['overview', 'Tổng quan'],
                ['schedule', `Lịch học · ${total} buổi`],
              ] as const
            ).map(([key, label]) => {
              const on = tab === key;
              return (
                <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setTab(key)} style={styles.tab}>
                  <Text style={[type.label, { color: on ? colors.emerald700 : colors.ink600 }]}>{label}</Text>
                  <View style={[styles.tabLine, { backgroundColor: on ? colors.emerald700 : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView style={styles.grow} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {tab === 'overview' ? (
            <Overview t={t} detail={detail} full={full} />
          ) : detail ? (
            <Schedule sessions={detail.sessions} selected={selected} onSelect={setSelected} />
          ) : loadError ? (
            <Text style={[type.caption, { color: colors.danger }]}>{loadError}</Text>
          ) : (
            <ActivityIndicator color={colors.emerald700} style={styles.loading} />
          )}
        </ScrollView>

        {/* Nút nổi phía dưới */}
        <View style={styles.floating} pointerEvents="box-none">
          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.dangerLine, boxShadow: colors.shadowCard }]}>
              <Text style={[type.caption, { color: colors.danger }]}>{error.message}</Text>
              {error.code === 'membership_required' && (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => {
                    onClose();
                    setTimeout(() => router.push('/profile/quan-ly-goi'), 250);
                  }}
                >
                  <Text style={[type.label, { color: colors.emerald700 }]}>Xem gói thành viên</Text>
                </Pressable>
              )}
            </View>
          )}
          {registered ? (
            <View style={[styles.done, { backgroundColor: colors.mint50, borderColor: colors.mint100, boxShadow: colors.shadowCard }]}>
              <Icon name="check" size={18} strokeWidth={2.6} color={colors.emerald700} />
              <Text style={[type.label, { color: colors.emerald700 }]}>Bạn đã đăng ký chương trình này</Text>
            </View>
          ) : (
            <View style={[styles.buttonWrap, { boxShadow: colors.shadowCard }]}>
              <PrimaryButton
                label={full ? 'Đã hết chỗ' : !t.registrationOpen ? 'Đã đóng đăng ký' : 'Đăng ký tham gia'}
                disabled={full || !t.registrationOpen}
                loading={busy}
                onPress={register}
              />
            </View>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

/** Tab Tổng quan: không dùng thẻ — danh sách dòng có đường kẻ mảnh. */
function Overview({ t, detail, full }: { t: HomeTraining; detail: TrainingDetail | null; full: boolean }) {
  const { colors } = useTheme();
  const first = t.schedule[0];
  const last = t.schedule[t.schedule.length - 1];
  const total = t.sessionsCount || t.schedule.length;
  const fee = feeParts(t.isFree, t.price);

  const sessions = detail?.sessions ?? [];
  const sameTime = sessions.length > 0 && sessions.every((s) => formatSession(s).startTime === formatSession(sessions[0]).startTime && formatSession(s).endTime === formatSession(sessions[0]).endTime);
  const places = new Set(sessions.map(placeKey));
  const onePlace = sessions.length > 0 && places.size === 1 ? sessions[0].location : null;

  const rows: { icon: IconName; label: string; value: string; sub?: string; tone?: 'danger' }[] = [
    ...(first ? [{ icon: 'clock' as const, label: 'Ngày bắt đầu', value: `${formatSession(first).weekday}, ${dayMonth(first.start)}`, sub: first.state === 'upcoming' ? formatSession(first).countdown : 'Đã khai giảng' }] : []),
    { icon: 'layers', label: 'Số buổi', value: `${total} buổi`, sub: last && total > 1 ? `đến ${dayMonth(last.start)}` : undefined },
    ...(first ? [{ icon: 'clock' as const, label: 'Giờ học', value: sameTime || !detail ? `${formatSession(first).startTime} – ${formatSession(first).endTime}` : 'Theo từng buổi' }] : []),
    {
      icon: 'pin',
      label: 'Địa điểm',
      value: onePlace ? onePlace.label : detail && places.size > 1 ? `${places.size} địa điểm` : (t.next.place ?? 'Sẽ thông báo'),
      sub: onePlace?.address ?? (detail && places.size > 1 ? 'Xem từng buổi ở tab Lịch học' : undefined),
    },
    { icon: 'tag', label: 'Học phí', value: fee.main, sub: fee.sub ?? undefined },
    ...(full ? [{ icon: 'people' as const, label: 'Chỗ', value: 'Hết chỗ', tone: 'danger' as const }] : []),
  ];

  return (
    <View style={styles.overview}>
      {t.bannerUrl && <Image source={{ uri: t.bannerUrl }} style={[styles.banner, { backgroundColor: colors.mint50 }]} contentFit="cover" transition={150} />}
      {t.summary ? <Text style={[styles.summary, { color: colors.ink900 }]}>{t.summary}</Text> : null}

      <View>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
            <Icon name={r.icon} size={18} color={colors.emerald700} />
            <Text style={[type.caption, styles.rowLabel, { color: colors.ink600 }]}>{r.label}</Text>
            <View style={styles.rowValue}>
              <Text style={[type.label, styles.right, { color: r.tone === 'danger' ? colors.danger : colors.ink900 }]}>{r.value}</Text>
              {r.sub && <Text style={[type.caption, styles.right, { color: colors.ink600 }]}>{r.sub}</Text>}
            </View>
          </View>
        ))}
      </View>

      {detail?.blocks.map((b, i) => <Block key={i} block={b} />)}
    </View>
  );
}

/** Nội dung CMS (giống trang chiến dịch): đoạn văn, tiêu đề, gạch đầu dòng, các bước, ảnh, ghi chú. */
function Block({ block }: { block: ContentBlock }) {
  const { colors } = useTheme();
  switch (block.type) {
    case 'heading':
      return <Text style={[type.cardTitle, { color: colors.ink900 }]}>{block.text}</Text>;
    case 'paragraph':
      return <Text style={[styles.summary, { color: colors.ink900 }]}>{block.text}</Text>;
    case 'bullets':
    case 'steps':
      return (
        <View style={styles.list}>
          {block.title && <Text style={[type.label, { color: colors.ink900 }]}>{block.title}</Text>}
          {block.items.map((it, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={[type.label, styles.listMark, { color: colors.emerald700 }]}>{block.type === 'steps' ? `${i + 1}.` : '•'}</Text>
              <Text style={[styles.summary, styles.grow, { color: colors.ink900 }]}>{it}</Text>
            </View>
          ))}
        </View>
      );
    case 'image':
      return <Image source={{ uri: block.url }} style={[styles.banner, { backgroundColor: colors.surfaceAlt }]} contentFit="cover" />;
    case 'callout':
      return (
        <View style={[styles.callout, { borderLeftColor: block.tone === 'warning' ? colors.spark500 : colors.emerald700 }]}>
          {block.title && <Text style={[type.label, { color: colors.ink900 }]}>{block.title}</Text>}
          <Text style={[type.caption, { color: colors.ink600 }]}>{block.text}</Text>
        </View>
      );
    default:
      return null;
  }
}

/** Tab Lịch học: hàng ngang các buổi + chi tiết buổi đang chọn. */
function Schedule({ sessions, selected, onSelect }: { sessions: Session[]; selected: number; onSelect: (i: number) => void }) {
  const { colors } = useTheme();
  const rowRef = useRef<ScrollViewInstance>(null);
  const s = sessions[selected];
  const samePlace = useMemo(() => sessions.length > 1 && new Set(sessions.map(placeKey)).size === 1, [sessions]);

  // Đưa buổi đang chọn vào giữa hàng ngang
  useEffect(() => {
    rowRef.current?.scrollTo({ x: Math.max(0, selected * 72 - 120), animated: true });
  }, [selected]);

  if (!s) return <Text style={[type.caption, { color: colors.ink600 }]}>Chưa có lịch.</Text>;
  const f = formatSession(s);
  const d = new Date(s.start);

  return (
    <View style={styles.schedule}>
      <ScrollView ref={rowRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
        {sessions.map((x, i) => {
          const on = i === selected;
          const past = x.state === 'past';
          const xf = formatSession(x);
          return (
            <Pressable
              key={x.number}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Buổi ${x.number}, ${xf.weekday} ${dayMonth(x.start)}${past ? ', đã diễn ra' : ''}`}
              onPress={() => onSelect(i)}
              style={[
                styles.day,
                on
                  ? { backgroundColor: colors.emerald700, borderColor: colors.emerald700 }
                  : { backgroundColor: colors.card, borderColor: colors.line, opacity: past ? 0.55 : 1 },
              ]}
            >
              <Text style={[styles.dayNum, { color: on ? colors.onEmeraldMuted : colors.ink600 }]}>Buổi {x.number}</Text>
              <Text style={[styles.dayBig, { color: on ? colors.onEmerald : colors.ink900 }]}>{new Date(x.start).getDate()}</Text>
              <Text style={[styles.dayNum, { color: on ? colors.onEmeraldMuted : colors.ink600 }]}>
                {xf.weekdayShort} · Th{new Date(x.start).getMonth() + 1}
              </Text>
              {past && !on && (
                <View style={[styles.dayCheck, { backgroundColor: colors.emerald700, borderColor: colors.card }]}>
                  <Icon name="check" size={9} strokeWidth={3.4} color={colors.onEmerald} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.detail}>
        <Text style={[type.eyebrow, { color: colors.emerald700 }]}>
          Buổi {s.number}/{sessions.length} · {s.state === 'past' ? 'Đã diễn ra' : s.state === 'ongoing' ? 'Đang diễn ra' : f.countdown}
        </Text>
        <Text style={[type.h2, { color: colors.ink900 }]}>
          {f.weekday}, {d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}
        </Text>
        <View style={styles.line}>
          <Icon name="clock" size={16} color={colors.ink600} />
          <Text style={[type.label, { color: colors.ink900 }]}>
            {f.startTime} – {f.endTime}
          </Text>
        </View>
        {s.note && <Text style={[type.caption, { color: colors.ink600 }]}>{s.note}</Text>}
      </View>

      <View style={[styles.placeBlock, { borderTopColor: colors.line }]}>
        <Text style={[type.eyebrow, { color: colors.ink600 }]}>Địa điểm</Text>
        {s.location ? (
          <>
            <Text style={[type.cardTitle, { color: colors.ink900 }]}>{s.location.label}</Text>
            {s.location.address && <Text style={[type.caption, { color: colors.ink600 }]}>{s.location.address}</Text>}
            {s.location.note && <Text style={[type.caption, { color: colors.ink600 }]}>{s.location.note}</Text>}
            {s.location.mapUrl && (
              <Pressable accessibilityRole="link" onPress={() => s.location?.mapUrl && Linking.openURL(s.location.mapUrl)} style={styles.mapLink} hitSlop={6}>
                <Icon name="pin" size={16} color={colors.emerald700} />
                <Text style={[type.label, { color: colors.emerald700 }]}>Mở bản đồ</Text>
              </Pressable>
            )}
            {samePlace && (
              <View style={[styles.same, { backgroundColor: colors.mint50 }]}>
                <Icon name="info" size={14} color={colors.emerald700} />
                <Text style={[type.caption, styles.grow, { color: colors.emerald800 }]}>Tất cả {sessions.length} buổi học tại cùng địa điểm này.</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={[type.caption, { color: colors.ink600 }]}>Địa điểm sẽ được thông báo sau.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  top: { gap: 8 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.sans700, fontSize: 10 },
  tabs: { flexDirection: 'row', gap: 24, borderBottomWidth: 1, marginTop: 4 },
  tab: { paddingTop: 8, gap: 8 },
  tabLine: { height: 3, borderRadius: 2, marginBottom: -1 },
  scroll: { paddingTop: 16, paddingBottom: 120 },
  loading: { paddingVertical: 24 },
  overview: { gap: 16 },
  banner: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16 },
  summary: { fontFamily: fonts.sans400, fontSize: 15, lineHeight: 24 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12 },
  rowLabel: { width: 96, paddingTop: 1 },
  rowValue: { flex: 1, alignItems: 'flex-end' },
  right: { textAlign: 'right' },
  list: { gap: 6 },
  listRow: { flexDirection: 'row', gap: 8 },
  listMark: { width: 18, lineHeight: 24 },
  callout: { borderLeftWidth: 3, paddingLeft: 12, gap: 2 },
  schedule: { gap: 20 },
  days: { gap: 8, paddingTop: 6, paddingRight: 8 },
  day: { width: 64, alignItems: 'center', paddingVertical: 10, borderRadius: 16, borderWidth: 1.5 },
  dayNum: { fontFamily: fonts.sans600, fontSize: 11, lineHeight: 14 },
  dayBig: { fontFamily: fonts.display700, fontSize: 22, lineHeight: 30 },
  dayCheck: { position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  detail: { gap: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  placeBlock: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 4 },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, alignSelf: 'flex-start' },
  same: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 10, marginTop: 12 },
  floating: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8 },
  errorBox: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 4 },
  buttonWrap: { borderRadius: 18 },
  done: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, borderWidth: 1, paddingVertical: 16 },
});
