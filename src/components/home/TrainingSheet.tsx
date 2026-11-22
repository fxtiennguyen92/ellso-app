import { Hint } from '@/components/onboarding/Onboarding';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { InstructorTag } from '@/components/InstructorTag';
import { Icon } from '@/components/Icon';
import { QrCode } from '@/components/QrCode';
import { CheckinScanner } from '@/components/home/CheckinScanner';
import { useAuth } from '@/auth/AuthProvider';
import {
  type ContentBlock,
  dayMonth,
  formatVnd,
  formatSession,
  type HomeTraining,
  loadTraining,
  registerTraining,
  type TrainingDetail,
  type TrainingTicket,
} from '@/data/home';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';
import { RowBones, TicketBones } from '@/components/skeletons';
import { lightColors } from '@/theme/tokens';

type Tab = 'ticket' | 'overview' | 'schedule';
type Session = TrainingDetail['sessions'][number];

/**
 * Bottom sheet "Chương trình huấn luyện" (bấm thẻ ở Home), cao ~85% màn hình, các tab:
 * - Thông tin vé (chỉ khi đã đăng ký, mở mặc định): mã vé + QR (app người hướng dẫn / kiểm soát viên quét để điểm danh),
 *   điểm danh từng buổi; nút nổi "Quét mã điểm danh" (quét QR của chương trình ở lớp để tự điểm danh).
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
  const [scanning, setScanning] = useState(false);

  /** Tải lại chi tiết (sau đăng ký / điểm danh) — giữ tab, buổi đang chọn. */
  const reload = useCallback(
    async (id: string) => {
      try {
        setDetail(await loadTraining(id, token));
      } catch {
        // giữ dữ liệu cũ
      }
    },
    [token],
  );

  useEffect(() => {
    if (!training) return;
    setShown(training);
    setDetail(null);
    setLoadError(null);
    setTab(training.registered ? 'ticket' : 'overview');
    setError(null);
    setJustRegistered(false);
    let alive = true;
    loadTraining(training.id, token)
      .then((d) => {
        if (!alive) return;
        setDetail(d);
        if (!d.ticket) setTab((x) => (x === 'ticket' ? 'overview' : x));
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
      await reload(t.id);
      setTab('ticket');
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
        {/* Đầu bảng: tên + người hướng dẫn + tab (không cuộn) */}
        <View style={styles.top}>
          <Text style={[type.h2, { color: colors.ink900 }]} numberOfLines={2}>
            {t.title}
          </Text>
          <View style={styles.person}>
            <InstructorTag name={t.trainer ?? 'Ellso'} avatar={t.trainerAvatar} size={38} />
          </View>
          <View style={[styles.tabs, { borderBottomColor: colors.line }]} accessibilityRole="tablist">
            {(
              [
                ...(detail?.ticket || (!detail && t.registered) ? ([['ticket', 'Thông tin vé']] as const) : []),
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
          {tab === 'ticket' ? (
            detail?.ticket ? (
              <View style={styles.ticketTab}>
                <Hint tip="hint-training" text="Khi đến lớp, đưa mã QR vé cho người hướng dẫn quét, hoặc bấm Quét mã điểm danh để tự điểm danh." />
                <Ticket t={detail} ticket={detail.ticket} />
              </View>
            ) : loadError ? (
              <Text style={[type.caption, { color: colors.danger }]}>{loadError}</Text>
            ) : (
              <TicketBones />
            )
          ) : tab === 'overview' ? (
            <Overview t={t} detail={detail} />
          ) : detail ? (
            <Schedule sessions={detail.sessions} selected={selected} onSelect={setSelected} />
          ) : loadError ? (
            <Text style={[type.caption, { color: colors.danger }]}>{loadError}</Text>
          ) : (
            <RowBones count={3} thumb={44} card={false} />
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
          {registered && tab === 'ticket' ? (
            <View style={[styles.buttonWrap, { boxShadow: colors.shadowCard }]}>
              <PrimaryButton label="Quét mã điểm danh" icon="scanQr" onPress={() => setScanning(true)} />
            </View>
          ) : registered ? (
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
      <CheckinScanner visible={scanning} onClose={() => setScanning(false)} onCheckedIn={() => reload(t.id)} />
    </BottomSheet>
  );
}

const METHOD_LABEL = { self_scan: 'Tự quét QR', staff_scan: 'Quét vé', manual: 'Điểm danh tay' } as const;
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Tab Thông tin vé: vé phẳng (thông tin, không bấm) — dải emerald đầu vé (tên chương trình, người giữ vé, mã vé),
 * mã QR lớn (luôn đen trên trắng để máy quét đọc được cả ở giao diện tối), rồi điểm danh từng buổi.
 */
function Ticket({ t, ticket }: { t: TrainingDetail; ticket: TrainingTicket }) {
  const { colors } = useTheme();
  const byNumber = new Map(ticket.attendance.map((a) => [a.number, a]));
  const present = ticket.attendance.filter((a) => a.checkedInAt).length;
  return (
    <View style={styles.ticketWrap}>
      <View style={[styles.ticket, { borderColor: colors.mint100, backgroundColor: colors.card }]}>
        <View style={[styles.ticketHead, { backgroundColor: colors.emerald700 }]}>
          <Text style={[type.eyebrow, { color: colors.onEmeraldMuted }]}>Vé tham dự · {t.sessions.length} buổi</Text>
          <Text style={[type.cardTitle, { color: colors.onEmerald }]} numberOfLines={2}>
            {t.title}
          </Text>
          <View style={styles.ticketMeta}>
            <View style={styles.grow}>
              <Text style={[styles.metaLabel, { color: colors.onEmeraldMuted }]}>Người tham dự</Text>
              <Text style={[type.label, { color: colors.onEmerald }]} numberOfLines={1}>
                {ticket.holder}
              </Text>
            </View>
            <View>
              <Text style={[styles.metaLabel, { color: colors.onEmeraldMuted }]}>Mã vé</Text>
              <Text style={[styles.code, { color: colors.onEmerald }]} selectable>
                {ticket.code}
              </Text>
            </View>
          </View>
        </View>
        {/* Đường xé vé */}
        <View style={styles.perf}>
          <View style={[styles.notch, styles.notchL, { backgroundColor: colors.card, borderColor: colors.mint100 }]} />
          <View style={[styles.dash, { borderColor: colors.mint100 }]} />
          <View style={[styles.notch, styles.notchR, { backgroundColor: colors.card, borderColor: colors.mint100 }]} />
        </View>
        <View style={styles.qrBox} accessible accessibilityLabel={`Mã QR vé ${ticket.code}`}>
          <View style={styles.qrPaper}>
            <QrCode value={ticket.qr} size={196} color={lightColors.ink900} background={lightColors.card} />
          </View>
          <Text style={[type.caption, styles.qrHint, { color: colors.ink600 }]}>
            Đưa mã này cho người hướng dẫn hoặc kiểm soát viên quét khi đến lớp — hoặc tự quét mã điểm danh của buổi học.
          </Text>
        </View>
      </View>

      <View style={styles.attHead}>
        <Text style={[type.cardTitle, { color: colors.ink900 }]}>Điểm danh</Text>
        <Text style={[type.caption, { color: colors.ink600 }]}>
          Có mặt {present}/{t.sessions.length} buổi
        </Text>
      </View>
      <View>
        {t.sessions.map((s, i) => {
          const a = byNumber.get(s.number);
          const f = formatSession(s);
          const d = new Date(s.start);
          return (
            <View key={s.number} style={[styles.attRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
              <View style={[styles.attNum, { backgroundColor: a?.checkedInAt ? colors.mint50 : colors.surfaceAlt }]}>
                <Text style={[type.label, { color: a?.checkedInAt ? colors.emerald700 : colors.ink600 }]}>{s.number}</Text>
              </View>
              <View style={styles.grow}>
                <Text style={[type.label, { color: colors.ink900 }]}>
                  {f.weekday}, {d.getDate()}/{d.getMonth() + 1}
                </Text>
                <Text style={[type.caption, { color: colors.ink600 }]}>
                  {f.startTime} – {f.endTime}
                  {s.state === 'ongoing' ? ' · Đang diễn ra' : ''}
                </Text>
              </View>
              {a?.checkedInAt ? (
                <View style={styles.attState}>
                  <View style={styles.line}>
                    <Icon name="check" size={14} strokeWidth={3} color={colors.emerald700} />
                    <Text style={[type.label, { color: colors.emerald700 }]}>Có mặt {hhmm(a.checkedInAt)}</Text>
                  </View>
                  {a.method && <Text style={[type.caption, { color: colors.ink600 }]}>{METHOD_LABEL[a.method]}</Text>}
                </View>
              ) : (
                <Text style={[type.caption, { color: s.state === 'past' ? colors.danger : colors.ink400 }]}>
                  {s.state === 'past' ? 'Vắng' : s.state === 'cancelled' ? 'Đã huỷ' : 'Chưa điểm danh'}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
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
  ticketTab: { gap: 14 },
  grow: { flex: 1 },
  top: { gap: 8 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  ticketWrap: { gap: 16 },
  ticket: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  ticketHead: { padding: 16, gap: 6 },
  ticketMeta: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 6 },
  metaLabel: { fontFamily: fonts.sans500, fontSize: 11, lineHeight: 14 },
  code: { fontFamily: fonts.display700, fontSize: 18, lineHeight: 24, letterSpacing: 1.5 },
  perf: { height: 22, justifyContent: 'center' },
  dash: { marginHorizontal: 18, borderTopWidth: 1.5, borderStyle: 'dashed' },
  notch: { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 1, top: 0 },
  notchL: { left: -12 },
  notchR: { right: -12 },
  qrBox: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 18, gap: 10 },
  qrPaper: { padding: 8, borderRadius: 16, backgroundColor: lightColors.card },
  qrHint: { textAlign: 'center' },
  attHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  attRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  attNum: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  attState: { alignItems: 'flex-end', gap: 2 },
  floating: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8 },
  errorBox: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 4 },
  buttonWrap: { borderRadius: 18 },
  done: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, borderWidth: 1, paddingVertical: 16 },
});
