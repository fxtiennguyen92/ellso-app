import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Danh sách phân trang theo cursor (API trả `next_cursor`), tải thêm khi cuộn tới cuối.
 * `fetchPage(cursor)` → `{ items, nextCursor, ...meta }`; meta của trang đầu (vd balance, total) giữ ở `meta`.
 * Dùng với FlatList: `onEndReached={loadMore}`, `refreshing / onRefresh` không bắt buộc.
 */
export function useCursorList<T, M extends object = object>(fetchPage: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null } & M>) {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<M | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'idle' | 'more' | 'error'>('loading');
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const reload = useCallback(async () => {
    busy.current = true;
    setState('loading');
    try {
      const { items: first, nextCursor, ...rest } = await fetchRef.current(null);
      setItems(first);
      setMeta(rest as unknown as M);
      setCursor(nextCursor);
      setDone(!nextCursor);
      setState('idle');
    } catch {
      setState('error');
    } finally {
      busy.current = false;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (busy.current || done || !cursor) return;
    busy.current = true;
    setState('more');
    try {
      const page = await fetchRef.current(cursor);
      setItems((list) => [...list, ...page.items]);
      setCursor(page.nextCursor);
      setDone(!page.nextCursor);
      setState('idle');
    } catch {
      setState('idle'); // lỗi khi tải thêm: giữ danh sách, lần cuộn sau thử lại
    } finally {
      busy.current = false;
    }
  }, [cursor, done]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, meta, loading: state === 'loading', loadingMore: state === 'more', error: state === 'error', hasMore: !done, loadMore, reload };
}
