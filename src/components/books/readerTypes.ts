export type ReaderMessage =
  | { type: 'ready'; total: number; unit: 'page' | 'chapter' }
  | { type: 'progress'; current: number; total: number }
  | { type: 'end' }
  | { type: 'error'; message: string };
