import { useIsFocused } from 'expo-router';
import { createContext, type ReactNode } from 'react';

/** false → mọi useLoop bên trong dừng lại (về giá trị 0). Mặc định true (vd splash, ngoài navigator). */
export const LoopActiveContext = createContext(true);

/**
 * Bọc nội dung một màn (route) để các animation lặp (useLoop) chỉ chạy khi màn đang được focus.
 * Các tab đã mở vẫn mounted ở nền; nếu không dừng, animation chạy ngầm làm tab đang xem giật (rõ nhất trên web).
 */
export function LoopScope({ children }: { children: ReactNode }) {
  const focused = useIsFocused();
  return <LoopActiveContext.Provider value={focused}>{children}</LoopActiveContext.Provider>;
}