import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/auth/AuthProvider';
import { initialsOf } from '@/data/auth';
import {
  type ContentBlock,
  dayMonth,
  formatVnd,
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

/**
 * Bottom sheet "Chương trình huấn luyện" (bấm thẻ ở Home), cao ~85% màn hình, 2 tab:
 * - Tổng quan: chỉ mô tả + nội dung CMS.
 * - Lịch trình: hàng ngang các buổi (mặc định chọn buổi sắp tới gần nhất), bên dưới là giờ + địa điểm của buổi đang chọn.
 * Nút nổi phía dưới: "Tham gia miễn phí" hoặc "Phí tham gia 1.500.000 ₫". Chi tiết tải từ GET /v1/trainings/{id}.
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
                ['schedule', `Lịch trình · ${total} buổi`],
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
            <Overview t={t} detail={detail} />
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
                    setTimeout(() => router.push('/profile/membership'), 250);
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
                label={full ? 'Đã hết chỗ' : !t.registrationOpen ? 'Đã đóng đăng ký' : t.isFree ? 'Tham gia miễn phí' : `Phí tham gia ${formatVnd(t.price)}`}
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

/** Tab Tổng quan: ảnh (nếu có) + mô tả + nội dung CMS (ngày, số buổi, địa điểm… đã có ở thẻ và tab Lịch trình; phí nằm trên nút). */
function Overview({ t, detail }: { t: HomeTraining; detail: TrainingDetail | null }) {
  const { colors } = useTheme();
  const empty = !t.summary && detail !== null && detail.blocks.length === 0;
  return (
    <View style={styles.overview}>
      {t.bannerUrl && <Image source={{ uri: t.bannerUrl }} style={[styles.banner, { backgroundColor: colors.mint50 }]} contentFit="cover" transition={150} />}
      {t.summary ? <RichText text={t.summary} style={[styles.summary, { color: colors.ink900 }]} /> : null}
      {detail?.blocks.map((b, i) => <Block key={i} block={b} />)}
      {empty && <Text style={[type.caption, { color: colors.ink600 }]}>Chưa có mô tả cho chương trình này.</Text>}
    </View>
  );
}

/** "**đậm**" trong nội dung CMS → chữ đậm. */
function RichText({ text, style }: { text: string; style: object }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <Text key={i} style={{ fontFamily: fonts.sans700 }}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

/** Nội dung CMS (giống trang chiến dịch): đoạn văn, tiêu đề, gạch đầu dòng, các bước, ảnh, ghi chú. */
function Block({ block }: { block: ContentBlock }) {
  const { colors } = useTheme();
  switch (block.type) {
    case 'heading':
      return <Text style={[type.cardTitle, { color: colors.ink900 }]}>{block.text}</Text>;
    case 'paragraph':
      return <RichText text={block.text} style={[styles.summary, { color: colors.ink900 }]} />;
    case 'bullets':
    case 'steps':
      return (
        <View style={styles.list}>
          {block.title && <Text style={[type.label, { color: colors.ink900 }]}>{block.title}</Text>}
          {block.items.map((it, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={[type.label, styles.listMark, { color: colors.emerald700 }]}>{block.type === 'steps' ? `${i + 1}.` : '•'}</Text>
              <RichText text={it} style={[styles.summary, styles.grow, { color: colors.ink900 }]} />
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
          <RichText text={block.text} style={[type.caption, { color: colors.ink600 }]} />
        </View>
      );
    default:
      return null;
  }
}

const DAY_W = 64;
const DAY_STEP = DAY_W + StyleSheet.hairlineWidth; // ô + vạch ngăn

/**
 * Tab Lịch trình: hàng ngang các buổi (cuộn ngang, ô phẳng ngăn bằng vạch mảnh), buổi đang chọn luôn được cuộn
 * vào giữa tầm nhìn (kể cả buổi cuối nằm ngoài mép phải). Bên dưới: ngày giờ + địa điểm của buổi đang chọn.
 */
function Schedule({ sessions, selected, onSelect }: { sessions: Session[]; selected: number; onSelect: (i: number) => void }) {
  const { colors } = useTheme();
  const rowRef = useRef<ScrollViewInstance>(null);
  const [rowW, setRowW] = useState(0);
  const firstScroll = useRef(true);
  const s = sessions[selected];

  const reveal = useCallback(() => {
    if (!rowW) return;
    const x = Math.max(0, selected * DAY_STEP - (rowW - DAY_W) / 2);
    rowRef.current?.scrollTo({ x, animated: !firstScroll.current });
    firstScroll.current = false;
  }, [selected, rowW]);
  useEffect(() => {
    const id = requestAnimationFrame(reveal);
    return () => cancelAnimationFrame(id);
  }, [reveal]);

  if (!s) return <Text style={[type.caption, { color: colors.ink600 }]}>Chưa có lịch.</Text>;
  const f = formatSession(s);
  const d = new Date(s.start);

  return (
    <View style={styles.schedule}>
      <ScrollView
        ref={rowRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setRowW(e.nativeEvent.layout.width)}
        onContentSizeChange={() => firstScroll.current && reveal()}
        style={styles.daysRow}
      >
        {sessions.map((x, i) => {
          const on = i === selected;
          const past = x.state === 'past';
          const xd = new Date(x.start);
          return (
            <View key={x.number} style={styles.dayWrap}>
              {i > 0 && <View style={[styles.daySep, { backgroundColor: colors.line }]} />}
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Buổi ${x.number}, ngày ${dayMonth(x.start)}${past ? ', đã diễn ra' : ''}`}
                onPress={() => onSelect(i)}
                style={[styles.day, on && { backgroundColor: colors.mint50 }]}
              >
                <View style={styles.dayTop}>
                  {past && <Icon name="check" size={11} strokeWidth={3} color={on ? colors.emerald700 : colors.ink400} />}
                  <Text style={[styles.dayNum, { color: on ? colors.emerald700 : colors.ink600 }]}>Buổi {x.number}</Text>
                </View>
                <Text style={[styles.dayBig, { color: on ? colors.emerald700 : past ? colors.ink400 : colors.ink900 }]}>{xd.getDate()}</Text>
                <Text style={[styles.dayNum, { color: on ? colors.emerald700 : colors.ink600 }]}>Th {xd.getMonth() + 1}</Text>
                <View style={[styles.dayBar, { backgroundColor: on ? colors.emerald700 : 'transparent' }]} />
              </Pressable>
            </View>
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
                <Icon name="map" size={18} color={colors.emerald700} />
                <Text style={[type.label, { color: colors.emerald700 }]}>Mở bản đồ</Text>
              </Pressable>
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
  list: { gap: 6 },
  listRow: { flexDirection: 'row', gap: 8 },
  listMark: { width: 18, lineHeight: 24 },
  callout: { borderLeftWidth: 3, paddingLeft: 12, gap: 2 },
  schedule: { gap: 20 },
  daysRow: { flexGrow: 0 },
  dayWrap: { flexDirection: 'row', alignItems: 'center' },
  daySep: { width: StyleSheet.hairlineWidth, height: 28, opacity: 0.9 },
  day: { width: DAY_W, alignItems: 'center', paddingTop: 10 },
  dayTop: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dayNum: { fontFamily: fonts.sans600, fontSize: 11, lineHeight: 14 },
  dayBig: { fontFamily: fonts.display700, fontSize: 22, lineHeight: 30 },
  dayBar: { alignSelf: 'stretch', height: 3, marginTop: 8 },
  detail: { gap: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  placeBlock: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 4 },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, alignSelf: 'flex-start' },
  floating: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8 },
  errorBox: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 4 },
  buttonWrap: { borderRadius: 18 },
  done: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, borderWidth: 1, paddingVertical: 16 },
});
