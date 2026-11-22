import * as Clipboard from 'expo-clipboard';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import { QrCode } from '@/components/QrCode';
import { displayLink } from '@/data/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/**
 * Bảng "Mã QR giới thiệu": QR của link giới thiệu (luôn đen trên trắng), mã (bấm để sao chép), link, nút Chia sẻ link.
 * Dùng ở nút QR trang Hồ sơ và ở Bạn bè (khi chưa giới thiệu ai). `onMessage`: toast của màn gọi.
 */
export function ReferralQrSheet({
  visible,
  code,
  onClose,
  onMessage,
}: {
  visible: boolean;
  code: string;
  onClose: () => void;
  onMessage: (text: string) => void;
}) {
  const { colors } = useTheme();
  const referralLink = `https://ellso.app/r/${code}`;

  const copy = async (text: string, message: string) => {
    try {
      await Clipboard.setStringAsync(text);
      onMessage(message);
    } catch {
      onMessage('Không sao chép được');
    }
  };

  const share = async () => {
    const message = `Học cùng mình trên Ellso! Dùng mã ${code} khi đăng ký: ${referralLink}`;
    // Web: trình duyệt không hỗ trợ share sheet → sao chép link thay thế
    if (Platform.OS === 'web' && !(typeof navigator !== 'undefined' && 'share' in navigator)) {
      return copy(referralLink, 'Đã sao chép link giới thiệu');
    }
    try {
      await Share.share({ message, url: referralLink, title: 'Mời bạn học Ellso' });
    } catch {
      copy(referralLink, 'Đã sao chép link giới thiệu');
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Mã QR giới thiệu">
      <View style={styles.wrap}>
        <View style={[styles.box, { borderColor: colors.line }]}>
          {/* QR luôn đen trên trắng để máy quét đọc tốt ở cả chế độ tối */}
          <QrCode value={referralLink} size={220} color="#0f172a" background="#ffffff" />
        </View>
        <Text style={[type.caption, styles.center, { color: colors.ink600 }]}>Bạn bè quét mã này để đăng ký với mã giới thiệu của bạn</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sao chép mã ${code}`}
          onPress={() => copy(code, `Đã sao chép mã ${code}`)}
          style={({ pressed }) => [styles.code, { backgroundColor: colors.mint50, borderColor: colors.emerald500, opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={[styles.codeText, { color: colors.ink900 }]}>{code}</Text>
          <Icon name="copy" size={16} color={colors.emerald700} />
        </Pressable>
        <Text style={[type.caption, { color: colors.ink600 }]}>{displayLink(referralLink)}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={share}
          style={({ pressed }) => [styles.primary, { backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }]}
        >
          <Icon name="share" size={18} color={colors.onEmerald} />
          <Text style={[type.label, { color: colors.onEmerald }]}>Chia sẻ link</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  box: { padding: 12, borderRadius: 20, borderWidth: 1, backgroundColor: '#ffffff' },
  center: { textAlign: 'center' },
  code: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed' },
  codeText: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24, letterSpacing: 2.2 },
  primary: { alignSelf: 'stretch', height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
});
