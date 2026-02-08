import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { orderAPI } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { useLanguage } from '../contexts/LanguageContext';

const CustomerOrdersScreen = ({ route, navigation }) => {
  const { t } = useLanguage();
  const { customer } = route.params;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: `${customer.name}'s ${t('orders')}`,
      headerStyle: { backgroundColor: '#2c3e50' },
      headerTintColor: '#fff',
    });
    loadCustomerOrders();
  }, [customer, navigation]);

  const loadCustomerOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrders();
      // Filter orders for this specific customer
      const customerOrders = response.filter(order => order.customer_id === customer.id);
      setOrders(customerOrders);
      setError(null);
    } catch (error) {
      console.error('Error loading customer orders:', error);
      setError(t('failedToLoadOrdersError'));
    } finally {
      setLoading(false);
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderInfo}>
        <Text style={styles.orderNumber}>{item.order_number}</Text>
        <Text style={styles.orderDate}>{t('orderDate')}: {item.order_date}</Text>
        <Text style={styles.deliveryDate}>{t('deliveryDate')}: {item.delivery_date}</Text>
        <Text style={styles.amount}>₹{item.total_amount}</Text>
      </View>
      <View style={styles.orderStatus}>
        <Text style={[
          styles.statusText,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#f39c12';
      case 'in progress': return '#3498db';
      case 'completed': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>{t('loading')} {t('orders')}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCustomerOrders}>
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScreenWrapper showBottomNav={true}>
      <View style={styles.container}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerContact}>📞 {customer.contact_number || t('nA')}</Text>
          <Text style={styles.orderCount}>{t('totalOrders')}: {orders.length}</Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noOrdersFound')}</Text>
            <TouchableOpacity
              style={styles.createOrderButton}
              onPress={() => navigation.navigate('AddOrder', { customer })}
            >
              <Text style={styles.createOrderButtonText}>{t('addOrder')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.orderItem}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>{item.order_number}</Text>
                  <Text style={styles.orderDate}>{t('orderDate')}: {item.order_date}</Text>
                  <Text style={styles.deliveryDate}>{t('deliveryDate')}: {item.delivery_date || 'Not set'}</Text>
                  <Text style={styles.amount}>₹{item.total_amount}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  customerContact: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  orderCount: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 10,
  },
  orderItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 3,
  },
  orderDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  deliveryDate: {
    fontSize: 12,
    color: '#f39c12',
    marginBottom: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  addOrderButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default CustomerOrdersScreen;
