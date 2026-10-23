import { useCallback, useEffect, useState } from 'react';

/** Đếm ngược theo giây. `restart()` đặt lại từ đầu (hoặc từ số giây mới, vd server trả về). */
export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const restart = useCallback((next?: number) => setLeft(next ?? seconds), [seconds]);
  const label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return { left, label, done: left <= 0, restart };
}
