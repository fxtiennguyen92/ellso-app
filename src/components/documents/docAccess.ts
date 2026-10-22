import type { IconName } from '@/components/Icon';
import { formatPrice } from '@/data/courses';
import type { Access, Doc } from '@/data/documents';
import type { ColorTokens } from '@/theme/tokens';

/** Điều kiện để hiện chip: đã mua riêng → "Đã mua"; còn lại lấy điều kiện đầu tiên. */
export const primaryAccess = (d: Doc): Access => (d.bought ? d.access.find((a) => a.kind === 'buy') ?? d.access[0] : d.access[0]);

/**
 * Màu + chữ + icon của từng kiểu quyền (theo canvas "các trường hợp quyền xem"):
 * xanh = miễn phí / đã mua · vàng = gói thành viên · xám = mua riêng · xanh dương = theo bài học · tím = theo khoá học.
 */
export function accessStyle(a: Access, bought: boolean, c: ColorTokens) {
  switch (a.kind) {
    case 'free':
      return { short: 'Miễn phí', long: 'Miễn phí', bg: c.mint50, fg: c.emerald700, icon: null as IconName | null };
    case 'plus':
      return { short: 'Thành viên', long: 'Gói thành viên', bg: c.amberChip, fg: c.amberChipText, icon: 'crown' as IconName };
    case 'buy':
      return bought
        ? { short: 'Đã mua', long: 'Đã mua', bg: c.mint50, fg: c.emerald700, icon: 'check' as IconName }
        : { short: formatPrice(a.price), long: formatPrice(a.price), bg: c.chipNeutral, fg: c.ink900, icon: 'tag' as IconName };
    case 'lesson':
      return { short: a.lesson, long: `${a.lesson} · ${a.courseTitle}`, bg: c.skyTint, fg: c.skyText, icon: 'link' as IconName };
    case 'course':
      return { short: 'Khoá học', long: `Khoá ${a.courseTitle}`, bg: c.violetTint, fg: c.violetText, icon: 'courses' as IconName };
  }
}