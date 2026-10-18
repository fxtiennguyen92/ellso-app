import Svg, { Circle, Path } from 'react-native-svg';

/** Icon nét viền 24×24 dùng trên app (cùng bộ path với thiết kế home-screen-design.html). */
export type IconName = 'bell' | 'search' | 'filter' | 'play' | 'home' | 'courses' | 'documents' | 'profile' | 'pin' | 'chevronRight' | 'clock';

type Props = { name: IconName; size?: number; color: string; strokeWidth?: number };

export function Icon({ name, size = 22, color, strokeWidth = 2 }: Props) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  return (
    // Icon chỉ để trang trí: nút bọc ngoài đã có accessibilityLabel.
    // Không truyền prop accessibility của RN vào Svg — trên web react-native-svg đẩy thẳng xuống thẻ <svg> gây cảnh báo.
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      {name === 'bell' && (
        <>
          <Path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" {...stroke} />
          <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" {...stroke} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx="11" cy="11" r="7" {...stroke} />
          <Path d="m20 20-3.5-3.5" {...stroke} />
        </>
      )}
      {name === 'filter' && <Path d="M4 6h16M7 12h10M10 18h4" {...stroke} />}
      {name === 'play' && <Path d="M8 5v14l11-7z" fill={color} />}
      {name === 'home' && <Path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" {...stroke} />}
      {name === 'courses' && (
        <>
          <Path d="M22 10 12 5 2 10l10 5 10-5Z" {...stroke} />
          <Path d="M6 12v5c3 2 9 2 12 0v-5" {...stroke} />
        </>
      )}
      {name === 'documents' && (
        <>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" {...stroke} />
          <Path d="M14 2v6h6" {...stroke} />
          <Path d="M8 13h8M8 17h5" {...stroke} />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx="12" cy="8" r="4" {...stroke} />
          <Path d="M4 21a8 8 0 0 1 16 0" {...stroke} />
        </>
      )}
      {name === 'pin' && (
        <>
          <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" {...stroke} />
          <Circle cx="12" cy="10" r="3" {...stroke} />
        </>
      )}
      {name === 'chevronRight' && <Path d="m9 18 6-6-6-6" {...stroke} />}
      {name === 'clock' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 7v5l3 2" {...stroke} />
        </>
      )}
    </Svg>
  );
}