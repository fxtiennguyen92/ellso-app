import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { useToast } from '@/components/Toast';
import { apiSetSaved, getAllDocs, type Doc } from '@/data/documents';

import { AccessSheet } from './AccessSheet';

type Ctx = {
  docs: Doc[];
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
  const [toast, showToast] = useToast();

  const toggleSave = useCallback(
    (doc: Doc) => {
      const next = !doc.saved;
      setDocs((list) => list.map((d) => (d.id === doc.id ? { ...d, saved: next } : d)));
      showToast(next ? 'Đã lưu vào Tài liệu của tôi' : 'Đã bỏ lưu');
      apiSetSaved(doc.id, next).catch(() => {
        setDocs((list) => list.map((d) => (d.id === doc.id ? { ...d, saved: !next } : d)));
        showToast('Không lưu được, thử lại sau');
      });
    },
    [showToast],
  );

  const openDoc = useCallback(
    (doc: Doc) => {
      if (doc.unlocked) onView(doc);
      else setLockedDoc(doc);
    },
    [onView],
  );

  const value = useMemo(() => ({ docs, toggleSave, openDoc, showToast }), [docs, toggleSave, openDoc, showToast]);

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