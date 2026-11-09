import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { apiEnrollFree } from '@/data/courses';
import { ApiError } from '@/lib/api';

/**
 * Nút "Bắt đầu học" / "Tiếp tục học" (khoá miễn phí hoặc đã sở hữu): khoá miễn phí chưa ghi danh → ghi danh trước
 * (POST /courses/{id}/enroll), rồi mở lộ trình học /courses/[id].
 */
export function useStartCourse() {
  const { token } = useAuth();
  const { showToast } = useDocuments();
  const [busyId, setBusyId] = useState<number | null>(null);

  const start = useCallback(
    async (course: { id: number; enrolled: boolean }) => {
      if (!token || busyId) return;
      if (!course.enrolled) {
        setBusyId(course.id);
        try {
          await apiEnrollFree(token, course.id);
        } catch (e) {
          showToast(e instanceof ApiError ? e.message : 'Không mở được khoá học, thử lại sau.');
          setBusyId(null);
          return;
        }
        setBusyId(null);
      }
      router.push({ pathname: '/courses/[id]', params: { id: String(course.id) } });
    },
    [token, busyId, showToast],
  );

  return { start, busyId };
}
