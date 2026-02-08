import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '../../utils/theme';

export const Card = ({
  children,
  style = null,
  onPress = null,
  variant = 'default',
  padding = 'md',
  margin = 'none',
  ...props
}) => {
  const getCardStyles = () => {
    const baseStyle = [styles.card];
    
    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyle.push(styles.elevated);
        break;
      case 'outlined':
        baseStyle.push(styles.outlined);
        break;
      case 'filled':
        baseStyle.push(styles.filled);
        break;
      default:
        baseStyle.push(styles.default);
    }
    
    // Padding styles
    switch (padding) {
      case 'sm':
        baseStyle.push({ padding: SIZES.padding.sm });
        break;
      case 'md':
        baseStyle.push({ padding: SIZES.padding.md });
        break;
      case 'lg':
        baseStyle.push({ padding: SIZES.padding.lg });
        break;
      case 'xl':
        baseStyle.push({ padding: SIZES.padding.xl });
        break;
      case 'none':
        baseStyle.push({ padding: 0 });
        break;
      default:
        baseStyle.push({ padding: SIZES.padding.md });
    }
    
    // Margin styles
    switch (margin) {
      case 'sm':
        baseStyle.push({ margin: SIZES.padding.sm });
        break;
      case 'md':
        baseStyle.push({ margin: SIZES.padding.md });
        break;
      case 'lg':
        baseStyle.push({ margin: SIZES.padding.lg });
        break;
      case 'xl':
        baseStyle.push({ margin: SIZES.padding.xl });
        break;
      case 'none':
        baseStyle.push({ margin: 0 });
        break;
      default:
        baseStyle.push({ margin: 0 });
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      style={getCardStyles()}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.surface,
  },
  
  // Variants
  default: {
    ...SIZES.shadow.sm,
  },
  elevated: {
    ...SIZES.shadow.lg,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filled: {
    backgroundColor: COLORS.background,
  },
});
