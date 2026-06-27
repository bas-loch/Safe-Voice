import React, { useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, shadows } from '../../theme/tokens';

interface Props {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  cardStyle?: ViewStyle;
  dismissOnBackdrop?: boolean;
}

export const GameModal: React.FC<Props> = ({
  visible,
  onClose,
  children,
  cardStyle,
  dismissOnBackdrop = true,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 18, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.85, { duration: 150 });
    }
  }, [visible]);

  const cardStyle_ = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={dismissOnBackdrop ? onClose : undefined}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.card, shadows.e3, cardStyle_, cardStyle]}>
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
});
