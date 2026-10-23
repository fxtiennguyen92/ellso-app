import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Icon nét viền 24×24 dùng trên app. */
export type IconName =
  // chung
  | 'bell'
  | 'search'
  | 'filter'
  | 'play'
  | 'pin'
  | 'chevronRight'
  | 'chevronLeft'
  | 'clock'
  | 'cart'
  | 'check'
  | 'arrowUp'
  | 'book'
  | 'bookOpen'
  // thanh điều hướng
  | 'home'
  | 'courses'
  | 'documents'
  | 'profile'
  // icon bài học
  | 'bulb'
  | 'eye'
  | 'zap'
  | 'scale'
  | 'people'
  | 'layers'
  | 'key'
  | 'alert'
  | 'help'
  | 'message'
  | 'clipboard'
  | 'grid'
  | 'branch'
  | 'target'
  // hồ sơ
  | 'qr'
  | 'crown'
  | 'copy'
  | 'link'
  | 'share'
  | 'lock'
  | 'receipt'
  | 'ticket'
  | 'sun'
  | 'moon'
  | 'phone'
  | 'shield'
  | 'logout'
  | 'close'
  | 'user'
  // tài liệu
  | 'bookmark'
  | 'bookmarkFilled'
  | 'tag'
  | 'video'
  | 'image'
  | 'chevronDown'
  | 'mail'
  | 'eyeOff'
  | 'info'
  | 'scan';

type Props = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
  /** Tô nhạt phần thân icon (dùng cho tab đang chọn). Chỉ có ở các icon thanh điều hướng. */
  duotone?: boolean;
  opacity?: number;
};

export function Icon({ name, size = 22, color, strokeWidth = 2, duotone = false, opacity = 1 }: Props) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  /** Lớp tô nhạt cho duotone (vẽ dưới nét viền). */
  const tone = { fill: color, fillOpacity: duotone ? 0.22 : 0, stroke: 'none' };

  return (
    // Icon chỉ để trang trí: nút bọc ngoài đã có accessibilityLabel.
    // Không truyền prop accessibility của RN vào Svg — trên web react-native-svg đẩy thẳng xuống thẻ <svg> gây cảnh báo.
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none" opacity={opacity}>
      {/* ---------- chung ---------- */}
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
      {name === 'pin' && (
        <>
          <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" {...stroke} />
          <Circle cx="12" cy="10" r="3" {...stroke} />
        </>
      )}
      {name === 'chevronRight' && <Path d="m9 18 6-6-6-6" {...stroke} />}
      {name === 'chevronLeft' && <Path d="m15 18-6-6 6-6" {...stroke} />}
      {name === 'clock' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 7v5l3 2" {...stroke} />
        </>
      )}
      {name === 'cart' && (
        <>
          <Circle cx="9" cy="20" r="1.5" {...stroke} />
          <Circle cx="18" cy="20" r="1.5" {...stroke} />
          <Path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6" {...stroke} />
        </>
      )}
      {name === 'check' && <Path d="M20 6 9 17l-5-5" {...stroke} />}
      {name === 'arrowUp' && <Path d="M12 19V5M5 12l7-7 7 7" {...stroke} />}
      {name === 'book' && <Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" {...stroke} />}
      {name === 'bookOpen' && (
        <>
          <Path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z" {...stroke} />
          <Path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z" {...stroke} />
        </>
      )}

      {/* ---------- thanh điều hướng ---------- */}
      {name === 'home' && (
        <>
          <Path d="M3 10.2 12 3l9 7.2V19a2 2 0 0 1-2 2h-4v-5.5a1.5 1.5 0 0 0-1.5-1.5h-3A1.5 1.5 0 0 0 9 15.5V21H5a2 2 0 0 1-2-2Z" {...tone} />
          <Path d="M3 10.2 12 3l9 7.2V19a2 2 0 0 1-2 2h-4v-5.5a1.5 1.5 0 0 0-1.5-1.5h-3A1.5 1.5 0 0 0 9 15.5V21H5a2 2 0 0 1-2-2Z" {...stroke} />
        </>
      )}
      {name === 'courses' && (
        // Mũ tốt nghiệp có tua rua
        <>
          <Path d="M2 9.5 12 5l10 4.5-10 4.5Z" {...tone} />
          <Path d="M2 9.5 12 5l10 4.5-10 4.5Z" {...stroke} />
          <Path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4" {...stroke} />
          <Path d="M20.5 10.2v4.8" {...stroke} />
          <Circle cx="20.5" cy="16.6" r="1.1" fill={color} />
        </>
      )}
      {name === 'documents' && (
        // Hai trang giấy chồng lên nhau, trang trước gấp góc
        <>
          <Path d="M9 7.5A1.5 1.5 0 0 1 10.5 6H16l4 4v9.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 9 19.5Z" {...tone} />
          <Path d="M5 17V5a2 2 0 0 1 2-2h7" {...stroke} />
          <Path d="M9 7.5A1.5 1.5 0 0 1 10.5 6H16l4 4v9.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 9 19.5Z" {...stroke} />
          <Path d="M16 6v4h4" {...stroke} />
          <Path d="M12 14h5M12 17.5h3" {...stroke} />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx="12" cy="8" r="4" {...tone} />
          <Circle cx="12" cy="8" r="4" {...stroke} />
          <Path d="M4 21a8 8 0 0 1 16 0" {...stroke} />
        </>
      )}

      {/* ---------- icon bài học ---------- */}
      {name === 'bulb' && (
        <>
          <Path d="M9 18h6M10 22h4" {...stroke} />
          <Path d="M15.1 14c.2-1 .7-1.7 1.4-2.5A4.6 4.6 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.2 1.5 1.4 2.5" {...stroke} />
        </>
      )}
      {name === 'eye' && (
        <>
          <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" {...stroke} />
          <Circle cx="12" cy="12" r="3" {...stroke} />
        </>
      )}
      {name === 'zap' && <Path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" {...stroke} />}
      {name === 'scale' && (
        <>
          <Path d="M12 3v18M7 21h10M4 7h16" {...stroke} />
          <Path d="m7 7-3 7a3 3 0 0 0 6 0Z" {...stroke} />
          <Path d="m17 7-3 7a3 3 0 0 0 6 0Z" {...stroke} />
        </>
      )}
      {name === 'people' && (
        <>
          <Circle cx="8" cy="8" r="3" {...stroke} />
          <Circle cx="16.5" cy="9" r="2.5" {...stroke} />
          <Path d="M2.5 20a5.5 5.5 0 0 1 11 0" {...stroke} />
          <Path d="M13.5 15.5a4.5 4.5 0 0 1 8 3" {...stroke} />
        </>
      )}
      {name === 'layers' && (
        <>
          <Path d="m12 2 10 5-10 5L2 7l10-5Z" {...stroke} />
          <Path d="m2 17 10 5 10-5M2 12l10 5 10-5" {...stroke} />
        </>
      )}
      {name === 'key' && (
        <>
          <Circle cx="7.5" cy="15.5" r="4.5" {...stroke} />
          <Path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2" {...stroke} />
        </>
      )}
      {name === 'alert' && (
        <>
          <Path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" {...stroke} />
          <Path d="M12 9v4M12 17h.01" {...stroke} />
        </>
      )}
      {name === 'help' && (
        <>
          <Circle cx="12" cy="12" r="10" {...stroke} />
          <Path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" {...stroke} />
        </>
      )}
      {name === 'message' && <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" {...stroke} />}
      {name === 'clipboard' && (
        <>
          <Rect x="5" y="4" width="14" height="18" rx="2" {...stroke} />
          <Path d="M9 2h6v4H9z" {...stroke} />
          <Path d="m9 14 2 2 4-4" {...stroke} />
        </>
      )}
      {name === 'grid' && (
        <>
          <Rect x="3" y="3" width="18" height="18" rx="2" {...stroke} />
          <Path d="M3 12h18M12 3v18" {...stroke} />
        </>
      )}
      {name === 'branch' && (
        <>
          <Circle cx="6" cy="6" r="3" {...stroke} />
          <Circle cx="6" cy="18" r="3" {...stroke} />
          <Circle cx="18" cy="8" r="3" {...stroke} />
          <Path d="M6 9v6M18 11c0 4-6 3-9 6" {...stroke} />
        </>
      )}
      {name === 'target' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Circle cx="12" cy="12" r="5" {...stroke} />
          <Circle cx="12" cy="12" r="1" {...stroke} />
        </>
      )}

      {/* ---------- hồ sơ ---------- */}
      {name === 'qr' && (
        <>
          <Rect x="3.75" y="3.75" width="6.5" height="6.5" rx="1.25" {...stroke} />
          <Rect x="13.75" y="3.75" width="6.5" height="6.5" rx="1.25" {...stroke} />
          <Rect x="3.75" y="13.75" width="6.5" height="6.5" rx="1.25" {...stroke} />
          <Path d="M13.75 13.75h2.5v2.5h-2.5ZM19.25 13.75h1M13.75 19.25v1M16.75 19.25h3.5v1M19.75 16.25v1.5" {...stroke} />
        </>
      )}
      {name === 'crown' && <Path d="M3 18h18M4 8l4 4 4-7 4 7 4-4-1.5 10h-13Z" {...stroke} />}
      {name === 'copy' && (
        <>
          <Rect x="8.75" y="8.75" width="11.5" height="11.5" rx="2.25" {...stroke} />
          <Path d="M15.25 8.75V5.75a2 2 0 0 0-2-2h-7.5a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h3" {...stroke} />
        </>
      )}
      {name === 'link' && (
        <>
          <Path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" {...stroke} />
          <Path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" {...stroke} />
        </>
      )}
      {name === 'share' && (
        <>
          <Path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" {...stroke} />
          <Path d="M5 12.5v5.75A2.25 2.25 0 0 0 7.25 20.5h9.5A2.25 2.25 0 0 0 19 18.25V12.5" {...stroke} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x="4.75" y="10.75" width="14.5" height="9.5" rx="2.25" {...stroke} />
          <Path d="M8.25 10.75V7.5a3.75 3.75 0 0 1 7.5 0v3.25" {...stroke} />
        </>
      )}
      {name === 'receipt' && (
        <>
          <Path d="M6 3.75h12v16.5l-2.5-1.5-2 1.5-1.5-1.5-1.5 1.5-2-1.5-2.5 1.5Z" {...stroke} />
          <Path d="M9 8.5h6M9 12h6" {...stroke} />
        </>
      )}
      {name === 'ticket' && (
        <>
          <Path d="M3.75 8.5V6.75a1 1 0 0 1 1-1h14.5a1 1 0 0 1 1 1V8.5a2.5 2.5 0 0 0 0 5v1.75a1 1 0 0 1-1 1H4.75a1 1 0 0 1-1-1V13.5a2.5 2.5 0 0 0 0-5Z" {...stroke} />
          <Path d="M10 6v12" {...stroke} strokeDasharray="2 2" />
        </>
      )}
      {name === 'sun' && (
        <>
          <Circle cx="12" cy="12" r="4" {...stroke} />
          <Path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" {...stroke} />
        </>
      )}
      {name === 'moon' && <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" {...stroke} />}
      {name === 'phone' && (
        <>
          <Rect x="6.75" y="2.75" width="10.5" height="18.5" rx="2.25" {...stroke} />
          <Path d="M11 18h2" {...stroke} />
        </>
      )}
      {name === 'shield' && (
        <>
          <Path d="M12 3.25 4.75 6v5.5c0 4.4 3 7.9 7.25 9.25 4.25-1.35 7.25-4.85 7.25-9.25V6Z" {...stroke} />
          <Path d="m9.25 12 2 2 3.5-3.75" {...stroke} />
        </>
      )}
      {name === 'logout' && (
        <>
          <Path d="M14.5 4.75H17a2.25 2.25 0 0 1 2.25 2.25v10A2.25 2.25 0 0 1 17 19.25h-2.5" {...stroke} />
          <Path d="M10 16.5 5.5 12 10 7.5M5.5 12h9.25" {...stroke} />
        </>
      )}
      {name === 'close' && <Path d="M6 6l12 12M18 6 6 18" {...stroke} />}
      {/* ---------- tài khoản ---------- */}
      {name === 'mail' && (
        <>
          <Rect x="3.25" y="5.25" width="17.5" height="13.5" rx="2.5" {...stroke} />
          <Path d="m4 7 8 6 8-6" {...stroke} />
        </>
      )}
      {name === 'eyeOff' && (
        <>
          <Path d="M10.6 5.85A9.7 9.7 0 0 1 12 5.75c5.75 0 9.25 6.25 9.25 6.25a16.6 16.6 0 0 1-2.4 3.2M6.6 7.1C4.2 8.7 2.75 12 2.75 12S6.25 18.25 12 18.25a8.9 8.9 0 0 0 4.4-1.15" {...stroke} />
          <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" {...stroke} />
        </>
      )}
      {name === 'info' && (
        <>
          <Circle cx="12" cy="12" r="8.25" {...stroke} />
          <Path d="M12 11v5M12 8h.01" {...stroke} />
        </>
      )}
      {name === 'scan' && (
        <>
          <Path d="M3.75 8V5.75a2 2 0 0 1 2-2H8M16 3.75h2.25a2 2 0 0 1 2 2V8M20.25 16v2.25a2 2 0 0 1-2 2H16M8 20.25H5.75a2 2 0 0 1-2-2V16" {...stroke} />
          <Path d="M3.75 12h16.5" {...stroke} />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx="12" cy="8" r="3.75" {...stroke} />
          <Path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" {...stroke} />
        </>
      )}

      {/* ---------- tài liệu ---------- */}
      {(name === 'bookmark' || name === 'bookmarkFilled') && (
        <Path
          d="M7 3.75h10A1.25 1.25 0 0 1 18.25 5v15.25L12 16.5l-6.25 3.75V5A1.25 1.25 0 0 1 7 3.75Z"
          {...stroke}
          fill={name === 'bookmarkFilled' ? color : 'none'}
        />
      )}
      {name === 'tag' && (
        <>
          <Path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" {...stroke} />
          <Circle cx="7.5" cy="7.5" r="1.5" {...stroke} />
        </>
      )}
      {name === 'video' && (
        <>
          <Rect x="2.75" y="5.75" width="18.5" height="12.5" rx="3" {...stroke} />
          <Path d="M10.25 9.5v5l4.25-2.5Z" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
        </>
      )}
      {name === 'image' && (
        <>
          <Rect x="3" y="3" width="18" height="18" rx="2" {...stroke} />
          <Circle cx="9" cy="9" r="2" {...stroke} />
          <Path d="m21 15-5-5L5 21" {...stroke} />
        </>
      )}
      {name === 'chevronDown' && <Path d="m6 9 6 6 6-6" {...stroke} />}
    </Svg>
  );
}
