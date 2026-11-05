import { router } from 'expo-router';
import { Animated, StyleSheet } from 'react-native';

import { BookCard, Grid } from '@/components/documents/DocParts';
import { useRevealStyle } from '@/components/splash/RevealContext';
import type { Doc } from '@/data/documents';

import { SectionTitle } from './SectionTitle';

/** Mục Sách cuối Home (GET /v1/documents?type=book, mới nhất trước): 6 cuốn, 2 hàng × 3 cột (BookCard của tab Tài liệu). */
export function HomeBooks({ books: all }: { books: Doc[] }) {
  const reveal = useRevealStyle(4);
  const books = all.slice(0, 6);
  if (books.length === 0) return null;

  return (
    <Animated.View style={[styles.section, reveal]}>
      <SectionTitle title="Sách" subtitle="Sách mới trên Ellso" action={{ label: 'Xem tất cả', onPress: () => router.push('/documents/books') }} />
      <Grid columns={3} rowGap={24}>
        {books.map((d) => (
          <BookCard key={d.id} doc={d} />
        ))}
      </Grid>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 28, paddingHorizontal: 16, gap: 16 },
});