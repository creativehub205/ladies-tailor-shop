import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';

const QuickActions = ({ visible = true }) => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleAnim]);

  const handleQuickAddCustomer = () => {
    navigation.navigate('AddCustomer');
  };

  const handleQuickAddOrder = () => {
    navigation.navigate('CustomerList');
  };

  const handleViewOrders = () => {
    navigation.navigate('OrderList');
  };

  const handleViewCustomers = () => {
    navigation.navigate('CustomerList');
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Main FAB */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity style={styles.mainFab} onPress={() => {}}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Action Buttons */}
      <Animated.View style={[styles.quickActions, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.customerButton]} 
          onPress={handleQuickAddCustomer}
        >
          <Text style={styles.actionButtonText}>👤 {t('addCustomer')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.orderButton]} 
          onPress={handleQuickAddOrder}
        >
          <Text style={styles.actionButtonText}>📋 {t('addOrder')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]} 
          onPress={handleViewOrders}
        >
          <Text style={styles.actionButtonText}>📦 {t('viewOrders')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.listButton]} 
          onPress={handleViewCustomers}
        >
          <Text style={styles.actionButtonText}>👥 {t('customers')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  fabContainer: {
    marginBottom: 10,
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  quickActions: {
    position: 'absolute',
    bottom: 70,
    right: 0,
  },
  actionButton: {
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 160,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  customerButton: {
    backgroundColor: '#e74c3c',
  },
  orderButton: {
    backgroundColor: '#2ecc71',
  },
  viewButton: {
    backgroundColor: '#f39c12',
  },
  listButton: {
    backgroundColor: '#9b59b6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QuickActions;
