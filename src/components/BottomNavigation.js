import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, SIZES } from '../utils/theme';

const BottomNavigation = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const route = useRoute();

  const navItems = [
    {
      id: 'Home',
      name: t('home'),
      icon: '🏠',
      screen: 'Home',
    },
    {
      id: 'Customers',
      name: t('customers'),
      icon: '👥',
      screen: 'CustomerList',
    },
    {
      id: 'Orders',
      name: t('orders'),
      icon: '📦',
      screen: 'OrderList',
    },
  ];

  const handleNavPress = (item) => {
    if (item.screen === 'AddCustomer') {
      navigation.navigate('AddCustomer');
    } else if (item.screen === 'CustomerList') {
      navigation.navigate('CustomerList');
    } else {
      navigation.navigate(item.screen);
    }
  };

  const isActive = (screenName) => {
    return route.name === screenName;
  };

  return (
    <View style={styles.container}>
      <View style={styles.navContainer}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.navItem,
              item.isSpecial && styles.navItem,
              isActive(item.screen) && styles.activeNavItem,
            ]}
            onPress={() => handleNavPress(item)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              item.isSpecial && styles.specialIconContainer,
            ]}>
              <Text style={[
                styles.navIcon,
                item.isSpecial && styles.specialNavIcon,
                isActive(item.screen) && styles.activeNavIcon,
              ]}>
                {item.icon}
              </Text>
            </View>
            <Text style={[
              styles.navLabel,
              item.isSpecial && styles.navLabel,
              isActive(item.screen) && styles.activeNavLabel,
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SIZES.shadow.lg,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SIZES.padding.md,
    paddingHorizontal: SIZES.padding.md,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding.xs,
    borderRadius: SIZES.radius.md,
    marginHorizontal: SIZES.padding.xs,
  },
  activeNavItem: {
    backgroundColor: COLORS.background,
  },
  iconContainer: {
    marginBottom: 2,
  },
  specialIconContainer: {
    marginBottom: 1,
  },
  navIcon: {
    fontSize: SIZES.large,
    color: COLORS.textLight,
  },
  specialNavIcon: {
    fontSize: SIZES.xlarge,
    color: COLORS.textWhite,
  },
  activeNavIcon: {
    color: COLORS.primary,
  },
  navLabel: {
    fontSize: SIZES.tiny,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  specialNavLabel: {
    fontSize: SIZES.tiny,
    color: COLORS.textWhite,
    fontWeight: '600',
    marginTop: 1,
  },
  activeNavLabel: {
    color: COLORS.primary,
  },
  specialNavItem: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.1 }],
    ...SIZES.shadow.md,
  },
  activeSpecialNavItem: {
    backgroundColor: COLORS.primaryDark,
  },
});

export default BottomNavigation;
