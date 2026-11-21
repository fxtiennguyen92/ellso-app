import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton, SecondaryButton, TextLink } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import { InstructorTag } from '@/components/InstructorTag';
import { RowBones } from '@/components/skeletons';
import {
  cancelWorkshopSession,
  feeLabel,
  formatSession,
  type HomeWorkshop,
  loadWorkshop,
  registerWorkshopSession,
  type WorkshopDetail,
  type WorkshopSessionItem,
} from '@/data/home';
import { useKeyboardForm } from '@/hooks/useKeyboardForm';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/** Chữ xác nhận người dùng gõ vào form trước khi đăng ký (tránh bấm nhầm). */
const CONFIRM_WORD = 'DANG KY';

const TILE_W = 88;

type Err = { message: string; code?: string };

/**
 * Bottom sheet Workshop (online). Thứ tự: tên, người hướng dẫn, ONLINE + phí → hàng ngày (chưa kết thúc,
 * GET /workshops/{id}; ngày đã đăng ký có badge "Đã đăng ký") → khối của ngày đang chọn → mô tả.
 * - Chưa đăng ký: khối ngày (giờ học trái, "Còn n chỗ" phải) + nút nổi "Đăng ký buổi này". Bấm nút → **form ngay dưới
 *   hàng ngày** (không popup): gõ DANG KY + "Xác nhận đăng ký" → POST /workshop-sessions/{id}/register. Không tự mở
 *   bàn phím; bấm vào ô mới mở, bảng thấp lại + cuộn để ô và nút xác nhận nằm trên bàn phím.
 * - Đã đăng ký: card thông tin đăng ký (giờ, ghi chú, link phòng họp / giờ có link). Buổi chưa bắt đầu → nút nổi
 *   "Huỷ đăng ký" → xác nhận ngay trong card → DELETE /workshop-sessions/{id}/register.
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
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const form = useKeyboardForm();
  const [shown, setShown] = useState<HomeWorkshop | null>(workshop);
  const [detail, setDetail] = useState<WorkshopDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** 'register' = form gõ DANG KY đang mở; 'cancel' = đang hỏi lại trước khi huỷ. */
  const [step, setStep] = useState<'none' | 'register' | 'cancel'>('none');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Err | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const rowRef = useRef<ScrollViewInstance>(null);

  // Bàn phím mở → bảng thấp lại cho vừa phần còn lại của màn (BottomSheet đẩy bảng lên đúng bằng bàn phím)
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKbHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (!workshop) return;
    setShown(workshop);
    setDetail(null);
    setLoadError(null);
    setError(null);
    setNotice(null);
    setStep('none');
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

  const fail = (e: unknown) => setError(e instanceof ApiError ? { message: e.message, code: e.code } : { message: 'Có lỗi xảy ra, thử lại sau.' });

  const register = async () => {
    if (!token || !sel || typed.trim() !== CONFIRM_WORD || busy) return;
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      updateSession(await registerWorkshopSession(sel.id, token));
      setStep('none');
      setNotice(null);
      onChanged();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!token || !sel || busy) return;
    setBusy(true);
    setError(null);
    try {
      updateSession(await cancelWorkshopSession(sel.id, token));
      setStep('none');
      setNotice('Đã huỷ đăng ký buổi này.');
      onChanged();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const select = (id: string) => {
    if (id === selectedId) return;
    Keyboard.dismiss();
    setSelectedId(id);
    setStep('none');
    setTyped('');
    setError(null);
    setNotice(null);
  };

  const f = sel ? formatSession(sel) : null;
  const selDate = sel ? new Date(sel.start) : null;
  const dateText = sel && f && selDate ? `${f.weekday}, ${selDate.getDate()}/${selDate.getMonth() + 1} · ${f.startTime} – ${f.endTime}` : '';
  const canRegister = !!sel && !sel.registered && sel.registrationOpen && !sel.full;
  const canCancel = !!sel && sel.registered && sel.state === 'upcoming';
  // Nút nổi: ẩn khi form / hỏi huỷ đang mở (nút nằm trong khối đó)
  const showFloating = !!sel && step === 'none' && (!sel.registered || canCancel);
  const bodyH = kbHeight ? Math.max(260, Math.min(height * 0.78, height - kbHeight - insets.top - 96)) : height * 0.78;

  const errorBox = error && (
    <View style={[styles.msg, { backgroundColor: colors.dangerTint, borderColor: colors.dangerLine }]} accessibilityLiveRegion="polite">
      <Text style={[type.caption, { color: colors.danger }]}>{error.message}</Text>
      {error.code === 'membership_required' && (
        <TextLink
          label="Xem gói thành viên"
          onPress={() => {
            onClose();
            setTimeout(() => router.push('/profile/membership'), 250);
          }}
        />
      )}
    </View>
  );

  return (
    <BottomSheet visible={!!workshop} onClose={onClose} title="Workshop online">
      <View style={{ height: bodyH }}>
        <ScrollView
          ref={form.scrollRef}
          style={styles.grow}
          contentContainerStyle={[styles.scroll, { paddingBottom: showFloating ? 110 : 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.top}>
            <Text style={[type.h2, { color: colors.ink900 }]} numberOfLines={2}>
              {w.title}
            </Text>
            <InstructorTag name={w.trainer ?? 'Ellso'} avatar={w.trainerAvatar} tone="workshop" size={38} />
            <View style={styles.metaRow}>
              <View style={[styles.pill, { backgroundColor: colors.workshopText }]}>
                <Icon name="video" size={14} strokeWidth={2.2} color={colors.card} />
                <Text style={[styles.pillText, { color: colors.card }]}>ONLINE</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: colors.workshopTint }]}>
                <Text style={[type.chip, { color: colors.workshopText }]}>{feeLabel(w.isFree, w.price)}</Text>
              </View>
            </View>
          </View>

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
                      onPress={() => select(s.id)}
                      style={[
                        styles.tile,
                        on ? { backgroundColor: colors.workshopTint, borderColor: colors.workshopText } : { backgroundColor: colors.card, borderColor: colors.line },
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

          {/* Ngày đang chọn: chưa đăng ký → khối giờ + chỗ (+ form); đã đăng ký → card thông tin đăng ký */}
          {sel &&
            (sel.registered ? (
              <View {...form.field('cancel').wrap} style={[styles.card, { backgroundColor: colors.mint50, borderColor: colors.mint100 }]}>
                <View style={styles.cardHead}>
                  <View style={[styles.checkDot, { backgroundColor: colors.emerald700 }]}>
                    <Icon name="check" size={14} strokeWidth={3} color={colors.onEmerald} />
                  </View>
                  <Text style={[type.cardTitle, styles.grow, { color: colors.emerald700 }]}>Bạn đã đăng ký buổi này</Text>
                </View>
                <View style={styles.line}>
                  <Icon name="clock" size={16} color={colors.ink600} />
                  <Text style={[type.label, { color: colors.ink900 }]}>{dateText}</Text>
                </View>
                <View style={styles.line}>
                  <Icon name="video" size={16} color={colors.ink600} />
                  <Text style={[type.caption, { color: colors.ink600 }]}>Online · {feeLabel(w.isFree, w.price)}</Text>
                </View>
                {sel.note ? <Text style={[type.caption, { color: colors.ink600 }]}>{sel.note}</Text> : null}
                {sel.meetingUrl ? (
                  <View style={styles.formBtn}>
                    <PrimaryButton label="Vào phòng họp online" icon="video" onPress={() => sel.meetingUrl && Linking.openURL(sel.meetingUrl)} />
                  </View>
                ) : sel.linkAvailableAt ? (
                  <Text style={[type.caption, { color: colors.ink600 }]}>
                    Link phòng họp hiện ở đây từ {formatSession({ start: sel.linkAvailableAt, end: sel.linkAvailableAt }).startTime}{' '}
                    {new Date(sel.linkAvailableAt).getDate()}/{new Date(sel.linkAvailableAt).getMonth() + 1}.
                  </Text>
                ) : null}
                {step === 'cancel' && (
                  <View style={[styles.confirm, { borderTopColor: colors.mint100 }]}>
                    <Text style={[type.label, { color: colors.ink900 }]}>Bạn chắc chắn muốn huỷ đăng ký buổi này?</Text>
                    {errorBox}
                    <PrimaryButton
                      label="Huỷ đăng ký"
                      loading={busy}
                      onPress={cancel}
                      tone={{ bg: colors.danger, pressed: colors.danger, edge: colors.dangerLine }}
                    />
                    <View style={styles.center}>
                      <TextLink
                        label="Không, giữ đăng ký"
                        muted
                        onPress={() => {
                          setStep('none');
                          setError(null);
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt }]}>
                <View style={styles.line}>
                  <Icon name="clock" size={16} color={colors.ink600} />
                  <Text style={[type.label, styles.grow, { color: colors.ink900 }]}>{dateText}</Text>
                  {sel.seatsLeft !== null && (
                    <View style={styles.seats}>
                      <Icon name="users" size={15} color={sel.full ? colors.danger : colors.ink600} />
                      <Text style={[type.caption, { color: sel.full ? colors.danger : colors.ink600 }]}>{sel.full ? 'Hết chỗ' : `Còn ${sel.seatsLeft} chỗ`}</Text>
                    </View>
                  )}
                </View>
                {sel.note ? <Text style={[type.caption, { color: colors.ink600 }]}>{sel.note}</Text> : null}
                {notice ? <Text style={[type.caption, { color: colors.emerald700 }]}>{notice}</Text> : null}
              </View>
            ))}

          {/* Form đăng ký (ngay dưới khối ngày, trên mô tả) — con trực tiếp của ScrollView để cuộn lên trên bàn phím */}
          {sel && !sel.registered && step === 'register' && (
            <View {...form.field('confirm').wrap} style={[styles.card, styles.formCard, { backgroundColor: colors.card, borderColor: colors.workshopText }]}>
              <Text style={[type.cardTitle, { color: colors.ink900 }]}>Đăng ký buổi này</Text>
              <Text style={[type.caption, { color: colors.ink600 }]}>
                Gõ <Text style={{ fontFamily: fonts.sans700, color: colors.ink900 }}>{CONFIRM_WORD}</Text> để xác nhận đăng ký buổi {dateText}.
              </Text>
              <View style={[styles.field, { backgroundColor: colors.bg, borderColor: typed.trim() === CONFIRM_WORD ? colors.emerald700 : colors.line }]}>
                <TextInput
                  value={typed}
                  onChangeText={(v) => setTyped(v.toUpperCase())}
                  onFocus={form.field('confirm').onFocus}
                  placeholder={CONFIRM_WORD}
                  placeholderTextColor={colors.ink400}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={12}
                  returnKeyType="done"
                  onSubmitEditing={register}
                  accessibilityLabel={`Gõ ${CONFIRM_WORD} để xác nhận`}
                  style={[styles.input, { color: colors.ink900 }]}
                />
              </View>
              {errorBox}
              <View style={styles.formBtn}>
                <PrimaryButton label="Xác nhận đăng ký" disabled={typed.trim() !== CONFIRM_WORD} loading={busy} onPress={register} />
              </View>
              <View style={styles.center}>
                <TextLink
                  label="Thôi, để sau"
                  muted
                  onPress={() => {
                    Keyboard.dismiss();
                    setStep('none');
                    setError(null);
                  }}
                />
              </View>
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

        {/* Nút nổi: Đăng ký buổi này (mở form) / Huỷ đăng ký (mở xác nhận trong card) */}
        {showFloating && sel && (
          <View style={styles.floating} pointerEvents="box-none">
            {step === 'none' && errorBox}
            {sel.registered ? (
              <View style={[styles.buttonWrap, { boxShadow: colors.shadowCard }]}>
                <SecondaryButton
                  label="Huỷ đăng ký"
                  icon="close"
                  onPress={() => {
                    setError(null);
                    setStep('cancel');
                    setTimeout(() => form.scrollRef.current?.scrollToEnd({ animated: true }), 50);
                  }}
                />
              </View>
            ) : (
              <View style={[styles.buttonWrap, { boxShadow: colors.shadowCard }]}>
                <PrimaryButton
                  label={sel.full ? 'Buổi này đã hết chỗ' : !sel.registrationOpen ? 'Đã đóng đăng ký' : 'Đăng ký buổi này'}
                  disabled={!canRegister}
                  onPress={() => {
                    setTyped('');
                    setError(null);
                    setNotice(null);
                    setStep('register');
                  }}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  center: { alignItems: 'center' },
  scroll: { gap: 12 },
  top: { gap: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  pillText: { fontFamily: fonts.sans700, fontSize: 11, letterSpacing: 0.8 },
  tilesRow: { flexGrow: 0, marginHorizontal: -4, marginTop: 4 },
  tiles: { gap: 8, paddingHorizontal: 4, paddingTop: 4, paddingBottom: 14 }, // chừa chỗ badge dưới ô
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
  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 8 },
  formCard: { borderWidth: 1.5, gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  checkDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  confirm: { borderTopWidth: 1, paddingTop: 12, marginTop: 4, gap: 10 },
  body: { fontFamily: fonts.sans400, fontSize: 15, lineHeight: 24 },
  floating: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8 },
  msg: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  buttonWrap: { borderRadius: 18 },
  formBtn: { marginTop: 2 },
  field: { height: 54, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center' },
  input: {
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.sans600,
    fontSize: 17,
    letterSpacing: 1.2,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
