import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, type TextInputInstance, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton } from '@/components/auth/AuthUI';
import { CenterDialog } from '@/components/CenterDialog';
import { Icon } from '@/components/Icon';
import { apiCartPromo, type CartPromo } from '@/data/cart';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/**
 * Popup giữa màn hình nhập mã khuyến mãi ở Giỏ hàng (giữa màn thay vì bottom sheet để bàn phím không che): nhập → "Kiểm tra & áp dụng" (POST /cart/promo) → hợp lệ thì trả mã về trang giỏ
 * và đóng; sai thì báo lỗi ngay dưới ô. CenterDialog bọc KeyboardAvoidingView, nút nằm ngay dưới ô.
 */
export function PromoSheet({ visible, onClose, onApplied }: { visible: boolean; onClose: () => void; onApplied: (p: CartPromo) => void }) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);

  useEffect(() => {
    if (!visible) return;
    setCode('');
    setError(null);
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [visible]);

  const submit = async () => {
    if (!token || !code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const p = await apiCartPromo(token, code.trim());
      onApplied(p);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không kiểm tra được mã, thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <CenterDialog visible={visible} onClose={onClose} title="Thêm mã khuyến mãi">
      <View style={styles.body}>
        <View style={[styles.field, { backgroundColor: colors.bg, borderColor: error ? colors.danger : colors.line }]}>
          <Icon name="ticket" size={20} color={error ? colors.danger : colors.ink400} />
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="VD: PLUS30"
            placeholderTextColor={colors.ink400}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
            returnKeyType="done"
            onSubmitEditing={submit}
            accessibilityLabel="Mã khuyến mãi"
            style={[styles.input, { color: colors.ink900 }]}
          />
        </View>
        {error ? (
          <View style={styles.errorRow}>
            <Icon name="alert" size={14} color={colors.danger} />
            <Text style={[type.caption, styles.grow, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : (
          <Text style={[type.caption, { color: colors.ink600 }]}>Mã khuyến mãi hiện áp dụng cho khoá học trong giỏ.</Text>
        )}
        <View style={styles.btn}>
          <PrimaryButton label="Kiểm tra & áp dụng" disabled={!code.trim()} loading={busy} onPress={submit} />
        </View>
      </View>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  body: { gap: 10 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5 },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.sans600,
    fontSize: 17,
    letterSpacing: 1.2,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn: { marginTop: 10 },
});
