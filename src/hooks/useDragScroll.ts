import { useEffect, type RefObject } from 'react';
import { Platform, type ScrollViewInstance } from 'react-native';

/**
 * Web: cho phép kéo chuột để cuộn ngang một ScrollView (trên mobile vuốt tay sẵn có).
 * Có `step` (px): thả chuột → trượt tới thẻ gần nhất theo bước đó (danh sách thẻ).
 * Không có `step`: kéo tự do, không bắt dính (hàng chip, nút lọc…).
 * Sau khi kéo, cú click kết thúc bị chặn để không vô tình bấm nút trong thẻ.
 */
export function useDragScroll(ref: RefObject<ScrollViewInstance | null>, step?: number) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Trên web (react-native-web) getScrollableNode trả về thẻ DOM của vùng cuộn
    const node = ref.current?.getScrollableNode?.() as unknown as HTMLElement | undefined;
    if (!node) return;

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;
    let snapTimer: ReturnType<typeof setTimeout> | undefined;

    node.style.cursor = 'grab';

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = node.scrollLeft;
      clearTimeout(snapTimer);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        node.style.scrollSnapType = 'none'; // tắt snap trong lúc kéo để chạy mượt
        node.style.cursor = 'grabbing';
        node.style.userSelect = 'none';
      }
      if (moved) {
        e.preventDefault();
        node.scrollLeft = startLeft - dx;
      }
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      node.style.cursor = 'grab';
      node.style.userSelect = '';
      if (!moved) return;
      if (!step) {
        node.style.scrollSnapType = '';
        return;
      }

      // Các điểm dừng: đầu mỗi thẻ (bội số của step) + điểm cuối cùng (thẻ cuối sát lề phải).
      // Không làm vậy thì thẻ cuối bị kéo ngược về thẻ trước vì đầu thẻ cuối không cuộn tới được.
      const max = node.scrollWidth - node.clientWidth;
      const points: number[] = [];
      for (let p = 0; p < max - 4; p += step) points.push(p);
      points.push(max);

      // Ưu tiên theo hướng kéo: kéo quá ~30px là sang thẻ kế tiếp
      const delta = node.scrollLeft - startLeft;
      const biased = Math.abs(delta) > 30 ? node.scrollLeft + Math.sign(delta) * step * 0.4 : node.scrollLeft;
      const target = points.reduce((best, p) => (Math.abs(p - biased) < Math.abs(best - biased) ? p : best), points[0]);

      // react-native-web ghi đè node.scrollTo bằng API kiểu RN ({x, y}) → gọi bản gốc của DOM
      (Element.prototype.scrollTo as (this: Element, options: ScrollToOptions) => void).call(node, {
        left: target,
        behavior: 'smooth',
      });
      // Bật lại snap khi đã trượt xong (tránh snap giật lại giữa chừng)
      snapTimer = setTimeout(() => {
        node.style.scrollSnapType = '';
      }, 600);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    node.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    node.addEventListener('click', onClickCapture, true);
    node.addEventListener('dragstart', (e) => e.preventDefault());

    return () => {
      clearTimeout(snapTimer);
      node.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      node.removeEventListener('click', onClickCapture, true);
    };
  }, [ref, step]);
}