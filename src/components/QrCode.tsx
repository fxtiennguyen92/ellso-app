import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
// Chỉ lấy phần lõi thuần JS của thư viện qrcode (không kéo theo canvas / fs)
import { create } from 'qrcode/lib/core/qrcode';

type Props = { value: string; size: number; color: string; background: string; quietZone?: number };

/** Mã QR vẽ bằng react-native-svg (chạy native + web). */
export function QrCode({ value, size, color, background, quietZone = 2 }: Props) {
  const { path, count } = useMemo(() => {
    const qr = create(value, { errorCorrectionLevel: 'M' });
    const n: number = qr.modules.size;
    const data: ArrayLike<number> = qr.modules.data;
    let d = '';
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (data[y * n + x]) d += `M${x + quietZone} ${y + quietZone}h1v1h-1z`;
      }
    }
    return { path: d, count: n + quietZone * 2 };
  }, [value, quietZone]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${count} ${count}`}>
      <Rect x="0" y="0" width={count} height={count} fill={background} />
      <Path d={path} fill={color} />
    </Svg>
  );
}