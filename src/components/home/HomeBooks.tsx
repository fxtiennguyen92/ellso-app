import { router } from 'expo-router';
import { Animated, StyleSheet } from 'react-native';

import { BookCard, Grid } from '@/components/documents/DocParts';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { useRevealStyle } from '@/components/splash/RevealContext';

import { SectionTitle } from './SectionTitle';

/** Mục Sách cuối Home: 6 cuốn, 2 hàng × 3 cột (dùng lại BookCard của tab Tài liệu). */
export function HomeBooks() {
  const reveal = useRevealStyle(6);
  const { docs } = useDocuments();
  const books = docs.filter((d) => d.type === 'book').slice(0, 6);
  if (books.length === 0) return null;

  return (
    <Animated.View style={[styles.section, reveal]}>
      <SectionTitle title="Sách" subtitle="Gợi ý cho bạn" action={{ label: 'Xem tất cả', onPress: () => router.push('/documents/books') }} />
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