import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '../../utils/theme';

export const Input = ({
  label = null,
  value = '',
  onChangeText = null,
  placeholder = '',
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  error = null,
  helperText = null,
  leftIcon = null,
  rightIcon = null,
  onRightIconPress = null,
  style = null,
  inputStyle = null,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  ...props
}) => {
  const getInputStyles = () => {
    const baseStyle = [styles.input];
    
    if (error) {
      baseStyle.push(styles.inputError);
    }
    
    if (leftIcon) {
      baseStyle.push(styles.inputWithLeftIcon);
    }
    
    if (rightIcon) {
      baseStyle.push(styles.inputWithRightIcon);
    }
    
    if (!editable) {
      baseStyle.push(styles.inputDisabled);
    }
    
    if (inputStyle) {
      baseStyle.push(inputStyle);
    }
    
    return baseStyle;
  };

  const getContainerStyles = () => {
    const baseStyle = [styles.container];
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  return (
    <View style={getContainerStyles()}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={getInputStyles()}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLighter}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.padding.md,
  },
  
  label: {
    fontSize: SIZES.medium,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.padding.xs,
  },
  
  labelError: {
    color: COLORS.error,
  },
  
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.padding.md,
    fontSize: SIZES.medium,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  
  inputError: {
    borderColor: COLORS.error,
  },
  
  inputWithLeftIcon: {
    paddingLeft: 48,
  },
  
  inputWithRightIcon: {
    paddingRight: 48,
  },
  
  inputDisabled: {
    backgroundColor: COLORS.background,
    color: COLORS.textLight,
  },
  
  leftIcon: {
    position: 'absolute',
    left: SIZES.padding.md,
    zIndex: 1,
  },
  
  rightIcon: {
    position: 'absolute',
    right: SIZES.padding.md,
    zIndex: 1,
  },
  
  helperText: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    marginTop: SIZES.padding.xs,
  },
  
  errorText: {
    color: COLORS.error,
  },
});
