import { useEffect, useRef, useState, type RefObject } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewInstance } from 'react-native';

import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';

export type FlyPoint = { x: number; y: number };
type Flight = { id: number; from: FlyPoint | null };

const DOT = 14;

/**
 * Lớp phủ toàn app (pointerEvents none): mỗi lần thêm vào giỏ, một chấm xanh lá bật lên rồi rơi theo đường cong
 * vào icon Giỏ hàng trên thanh tab (vị trí đo bằng `anchorRef` mà BottomBar gắn), tới nơi gọi `onLand` để icon "hứng".
 * Toạ độ: điểm bấm (pageX/pageY) và anchor đều là toạ độ cửa sổ → trừ vị trí của chính lớp phủ (web: khung app căn giữa).
 */
export function CartFlyLayer({ flights, anchorRef, onDone }: { flights: Flight[]; anchorRef: RefObject<ViewInstance | null>; onDone: (id: number, landed: boolean) => void }) {
  const layerRef = useRef<ViewInstance>(null);
  return (
    <View ref={layerRef} pointerEvents="none" style={StyleSheet.absoluteFill}>
      {flights.map((f) => (
        <FlyingDot key={f.id} flight={f} anchorRef={anchorRef} layerRef={layerRef} onDone={onDone} />
      ))}
    </View>
  );
}

function measure(ref: RefObject<ViewInstance | null>): Promise<{ x: number; y: number; w: number; h: number } | null> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node?.measureInWindow) return resolve(null);
    node.measureInWindow((x, y, w, h) => resolve(w || h ? { x, y, w, h } : null));
  });
}

function FlyingDot({
  flight,
  anchorRef,
  layerRef,
  onDone,
}: {
  flight: Flight;
  anchorRef: RefObject<ViewInstance | null>;
  layerRef: RefObject<ViewInstance | null>;
  onDone: (id: number, landed: boolean) => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;
  const [path, setPath] = useState<{ from: FlyPoint; to: FlyPoint } | null>(null);

  useEffect(() => {
    let alive = true;
    // Chờ một nhịp: lần thêm đầu tiên tab Giỏ hàng mới hiện ra / thanh tab còn đang giãn
    const timer = setTimeout(async () => {
      const [layer, anchor] = await Promise.all([measure(layerRef), measure(anchorRef)]);
      if (!alive) return;
      if (!layer || !anchor || reduced) {
        onDone(flight.id, !!anchor);
        return;
      }
      const to = { x: anchor.x - layer.x + anchor.w / 2, y: anchor.y - layer.y + anchor.h / 2 };
      const from = flight.from ? { x: flight.from.x - layer.x, y: flight.from.y - layer.y } : { x: layer.w / 2, y: layer.h * 0.45 };
      setPath({ from, to });
      Animated.timing(t, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }).start(() =>
        onDone(flight.id, true),
      );
    }, 380);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!path) return null;
  const { from, to } = path;
  const peak = Math.min(from.y, to.y) - 90; // bật lên trước khi rơi
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: colors.emerald500,
          borderColor: '#ffffff',
          opacity: t.interpolate({ inputRange: [0, 0.08, 0.92, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [from.x - DOT / 2, to.x - DOT / 2] }) },
            {
              translateY: t.interpolate({
                inputRange: [0, 0.35, 1],
                outputRange: [from.y - DOT / 2, peak, to.y - DOT / 2],
                easing: Easing.inOut(Easing.sin),
              }),
            },
            { scale: t.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0.4, 1.15, 0.9, 0.5] }) },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    boxShadow: '0px 4px 10px rgba(5,150,105,0.45)',
  },
});
