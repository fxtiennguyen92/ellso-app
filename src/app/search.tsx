import { useLocalSearchParams } from 'expo-router';

import { type SearchScope, SearchScreen } from '@/components/search/SearchScreen';

/** Tìm kiếm: /search (Trang chủ: khoá học + tài liệu) · /search?scope=courses · /search?scope=documents. */
export default function SearchRoute() {
  const { scope } = useLocalSearchParams<{ scope?: string }>();
  const s: SearchScope = scope === 'courses' || scope === 'documents' ? scope : 'all';
  return <SearchScreen scope={s} />;
}
