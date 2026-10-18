import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

type Props = {
  id?: string;
  title: string;
  subtitle: string;
  action?: { label: string; onPress?: () => void };
};

export function SectionTitle({ title, subtitle, action }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text accessibilityRole="header" style={[type.sectionTitle, { color: colors.ink900 }]}>
          {title}
        </Text>
        <Text style={[type.caption, { color: colors.ink600 }]}>{subtitle}</Text>
      </View>
      {action && (
        <Pressable accessibilityRole="link" onPress={action.onPress} hitSlop={8} style={styles.action}>
          {({ pressed }) => (
            <Text style={[type.label, { color: pressed ? colors.emerald800 : colors.emerald700 }]}>{action.label}</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  text: { flex: 1 },
  action: { paddingVertical: 8 },
});
