import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { CenterDialog } from '@/components/CenterDialog';
import { Icon } from '@/components/Icon';
import { InstructorTag } from '@/components/InstructorTag';
import { RowBones } from '@/components/skeletons';
import { feeLabel, formatSession, type HomeWorkshop, loadWorkshop, registerWorkshopSession, type WorkshopDetail, type WorkshopSessionItem } from '@/data/home';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/** Chữ xác nhận người dùng gõ lại trong popup trước khi đăng ký (tránh bấm nhầm). */
const CONFIRM_WORD = 'DANG KY';

const TILE_W = 88;

/**
 * Bottom sheet Workshop (online): tên + người hướng dẫn + mô tả, hàng ngang các ngày (chưa kết thúc, GET /workshops/{id}),
 * ngày đã đăng ký có badge "Đã đăng ký". Chọn ngày → nút nổi "Đăng ký buổi …" → popup xác nhận (gõ chữ DANG KY)
 * → POST /workshop-sessions/{id}/register. Đã đăng ký: link họp (mở trước giờ học 30 phút) hoặc giờ có link.
 */
export function WorkshopSheet({
  workshop,
  initialSessionId,
  onClose,
  onChanged,
}: {
  workshop: HomeWorkshop | null;
  initialSessionId?: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { height } = useWindowDimensions();
  const [shown, setShown] = useState<HomeWorkshop | null>(workshop);
  const [detail, setDetail] = useState<WorkshopDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const rowRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    if (!workshop) return;
    setShown(workshop);
    setDetail(null);
    setLoadError(null);
    setError(null);
    setSelectedId(initialSessionId ?? workshop.upcoming[0]?.id ?? null);
    let alive = true;
    loadWorkshop(workshop.id, token)
      .then((d) => {
        if (!alive) return;
        setDetail(d);
        setSelectedId((cur) => (cur && d.sessions.some((s) => s.id === cur) ? cur : (d.sessions[0]?.id ?? null)));
      })
      .catch((e: unknown) => alive && setLoadError(e instanceof ApiError ? e.message : 'Không tải được workshop.'));
    return () => {
      alive = false;
    };
  }, [workshop, initialSessionId, token]);

  // Ngày đang chọn luôn nằm trong tầm nhìn
  const sessions = detail?.sessions ?? [];
  const selIndex = sessions.findIndex((s) => s.id === selectedId);
  useEffect(() => {
    if (selIndex < 0) return;
    const id = requestAnimationFrame(() => rowRef.current?.scrollTo({ x: Math.max(0, selIndex * (TILE_W + 8) - 24), animated: true }));
    return () => cancelAnimationFrame(id);
  }, [selIndex]);

  const updateSession = useCallback((s: WorkshopSessionItem) => {
    setDetail((d) => (d ? { ...d, sessions: d.sessions.map((x) => (x.id === s.id ? s : x)) } : d));
  }, []);

  const w = detail ?? shown;
  if (!w) return null;
  const sel = sessions[selIndex] ?? null;

  const register = async () => {
    if (!token || !sel) return;
    setBusy(true);
    setError(null);
    try {
      const s = await registerWorkshopSession(sel.id, token);
      updateSession(s);
      setConfirming(false);
      onChanged();
    } catch (e) {
      setConfirming(false);
      setError(e instanceof ApiError ? { message: e.message, code: e.code } : { message: 'Có lỗi xảy ra, thử lại sau.' });
    } finally {
      setBusy(false);
    }
  };

  const f = sel ? formatSession(sel) : null;
  const selDate = sel ? new Date(sel.start) : null;
  const dateText = sel && f && selDate ? `${f.weekday}, ${selDate.getDate()}/${selDate.getMonth() + 1} · ${f.startTime} – ${f.endTime}` : '';
  const canRegister = !!sel && !sel.registered && sel.registrationOpen && !sel.full;

  return (
    <BottomSheet visible={!!workshop} onClose={onClose} title="Workshop online">
      <View style={{ height: height * 0.78 }}>
        <ScrollView style={styles.grow} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.top}>
            <Text style={[type.h2, { color: colors.ink900 }]} numberOfLines={2}>
              {w.title}
            </Text>
            <View style={styles.metaRow}>
              <InstructorTag name={w.trainer ?? 'Ellso'} avatar={w.trainerAvatar} tone="workshop" size={38} />
            </View>
            <View style={styles.metaRow}>
              <View style={[styles.pill, { backgroundColor: colors.workshopText }]}>
                <Icon name="video" size={14} strokeWidth={2.2} color={colors.card} />
                <Text style={[styles.pillText, { color: colors.card }]}>ONLINE</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: colors.workshopTint }]}>
                <Text style={[type.chip, { color: colors.workshopText }]}>{feeLabel(w.isFree, w.price)}</Text>
              </View>
              {w.capacity ? <Text style={[type.caption, { color: colors.ink600 }]}>Tối đa {w.capacity} người / buổi</Text> : null}
            </View>
          </View>

          <Text style={[type.cardTitle, styles.section, { color: colors.ink900 }]}>Chọn ngày tham gia</Text>
          {detail ? (
            sessions.length ? (
              <ScrollView ref={rowRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles} style={styles.tilesRow}>
                {sessions.map((s) => {
                  const on = s.id === selectedId;
                  const sf = formatSession(s);
                  const d = new Date(s.start);
                  return (
                    <Pressable
                      key={s.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${sf.weekday} ${d.getDate()} tháng ${d.getMonth() + 1}, ${sf.startTime}${s.registered ? ', đã đăng ký' : s.full ? ', hết chỗ' : ''}`}
                      onPress={() => {
                        setSelectedId(s.id);
                        setError(null);
                      }}
                      style={[
                        styles.tile,
                        on
                          ? { backgroundColor: colors.workshopTint, borderColor: colors.workshopText }
                          : { backgroundColor: colors.card, borderColor: colors.line },
                      ]}
                    >
                      <Text style={[type.captionStrong, styles.tileWeek, { color: on ? colors.workshopText : colors.ink600 }]}>{sf.weekday}</Text>
                      <Text style={[styles.tileDay, { color: on ? colors.workshopDeep : s.full && !s.registered ? colors.ink400 : colors.ink900 }]}>{d.getDate()}</Text>
                      <Text style={[type.caption, styles.tileSmall, { color: on ? colors.workshopDeep : colors.ink600 }]}>Th {d.getMonth() + 1}</Text>
                      <Text style={[styles.tileTime, { color: on ? colors.workshopText : colors.ink900 }]}>{sf.startTime}</Text>
                      {s.registered ? (
                        <View style={[styles.tileBadge, { backgroundColor: colors.emerald700, borderColor: colors.card }]}>
                          <Icon name="check" size={9} strokeWidth={3.4} color={colors.onEmerald} />
                          <Text style={[styles.tileBadgeText, { color: colors.onEmerald }]} numberOfLines={1}>
                            Đã đăng ký
                          </Text>
                        </View>
                      ) : s.full ? (
                        <View style={[styles.tileBadge, { backgroundColor: colors.dangerTint, borderColor: colors.card }]}>
                          <Text style={[styles.tileBadgeText, { color: colors.danger }]}>Hết chỗ</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={[type.caption, { color: colors.ink600 }]}>Workshop chưa có lịch mới.</Text>
            )
          ) : loadError ? (
            <Text style={[type.caption, { color: colors.danger }]}>{loadError}</Text>
          ) : (
            <RowBones count={1} thumb={TILE_W} card={false} />
          )}

          {sel && (
            <View style={[styles.selBox, { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.line}>
                <Icon name="clock" size={16} color={colors.ink600} />
                <Text style={[type.label, { color: colors.ink900 }]}>{dateText}</Text>
              </View>
              {sel.seatsLeft !== null && !sel.registered && (
                <Text style={[type.caption, { color: sel.full ? colors.danger : colors.ink600 }]}>{sel.full ? 'Buổi này đã đủ người' : `Còn ${sel.seatsLeft} chỗ`}</Text>
              )}
              {sel.note && <Text style={[type.caption, { color: colors.ink600 }]}>{sel.note}</Text>}
              {sel.registered &&
                (sel.meetingUrl ? (
                  <Pressable accessibilityRole="link" onPress={() => sel.meetingUrl && Linking.openURL(sel.meetingUrl)} style={styles.line} hitSlop={6}>
                    <Icon name="video" size={16} color={colors.emerald700} />
                    <Text style={[type.label, { color: colors.emerald700 }]}>Vào phòng họp online</Text>
                  </Pressable>
                ) : sel.linkAvailableAt ? (
                  <Text style={[type.caption, { color: colors.ink600 }]}>
                    Link phòng họp hiện ở đây từ {formatSession({ start: sel.linkAvailableAt, end: sel.linkAvailableAt }).startTime}{' '}
                    {new Date(sel.linkAvailableAt).getDate()}/{new Date(sel.linkAvailableAt).getMonth() + 1} (trước giờ học 30 phút).
                  </Text>
                ) : null)}
            </View>
          )}

          {detail?.summary ? <Text style={[styles.body, { color: colors.ink900 }]}>{detail.summary}</Text> : null}
          {detail?.blocks
            .filter((b) => b.type === 'paragraph')
            .map((b, i) => (
              <Text key={i} style={[styles.body, { color: colors.ink900 }]}>
                {'text' in b ? b.text.replace(/\*\*/g, '') : ''}
              </Text>
            ))}
        </ScrollView>

        {/* Nút nổi */}
        <View style={styles.floating} pointerEvents="box-none">
          {error && (
            <View
              style={[styles.msg, { backgroundColor: colors.card, borderColor: colors.dangerLine, boxShadow: colors.shadowCard }]}
              accessibilityLiveRegion="polite"
            >
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
          {sel?.registered ? (
            <View style={[styles.done, { backgroundColor: colors.mint50, borderColor: colors.mint100, boxShadow: colors.shadowCard }]}>
              <Icon name="check" size={18} strokeWidth={2.6} color={colors.emerald700} />
              <Text style={[type.label, { color: colors.emerald700 }]}>Bạn đã đăng ký buổi này</Text>
            </View>
          ) : (
            <View style={[styles.buttonWrap, { boxShadow: colors.shadowCard }]}>
              <PrimaryButton
                label={!sel ? 'Chọn ngày tham gia' : sel.full ? 'Buổi này đã hết chỗ' : !sel.registrationOpen ? 'Đã đóng đăng ký' : 'Đăng ký buổi này'}
                disabled={!canRegister}
                onPress={() => {
                  setTyped('');
                  setError(null);
                  setConfirming(true);
                }}
              />
            </View>
          )}
        </View>
      </View>

      <CenterDialog visible={confirming} onClose={() => !busy && setConfirming(false)} title="Xác nhận đăng ký">
        <View style={styles.dialog}>
          <Text style={[type.body, { color: colors.ink900 }]}>
            Đăng ký <Text style={{ fontFamily: fonts.sans700 }}>{w.title}</Text>
          </Text>
          <View style={[styles.selBox, { backgroundColor: colors.workshopTint }]}>
            <View style={styles.line}>
              <Icon name="clock" size={16} color={colors.workshopText} />
              <Text style={[type.label, { color: colors.workshopDeep }]}>{dateText}</Text>
            </View>
            <Text style={[type.caption, { color: colors.workshopDeep }]}>Online · {feeLabel(w.isFree, w.price)}</Text>
          </View>
          <Text style={[type.caption, { color: colors.ink600 }]}>
            Gõ <Text style={{ fontFamily: fonts.sans700, color: colors.ink900 }}>{CONFIRM_WORD}</Text> để xác nhận.
          </Text>
          <View style={[styles.field, { backgroundColor: colors.bg, borderColor: colors.line }]}>
            <TextInput
              value={typed}
              onChangeText={(v) => setTyped(v.toUpperCase())}
              placeholder={CONFIRM_WORD}
              placeholderTextColor={colors.ink400}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              maxLength={12}
              returnKeyType="done"
              onSubmitEditing={() => typed.trim() === CONFIRM_WORD && register()}
              accessibilityLabel={`Gõ ${CONFIRM_WORD} để xác nhận`}
              style={[styles.input, { color: colors.ink900 }]}
            />
          </View>
          <View style={styles.dialogBtn}>
            <PrimaryButton label="Xác nhận đăng ký" disabled={typed.trim() !== CONFIRM_WORD} loading={busy} onPress={register} />
          </View>
        </View>
      </CenterDialog>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  scroll: { paddingBottom: 130, gap: 12 },
  top: { gap: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  pillText: { fontFamily: fonts.sans700, fontSize: 11, letterSpacing: 0.8 },
  section: { marginTop: 12 },
  tilesRow: { flexGrow: 0, marginHorizontal: -4 },
  tiles: { gap: 8, paddingHorizontal: 4, paddingTop: 10, paddingBottom: 14 }, // chừa chỗ badge dưới ô
  tile: { width: TILE_W, alignItems: 'center', paddingTop: 10, paddingBottom: 16, borderRadius: 16, borderWidth: 1.5 },
  tileWeek: { fontSize: 12, lineHeight: 16 },
  tileDay: { fontFamily: fonts.display700, fontSize: 24, lineHeight: 30 },
  tileSmall: { fontSize: 12, lineHeight: 16 },
  tileTime: { fontFamily: fonts.sans700, fontSize: 12, lineHeight: 16, marginTop: 6 },
  tileBadge: {
    position: 'absolute',
    bottom: -9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  tileBadgeText: { fontFamily: fonts.sans700, fontSize: 9.5, lineHeight: 13 },
  selBox: { borderRadius: 16, padding: 14, gap: 6, marginTop: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  body: { fontFamily: fonts.sans400, fontSize: 15, lineHeight: 24 },
  floating: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8 },
  msg: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 4 },
  buttonWrap: { borderRadius: 18 },
  done: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, borderWidth: 1, paddingVertical: 16 },
  dialog: { gap: 10 },
  field: { height: 54, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center' },
  input: {
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.sans600,
    fontSize: 17,
    letterSpacing: 1.2,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  dialogBtn: { marginTop: 6 },
});
