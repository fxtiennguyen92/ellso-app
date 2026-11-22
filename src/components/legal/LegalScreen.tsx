import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { StaticBlock, type Accent } from '@/components/lesson/LessonBlocks';
import { ArticleBones } from '@/components/skeletons';
import { SubpageHeader } from '@/components/SubpageHeader';
import { TextLink } from '@/components/auth/AuthUI';
import { LEGAL_TITLES, loadLegal, type LegalPage, type LegalSlug } from '@/data/legal';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

const dmy = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Điều khoản sử dụng / Chính sách bảo mật (route /legal/[slug], mở được cả khi chưa đăng nhập — từ màn Đăng ký).
 * Nội dung lấy từ server (CMS › Hệ thống › Điều khoản & bảo mật), vẽ bằng bộ khối bài học (tiêu đề, đoạn, gạch đầu dòng).
 */
export function LegalScreen({ slug }: { slug: LegalSlug }) {
  const { colors } = useTheme();
  const { status } = useAuth();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<LegalPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const accent: Accent = { base: colors.emerald500, soft: colors.mint100, ink: colors.emerald700 };
  const other: LegalSlug = slug === 'terms' ? 'privacy' : 'terms';

  useEffect(() => {
    let alive = true;
    setPage(null);
    setError(null);
    loadLegal(slug)
      .then((p) => alive && setPage(p))
      .catch((e: unknown) => alive && setError(e instanceof ApiError ? e.message : 'Không tải được nội dung, kiểm tra mạng và thử lại.'));
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubpageHeader title={page?.title ?? LEGAL_TITLES[slug]} scrolled={scrolled} fallback={status === 'signedIn' ? '/profile' : '/'} />
      <ScrollView
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {page ? (
          <>
            <View style={[styles.meta, { backgroundColor: colors.mint50 }]}>
              <Text style={[type.caption, { color: colors.emerald700 }]}>
                Phiên bản {page.version} · Hiệu lực từ {dmy(page.effectiveOn)}
              </Text>
            </View>
            <View style={styles.blocks}>
              {page.blocks.map((b, i) => (
                <StaticBlock key={i} block={b} accent={accent} onCopied={() => {}} />
              ))}
            </View>
            <View style={[styles.other, { borderTopColor: colors.line }]}>
              <Text style={[type.caption, { color: colors.ink600 }]}>Xem thêm</Text>
              <TextLink label={LEGAL_TITLES[other]} onPress={() => router.replace({ pathname: '/legal/[slug]', params: { slug: other } })} />
            </View>
          </>
        ) : error ? (
          <Text style={[type.body, styles.error, { color: colors.danger }]}>{error}</Text>
        ) : (
          <ArticleBones />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  meta: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, marginBottom: 12 },
  blocks: { gap: 12 },
  other: { marginTop: 28, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
  error: { paddingVertical: 24, fontFamily: fonts.sans500 },
});
