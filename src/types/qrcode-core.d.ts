// Khai báo kiểu cho phần lõi của thư viện qrcode (gói không kèm type cho đường dẫn này).
declare module 'qrcode/lib/core/qrcode' {
  export function create(
    text: string,
    options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' },
  ): { modules: { size: number; data: ArrayLike<number> } };
}