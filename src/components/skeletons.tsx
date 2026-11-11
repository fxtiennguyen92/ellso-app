import { StyleSheet, View } from 'react-native';

import { Bone, BoneLines, Skeleton, SkeletonCard } from '@/components/Skeleton';

/**
 * Skeleton theo bố cục thật của từng màn (dùng khi lần đầu tải dữ liệu). Kích thước gần đúng với thẻ thật để
 * khi dữ liệu về, nội dung không "nhảy". Mỗi hàm là một <Skeleton> (một nhịp sáng–mờ chung).
 */

/** Trang chủ: banner khuyến mãi · chương trình huấn luyện · workshop · sách. */
export function HomeSkeleton() {
  return (
    <Skeleton label="Đang tải trang chủ" style={styles.home}>
      <View style={styles.pad}>
        <Bone h={null} r={24} style={styles.banner} />
      </View>
      <View style={[styles.pad, styles.section]}>
        <Bone w="55%" h={20} />
        {[0, 1].map((i) => (
          <SkeletonCard key={i} style={styles.cardPad}>
            <View style={styles.row}>
              <Bone w={48} h={48} r={14} />
              <View style={styles.grow}>
                <BoneLines lines={2} last="45%" />
              </View>
            </View>
            <Bone h={36} r={12} />
          </SkeletonCard>
        ))}
      </View>
      <View style={[styles.pad, styles.section]}>
        <Bone w="40%" h={20} />
        <BookGridBones count={3} />
      </View>
    </Skeleton>
  );
}

/** Lưới sách 3 cột (bìa 2:3 + 2 dòng chữ). */
export function BookGridBones({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid3}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.col3}>
          <Bone h={null} r={10} style={styles.bookCover} />
          <Bone w="70%" h={10} />
          <Bone w="90%" h={12} />
        </View>
      ))}
    </View>
  );
}

/** Thẻ khoá học E-learning (ảnh 16:9 + danh mục + tên + người hướng dẫn / nút). */
export function CourseCardBones({ count = 2 }: { count?: number }) {
  return (
    <Skeleton label="Đang tải khoá học" style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} style={styles.courseCard}>
          <Bone h={null} r={0} style={styles.cover169} />
          <View style={styles.cardBody}>
            <Bone w="45%" h={10} />
            <Bone w="75%" h={18} />
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <Bone w={32} h={32} r={16} />
                <View style={styles.instructor}>
                  <Bone w={80} h={10} />
                  <Bone w={110} h={12} />
                </View>
              </View>
              <Bone w={104} h={40} r={12} />
            </View>
          </View>
        </SkeletonCard>
      ))}
    </Skeleton>
  );
}

/** Thẻ "Tiếp tục khoá học" / Khoá học của tôi (ảnh nhỏ + 2 dòng + thanh tiến độ). */
export function ProgressCardBones({ count = 2, horizontal = false }: { count?: number; horizontal?: boolean }) {
  return (
    <Skeleton label="Đang tải khoá học của bạn" style={horizontal ? styles.hRow : styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} style={[styles.progressCard, horizontal && styles.hCard]}>
          <View style={styles.row}>
            <Bone w={64} h={64} r={14} />
            <View style={styles.grow}>
              <BoneLines lines={2} h={12} last="70%" />
            </View>
            <Bone w={36} h={36} r={18} />
          </View>
          <Bone h={6} r={3} />
        </SkeletonCard>
      ))}
    </Skeleton>
  );
}

/** Lưới 2 cột thẻ đánh giá năng lực. */
export function TileGridBones({ count = 2 }: { count?: number }) {
  return (
    <Skeleton label="Đang tải bài đánh giá" style={styles.grid2}>
      {Array.from({ length: count }, (_, i) => (
        <Bone key={i} h={150} r={20} style={styles.col2} />
      ))}
    </Skeleton>
  );
}

/** Dòng danh sách (ảnh vuông nhỏ + 2–3 dòng chữ) — PDF, Tài liệu của tôi, lịch sử… */
export function RowBones({ count = 4, thumb = 56, card = true }: { count?: number; thumb?: number; card?: boolean }) {
  return (
    <Skeleton style={styles.list}>
      {Array.from({ length: count }, (_, i) => {
        const inner = (
          <View style={styles.row}>
            <Bone w={thumb} h={thumb} r={12} />
            <View style={styles.grow}>
              <Bone w="40%" h={10} />
              <Bone w="85%" h={14} style={styles.mt6} />
              <Bone w="30%" h={16} r={8} style={styles.mt8} />
            </View>
          </View>
        );
        return card ? (
          <SkeletonCard key={i} style={styles.cardPad}>
            {inner}
          </SkeletonCard>
        ) : (
          <View key={i} style={styles.plainRow}>
            {inner}
          </View>
        );
      })}
    </Skeleton>
  );
}

/** Màn chi tiết có ảnh lớn tràn viền đầu trang (khoá học, sách): ảnh · tiêu đề · đoạn văn · nút. */
export function DetailBones({ heroH = 220, padTop = 0 }: { heroH?: number; padTop?: number }) {
  return (
    <Skeleton label="Đang tải nội dung" style={[styles.detail, { paddingTop: padTop }]}>
      <Bone h={heroH} r={0} style={styles.hero} />
      <View style={styles.detailText}>
        <Bone w="35%" h={22} r={11} />
        <Bone w="85%" h={26} />
        <BoneLines lines={3} />
        <Bone h={52} r={16} style={styles.mt8} />
        <BoneLines lines={4} last="45%" />
      </View>
    </Skeleton>
  );
}

/** Trang nội dung bài học: tiêu đề + đoạn văn + ảnh + đoạn văn. */
export function ArticleBones() {
  return (
    <Skeleton label="Đang tải bài học" style={styles.article}>
      <Bone w="80%" h={28} />
      <Bone w="40%" h={12} />
      <View style={styles.mt8}>
        <BoneLines lines={4} h={14} gap={10} />
      </View>
      <Bone h={180} r={18} />
      <BoneLines lines={3} h={14} gap={10} last="70%" />
      <Bone w="50%" h={20} style={styles.mt8} />
      <BoneLines lines={3} h={14} gap={10} />
    </Skeleton>
  );
}

/** Bản đồ lộ trình: banner chương + các nút tròn uốn lượn. */
export function MapBones() {
  const offsets = [0, 56, 0, -56, 0];
  return (
    <Skeleton label="Đang tải lộ trình" style={styles.map}>
      <Bone h={72} r={20} />
      {offsets.map((x, i) => (
        <View key={i} style={[styles.node, { transform: [{ translateX: x }] }]}>
          <Bone w={68} h={68} r={34} />
          <Bone w={110} h={12} />
        </View>
      ))}
    </Skeleton>
  );
}

/** Bài làm (đánh giá năng lực): thanh tiến độ · câu hỏi · 4 lựa chọn. */
export function QuestionBones() {
  return (
    <Skeleton label="Đang tải câu hỏi" style={styles.article}>
      <Bone h={8} r={4} />
      <Bone w="30%" h={12} style={styles.mt8} />
      <BoneLines lines={2} h={20} last="70%" />
      {[0, 1, 2, 3].map((i) => (
        <Bone key={i} h={56} r={16} />
      ))}
    </Skeleton>
  );
}

const styles = StyleSheet.create({
  home: { gap: 8 },
  pad: { paddingHorizontal: 16 },
  section: { paddingTop: 24, gap: 14 },
  banner: { aspectRatio: 16 / 9 },
  grow: { flex: 1, minWidth: 0, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardPad: { padding: 16, gap: 14 },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 22 },
  col3: { width: '29.5%', flexGrow: 1, gap: 6 },
  bookCover: { aspectRatio: 2 / 3, marginBottom: 4 },
  grid2: { flexDirection: 'row', gap: 12 },
  col2: { flex: 1 },
  list: { gap: 16 },
  courseCard: { borderRadius: 24 },
  cover169: { aspectRatio: 16 / 9 },
  cardBody: { padding: 16, gap: 10 },
  instructor: { gap: 4 },
  progressCard: { padding: 14, gap: 12 },
  hRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  hCard: { width: 300 },
  plainRow: { paddingVertical: 10 },
  detail: { gap: 20 },
  hero: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  detailText: { paddingHorizontal: 16, gap: 14 },
  article: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  map: { paddingHorizontal: 16, paddingTop: 16, gap: 28 },
  node: { alignItems: 'center', gap: 10 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
});
