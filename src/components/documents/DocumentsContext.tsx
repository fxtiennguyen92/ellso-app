import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/Toast';
import { apiDocuments, apiDocumentTopics, apiSetSaved, type Doc, type Topic } from '@/data/documents';

import { AccessSheet } from './AccessSheet';

type Ctx = {
  docs: Doc[];
  topics: Topic[];
  /** Lần tải đầu chưa xong. */
  loading: boolean;
  /** Lần tải gần nhất lỗi (đang hiện dữ liệu cũ nếu có). */
  failed: boolean;
  /** Tải lại danh sách (khi quay về tab Tài liệu, sau khi mua…). */
  refresh: () => Promise<void>;
  /** Trạng thái lưu hiện tại (đã tính các lần bấm lưu / bỏ lưu trên máy — Home, trang sách… dùng chung). */
  isSaved: (doc: Doc) => boolean;
  toggleSave: (doc: Doc) => void;
  /** Bấm vào tài liệu: mở → trình xem; khoá → bảng "Cách mở tài liệu". */
  openDoc: (doc: Doc) => void;
  showToast: (msg: string) => void;
};

const DocumentsContext = createContext<Ctx | null>(null);

/**
 * Trạng thái dùng chung cho Home (mục Sách), trang sách và mọi màn của tab Tài liệu (bọc ở root layout):
 * danh sách tài liệu + chủ đề (GET /documents, /documents/topics), lưu / bỏ lưu (cập nhật lạc quan, hoàn tác nếu API lỗi),
 * bảng "Cách mở tài liệu" khi bấm tài liệu đang khoá, toast.
 */
export function DocumentsProvider({ children, onView }: { children: ReactNode; onView: (doc: Doc) => void }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const loadingRef = useRef(false);
  const [lockedDoc, setLockedDoc] = useState<Doc | null>(null);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [toast, showToast] = useToast();
  const { token } = useAuth();

  const refresh = useCallback(async () => {
    if (!token || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const [list, tps] = await Promise.all([apiDocuments(token), apiDocumentTopics(token).catch(() => null)]);
      setDocs(list);
      setSavedMap({}); // server đã có trạng thái lưu mới nhất
      if (tps) setTopics(tps);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) refresh();
    else {
      setDocs([]);
      setLoading(true);
    }
  }, [token, refresh]);

  const isSaved = useCallback((doc: Doc) => savedMap[doc.id] ?? doc.saved, [savedMap]);

  const toggleSave = useCallback(
    (doc: Doc) => {
      const next = !(savedMap[doc.id] ?? doc.saved);
      const set = (v: boolean) => {
        setSavedMap((m) => ({ ...m, [doc.id]: v }));
        setDocs((list) => list.map((d) => (d.id === doc.id ? { ...d, saved: v } : d)));
      };
      set(next);
      showToast(next ? 'Đã lưu vào Tài liệu của tôi' : 'Đã bỏ lưu');
      if (!token) return;
      apiSetSaved(token, doc.id, next).catch(() => {
        set(!next);
        showToast('Không lưu được, thử lại sau');
      });
    },
    [savedMap, showToast, token],
  );

  const openDoc = useCallback(
    (doc: Doc) => {
      if (doc.unlocked) onView(doc);
      else setLockedDoc(doc);
    },
    [onView],
  );

  const value = useMemo(
    () => ({ docs, topics, loading, failed, refresh, isSaved, toggleSave, openDoc, showToast }),
    [docs, topics, loading, failed, refresh, isSaved, toggleSave, openDoc, showToast],
  );

  return (
    <DocumentsContext.Provider value={value}>
      {children}
      <AccessSheet doc={lockedDoc} onClose={() => setLockedDoc(null)} onNotice={showToast} />
      {toast}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error('useDocuments phải nằm trong <DocumentsProvider>');
  return ctx;
}