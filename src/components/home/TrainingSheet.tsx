import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon, type IconName } from '@/components/Icon';
import { useAuth } from '@/auth/AuthProvider';
import { initialsOf } from '@/data/auth';
import { dayMonth, feeLabel, formatSession, type HomeTraining, loadTraining, registerTraining, type TrainingDetail } from '@/data/home';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/**
 * Bottom sheet "Chương trình huấn luyện" (bấm thẻ ở Home).
 * Hiện ngay phần có sẵn từ danh sách, rồi tải chi tiết (GET /v1/trainings/{id}) để có địa điểm + ghi chú từng buổi.
 * Nút đăng ký cả chương trình: cần gói thành viên còn hạn; chương trình có phí → báo theo lời server (thanh toán làm sau).
 */
export function TrainingSheet({ training, onClose, onChanged }: { training: HomeTraining | null; onClose: () => void; onChanged: () => void }) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { height } = useWindowDimensions();

  // Giữ nội dung lúc bảng đang trượt xuống (training đã về null)
  const [shown, setShown] = useState<HomeTraining | null>(training);
  const [detail, setDetail] = useState<TrainingDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    if (!training) return;
    setShown(training);
    setDetail(null);
    setLoadError(null);
    setError(null);
    setJustRegistered(false);
    let alive = true;
    loadTraining(training.id, token)
      .then((d) => alive && setDetail(d))
      .catch((e: unknown) => alive && setLoadError(e instanceof ApiError ? e.message : 'Không tải được lịch chi tiết.'));
    return () => {
      alive = false;
    };
  }, [training, token]);

  const t = detail ?? shown;
  if (!t) return null;

  const registered = t.registered || justRegistered;
  const full = !registered && t.seatsLeft === 0;
  const total = t.sessionsCount || t.schedule.length;
  const first = t.schedule[0];
  const last = t.schedule[t.schedule.length - 1];

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

  const facts: { icon: IconName; label: string; value: string }[] = [
    { icon: 'layers', label: 'Số buổi', value: `${total} buổi` },
    { icon: 'clock', label: 'Thời gian', value: first && last ? (total > 1 ? `${dayMonth(first.start)} – ${dayMonth(last.start)}` : dayMonth(first.start)) : '—' },
    { icon: 'tag', label: 'Học phí', value: feeLabel(t.isFree, t.price) },
    { icon: 'people', label: 'Chỗ còn lại', value: t.seatsLeft === null ? 'Không giới hạn' : t.seatsLeft > 0 ? `${t.seatsLeft} chỗ` : 'Hết chỗ' },
  ];

  return (
    <BottomSheet visible={!!training} onClose={onClose} title="Chương trình huấn luyện">
      <ScrollView style={{ maxHeight: height * 0.72 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {t.bannerUrl && (
          <Image source={{ uri: t.bannerUrl }} style={[styles.banner, { backgroundColor: colors.violetTint }]} contentFit="cover" transition={150} />
        )}

        <View style={styles.head}>
          <Text style={[type.h2, { color: colors.ink900 }]}>{t.title}</Text>
          <View style={styles.person}>
            <View style={[styles.avatar, { backgroundColor: colors.violetTint, borderColor: colors.violetLine }]}>
              <Text style={[styles.avatarText, { color: colors.violetText }]}>{initialsOf(t.trainer ?? 'Ellso')}</Text>
            </View>
            <Text style={[type.caption, { color: colors.ink600 }]}>
              Huấn luyện viên <Text style={{ fontFamily: fonts.sans600, color: colors.ink900 }}>{t.trainer ?? 'Ellso'}</Text>
            </Text>
          </View>
          {t.summary ? <Text style={[type.caption, styles.summary, { color: colors.ink600 }]}>{t.summary}</Text> : null}
        </View>

        <View style={styles.facts}>
          {facts.map((f) => (
            <View key={f.label} style={[styles.fact, { backgroundColor: colors.surfaceAlt }]}>
              <Icon name={f.icon} size={16} color={colors.violetText} />
              <Text style={[type.caption, { color: colors.ink600 }]}>{f.label}</Text>
              <Text style={[type.label, { color: colors.ink900 }]} numberOfLines={2}>
                {f.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[type.eyebrow, { color: colors.ink600 }]}>Lịch các buổi</Text>
        {detail ? (
          <View style={styles.sessions}>
            {detail.sessions.map((s) => {
              const f = formatSession(s);
              const past = s.state === 'past';
              const next = s.number === detail.next.number && !past;
              return (
                <View
                  key={s.number}
                  style={[
                    styles.session,
                    { borderColor: next ? colors.violetTrack : colors.line, backgroundColor: next ? colors.violetTint : colors.card, opacity: past ? 0.6 : 1 },
                  ]}
                >
                  <View style={[styles.num, { backgroundColor: next || past ? colors.violetSolid : colors.violetTint }]}>
                    {past ? (
                      <Icon name="check" size={14} strokeWidth={3} color={colors.violetOn} />
                    ) : (
                      <Text style={[styles.numText, { color: next ? colors.violetOn : colors.violetText }]}>{s.number}</Text>
                    )}
                  </View>
                  <View style={styles.grow}>
                    <Text style={[type.label, { color: colors.ink900 }]}>
                      Buổi {s.number} · {f.weekday}, {dayMonth(s.start)}
                    </Text>
                    <Text style={[type.caption, { color: colors.ink600 }]}>
                      {f.startTime} – {f.endTime}
                      {past ? ' · Đã diễn ra' : s.state === 'ongoing' ? ' · Đang diễn ra' : next ? ` · ${f.countdown}` : ''}
                    </Text>
                    {s.location && (
                      <Pressable
                        disabled={!s.location.mapUrl}
                        accessibilityRole={s.location.mapUrl ? 'link' : undefined}
                        onPress={() => s.location?.mapUrl && Linking.openURL(s.location.mapUrl)}
                        style={styles.place}
                      >
                        <Icon name="pin" size={14} color={s.location.mapUrl ? colors.violetText : colors.ink600} />
                        <Text style={[type.caption, styles.grow, { color: s.location.mapUrl ? colors.violetText : colors.ink600 }]}>
                          {s.location.label}
                          {s.location.address ? ` · ${s.location.address}` : ''}
                        </Text>
                      </Pressable>
                    )}
                    {(s.note || s.location?.note) && (
                      <Text style={[type.caption, { color: colors.ink600 }]}>{[s.note, s.location?.note].filter(Boolean).join(' · ')}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : loadError ? (
          <Text style={[type.caption, { color: colors.danger }]}>{loadError}</Text>
        ) : (
          <ActivityIndicator color={colors.violetText} style={styles.loading} />
        )}
      </ScrollView>

      {/* Hành động: luôn nằm dưới, không cuộn theo */}
      <View style={[styles.footer, { borderTopColor: colors.line }]}>
        {error && (
          <View style={styles.errorBox}>
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
          <View style={[styles.done, { backgroundColor: colors.mint50 }]}>
            <Icon name="check" size={18} strokeWidth={2.6} color={colors.emerald700} />
            <Text style={[type.label, { color: colors.emerald700 }]}>Bạn đã đăng ký chương trình này</Text>
          </View>
        ) : (
          <PrimaryButton
            label={full ? 'Đã hết chỗ' : !t.registrationOpen ? 'Đã đóng đăng ký' : 'Đăng ký tham gia'}
            disabled={full || !t.registrationOpen}
            loading={busy}
            onPress={register}
          />
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14, paddingBottom: 8 },
  banner: { width: '100%', aspectRatio: 16 / 9, borderRadius: 16 },
  head: { gap: 8 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.sans700, fontSize: 10 },
  summary: { fontSize: 14, lineHeight: 22 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: { flexBasis: '47%', flexGrow: 1, borderRadius: 14, padding: 12, gap: 2 },
  sessions: { gap: 8 },
  session: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12 },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.sans700, fontSize: 13 },
  grow: { flex: 1 },
  place: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 4 },
  loading: { paddingVertical: 16 },
  footer: { borderTopWidth: 1, marginHorizontal: -20, paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  errorBox: { gap: 4 },
  done: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 14 },
});
