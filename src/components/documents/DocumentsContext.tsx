import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { useToast } from '@/components/Toast';
import { apiSetSaved, getAllDocs, type Doc } from '@/data/documents';
import { apiRequest } from '@/lib/api';

import { AccessSheet } from './AccessSheet';

type Ctx = {
  docs: Doc[];
  /** Trạng thái lưu hiện tại (đã tính các lần bấm lưu / bỏ lưu trên máy — Home, trang sách… dùng chung). */
  isSaved: (doc: Doc) => boolean;
  toggleSave: (doc: Doc) => void;
  /** Bấm vào tài liệu: mở → trình xem; khoá → bảng "Cách mở tài liệu". */
  openDoc: (doc: Doc) => void;
  showToast: (msg: string) => void;
};

const DocumentsContext = createContext<Ctx | null>(null);

/**
 * Trạng thái dùng chung cho Home (mục Sách) và mọi màn của tab Tài liệu (bọc ở (tabs)/_layout.tsx):
 * danh sách tài liệu, lưu/bỏ lưu (cập nhật lạc quan, hoàn tác nếu API lỗi), bảng cách mở, toast.
 */
export function DocumentsProvider({ children, onView }: { children: ReactNode; onView: (doc: Doc) => void }) {
  const [docs, setDocs] = useState<Doc[]>(getAllDocs);
  const [lockedDoc, setLockedDoc] = useState<Doc | null>(null);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [toast, showToast] = useToast();
  const { token } = useAuth();

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
      // Tài liệu thật (id số, từ API): POST / DELETE /documents/{id}/save; dữ liệu tạm của tab Tài liệu: giả lập
      const call = /^\d+$/.test(doc.id) && token ? apiRequest(next ? 'POST' : 'DELETE', `/documents/${doc.id}/save`, { token }) : apiSetSaved(doc.id, next);
      call.catch(() => {
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

  const value = useMemo(() => ({ docs, isSaved, toggleSave, openDoc, showToast }), [docs, isSaved, toggleSave, openDoc, showToast]);

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