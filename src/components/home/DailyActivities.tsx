import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { EqBars, MicIllustration, QuizBlock, Sparkle } from '@/components/illustrations/Illustrations';
import { useRevealStyle } from '@/components/splash/RevealContext';
import type { HomeData } from '@/data/home';
import { useLoop } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

import { SectionTitle } from './SectionTitle';

export function DailyActivities({ daily }: { daily: HomeData['daily'] }) {
  const { colors } = useTheme();
  const reveal = useRevealStyle(5);
  const { quiz, podcast } = daily;

  return (
    // Dải nền nhạt kéo hết bề ngang: khoảng nghỉ giữa trang (duy nhất trên Home)
    <Animated.View style={[styles.section, { backgroundColor: colors.band }, reveal]}>
      <SectionTitle title="Hoạt động hằng ngày" subtitle="Nội dung mới trong tuần này" />

      <View style={styles.grid}>
        <ActivityCard
          label={`Quiz tuần này: ${quiz.total} câu hỏi, còn ${quiz.remaining} câu chưa làm`}
          tint={colors.violetTint}
          border={colors.violetLine}
          illustration={<QuizBlock />}
          illustrationTop={-30}
          badge={{ value: quiz.remaining, bg: colors.violetSolid, fg: colors.violetOn, delay: 0 }}
          decorations={
            <>
              <Sparkle size={14} color={colors.violetSolid} style={{ left: 16, top: 16 }} />
              <Sparkle size={10} color={colors.violetTrack} delay={700} style={{ left: 34, top: 38 }} />
              <Sparkle size={12} color={colors.violetSolid} delay={1400} style={{ right: 22, top: 40 }} />
            </>
          }
          eyebrow="Quiz"
          eyebrowColor={colors.violetText}
          title={`${quiz.total} câu hỏi`}
          caption={`Còn ${quiz.remaining} câu chưa làm`}
          segments={{ total: quiz.total, done: quiz.total - quiz.remaining, on: colors.violetSolid, off: colors.violetTrack }}
        />

        <ActivityCard
          label={`Podcast tuần này: ${podcast.total} tập, còn ${podcast.remaining} tập chưa nghe`}
          tint={colors.orangeTint}
          border={colors.orangeLine}
          illustration={<MicIllustration />}
          illustrationTop={-34}
          badge={{ value: podcast.remaining, bg: colors.orangeSolid, fg: colors.orangeOn, delay: 1500 }}
          decorations={
            <>
              <EqBars color={colors.orangeBar} style={{ left: 14, top: 14 }} />
              <EqBars color={colors.orangeBar} order={[450, 0, 200]} style={{ right: 16, top: 16 }} />
            </>
          }
          eyebrow="Podcast"
          eyebrowColor={colors.orangeText}
          title={`${podcast.total} tập mới`}
          caption={`Còn ${podcast.remaining} tập chưa nghe`}
          segments={{ total: podcast.total, done: podcast.total - podcast.remaining, on: colors.orangeBar, off: colors.orangeTrack }}
        />
      </View>
    </Animated.View>
  );
}

type CardProps = {
  label: string;
  tint: string;
  border: string;
  illustration: ReactNode;
  illustrationTop: number;
  badge: { value: number; bg: string; fg: string; delay: number };
  decorations: ReactNode;
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  caption: string;
  segments: { total: number; done: number; on: string; off: string };
};

/** Cả thẻ là một link (không có nút bên trong). */
function ActivityCard(p: CardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={p.label}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: p.tint, borderColor: p.border, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      {p.decorations}

      <View pointerEvents="none" style={[styles.illustration, { top: p.illustrationTop }]}>
        {p.illustration}
      </View>

      {p.badge.value > 0 && <CountBadge {...p.badge} ring={colors.band} />}

      <Text style={[type.eyebrow, { color: p.eyebrowColor }]}>{p.eyebrow}</Text>
      <Text style={[type.cardTitle, { color: colors.ink900 }]}>{p.title}</Text>
      <Text style={[type.caption, { color: colors.ink600 }]}>{p.caption}</Text>

      <View style={styles.segments}>
        {Array.from({ length: p.segments.total }, (_, i) => (
          <View key={i} style={[styles.segment, { backgroundColor: i < p.segments.done ? p.segments.on : p.segments.off }]} />
        ))}
      </View>
    </Pressable>
  );
}

/** Badge số đè lên viền thẻ, có animation "pop". */
function CountBadge({ value, bg, fg, ring, delay }: { value: number; bg: string; fg: string; ring: string; delay: number }) {
  const pop = useLoop(3000, { kind: 'pop', delay });
  const scale = pop.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.95, 1, 1.18] });
  return (
    <Animated.View style={[styles.badge, { backgroundColor: bg, borderColor: ring, transform: [{ scale }] }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{value}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 32, paddingTop: 28, paddingBottom: 32, paddingHorizontal: 16, gap: 12 },
  grid: { flexDirection: 'row', gap: 12, paddingTop: 30 },
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 22,
    borderWidth: 1,
    paddingTop: 70,
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 4,
  },
  illustration: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  badge: {
    position: 'absolute',
    right: -8,
    top: -10,
    zIndex: 2,
    minWidth: 28,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 9999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, lineHeight: 16 },
  segments: { flexDirection: 'row', gap: 4, marginTop: 10 },
  segment: { flex: 1, height: 6, borderRadius: 9999 },
});