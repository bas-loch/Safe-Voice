import React, { useCallback } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { colors, typography, radius, spacing } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'premium' | 'ghost' | 'disabled';
export type ButtonSize = 'default' | 'small';

interface ButtonProps {
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}

const VARIANTS = {
  primary: {
    bg: colors.terracotta.DEFAULT,
    border: colors.terracotta.dark,
    text: colors.text.onColor,
  },
  secondary: {
    bg: colors.olive.DEFAULT,
    border: colors.olive.dark,
    text: colors.text.onColor,
  },
  premium: {
    bg: colors.gem.DEFAULT,
    border: colors.gem.dark,
    text: colors.text.onColor,
  },
  ghost: {
    bg: 'transparent',
    border: colors.border.strong,
    text: colors.text.primary,
  },
  disabled: {
    bg: '#D8CCBB',
    border: '#D8CCBB',
    text: colors.text.tertiary,
  },
};

export const Button: React.FC<ButtonProps> = ({
  onPress,
  variant = 'primary',
  size = 'default',
  label,
  icon,
  style,
  disabled,
}) => {
  const effectiveVariant = disabled ? 'disabled' : variant;
  const v = VARIANTS[effectiveVariant];
  const isSmall = size === 'small';
  const isDisabled = effectiveVariant === 'disabled';
  const has3D = !isDisabled && effectiveVariant !== 'ghost';

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const borderBotH = useSharedValue(has3D ? 4 : 0);

  const outerAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  // Separate animated style for the 3D bottom border "shadow layer"
  const shadowAnim = useAnimatedStyle(() => ({
    height: borderBotH.value,
  }));

  const handlePressIn = useCallback(() => {
    if (isDisabled) return;
    scale.value = withTiming(0.97, { duration: 80 });
    translateY.value = withTiming(2, { duration: 80 });
    borderBotH.value = withTiming(1, { duration: 80 });
  }, [isDisabled]);

  const handlePressOut = useCallback(() => {
    if (isDisabled) return;
    scale.value = withTiming(1, { duration: 120 });
    translateY.value = withTiming(0, { duration: 120 });
    borderBotH.value = withTiming(has3D ? 4 : 0, { duration: 120 });
  }, [isDisabled, has3D]);

  const height = isSmall ? 40 : 52;
  const paddingH = isSmall ? spacing.lg : spacing.xxl;
  const fontSize = isSmall ? 14 : 16;

  return (
    <Animated.View style={[outerAnim, style]}>
      <Pressable
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.base,
          {
            backgroundColor: v.bg,
            borderRadius: radius.md,
            height,
            paddingHorizontal: paddingH,
            borderWidth: effectiveVariant === 'ghost' ? 1.5 : 0,
            borderColor: effectiveVariant === 'ghost' ? v.border : undefined,
            overflow: 'hidden',
          },
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text
          style={[
            typography.bodyL,
            { color: v.text, fontSize, fontFamily: 'Baloo2_700Bold' },
          ]}
        >
          {label}
        </Text>
      </Pressable>
      {/* Animated 3D bottom shadow */}
      {has3D && (
        <Animated.View
          style={[
            styles.shadow3D,
            { backgroundColor: v.border, borderRadius: radius.md },
            shadowAnim,
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  shadow3D: {
    width: '100%',
    marginTop: 1,
  },
});
