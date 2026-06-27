import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/tokens';

interface PillProps {
  label: string;
  bg?: string;
  textColor?: string;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const Pill: React.FC<PillProps> = ({
  label,
  bg = colors.terracotta.tint,
  textColor = colors.terracotta.dark,
  style,
  icon,
}) => (
  <View style={[styles.pill, { backgroundColor: bg }, style]}>
    {icon && <View style={styles.icon}>{icon}</View>}
    <Text style={[typography.label, { color: textColor }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  icon: {
    marginRight: spacing.xs,
  },
});
