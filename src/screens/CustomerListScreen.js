import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { customerAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import ScreenWrapper from '../components/ScreenWrapper';

export default function CustomerListScreen({ navigation, route }) {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Get selection mode from route params
  const { mode, returnScreen } = route.params || {};
  const isSelectionMode = mode === 'select';

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await customerAPI.getCustomers();
      setCustomers(data);
    } catch (error) {
      Alert.alert(t('error'), error.error || t('failedToLoadCustomers'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const data = await customerAPI.getCustomers(searchQuery);
      setCustomers(data);
    } catch (error) {
      Alert.alert(t('error'), error.error || t('failedToSearchCustomers'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteCustomer = (customer) => {
    Alert.alert(
      t('deleteCustomer'),
      t('deleteCustomerConfirmation', { customerName: customer.name }),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await customerAPI.deleteCustomer(customer.id);
              Alert.alert(t('success'), t('customerDeletedSuccessfully'));
              loadCustomers();
            } catch (error) {
              Alert.alert(t('error'), error.error || t('failedToDeleteCustomer'));
            }
          },
        },
      ]
    );
  };

  const handleEditCustomer = (customer) => {
    navigation.navigate('AddCustomer', { customer, isEdit: true });
  };

  const handleSelectCustomer = (customer) => {
    if (isSelectionMode) {
      // Use navigation params to pass selected customer back
      navigation.navigate(returnScreen || 'AddOrder', { selectedCustomer: customer });
    }
  };

  const renderCustomerItem = ({ item }) => (
    <View style={styles.customerItem}>
      <View style={styles.customerCard}>
        <View style={styles.customerHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.customerNumber}>{t('customerNumber')} {item.customer_number}</Text>
            <Text style={styles.customerContact}>📞 {item.contact_number || t('nA')}</Text>
            {item.address && (
              <Text style={styles.customerAddress}>📍 {item.address}</Text>
            )}
          </View>
        </View>
        <View style={styles.customerActions}>
          {isSelectionMode ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.selectButton]}
              onPress={() => handleSelectCustomer(item)}
            >
              <Text style={styles.selectButtonText}>✓ {t('select')}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.addButton]}
                onPress={() => navigation.navigate('AddOrder', { customer: item })}
              >
                <Text style={styles.addButtonText}>+ {t('order')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => navigation.navigate('CustomerOrders', { customer: item })}
              >
                <Text style={styles.viewButtonText}>{t('viewOrders')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditCustomer(item)}
              >
                <Text style={styles.editButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteCustomer(item)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScreenWrapper showBottomNav={true}>
      <View style={styles.container}>
        {/* Header */}
        {isSelectionMode && (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {t('selectCustomer')}
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchNameOrContact')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <Text style={styles.searchButtonText}>{t('loading')}</Text>
            ) : (
              <Text style={styles.searchButtonText}>{t('search')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : (
          <FlatList
            data={customers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('noCustomersFound')}</Text>
                <TouchableOpacity
                  style={styles.addCustomerButton}
                  onPress={() => navigation.navigate('AddCustomer')}
                >
                  <Text style={styles.addCustomerButtonText}>{t('addCustomer')}</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('AddCustomer')}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    placeholderTextColor: '#999',
  },
  searchButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  customerItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  customerNumber: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 2,
    fontWeight: '500',
  },
  customerContact: {
    fontSize: 14,
    color: '#27ae60',
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: 13,
    color: '#e67e22',
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 45,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addButton: {
    backgroundColor: '#27ae60',
  },
  viewButton: {
    backgroundColor: '#f39c12',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
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
  addCustomerButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  addCustomerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e74c3c',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Selection mode styles
  selectButton: {
    backgroundColor: '#27ae60',
    flex: 1,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
