import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { orderAPI } from '../services/api';
import { garmentTypes, orderStatuses, getTranslatedMeasurements, measurementTranslations } from '../utils/measurements';
import { UPLOADS_URL } from '../utils/config';
import ScreenWrapper from '../components/ScreenWrapper';
import { useLanguage } from '../contexts/LanguageContext';

export default function OrderListScreen({ navigation, route }) {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Get filter from route params
  const { filter } = route.params || {};
  
  // Get translated measurements and order statuses
  const translatedMeasurements = getTranslatedMeasurements(t);
  const translatedOrderStatuses = translatedMeasurements.orderStatuses;

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderAPI.getOrders();
      
      // Apply filter if provided
      let filteredOrders = data;
      if (filter) {
        filteredOrders = data.filter(order => order.status === filter);
      }
      
      setOrders(filteredOrders);
    } catch (error) {
      Alert.alert(t('error'), error.error || t('failedToLoadOrders'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const data = await orderAPI.getOrders(searchQuery);
      
      // Apply filter if provided
      let filteredOrders = data;
      if (filter) {
        filteredOrders = data.filter(order => order.status === filter);
      }
      
      setOrders(filteredOrders);
    } catch (error) {
      Alert.alert(t('error'), error.error || t('failedToSearchOrders'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteOrder = (order) => {
    Alert.alert(
      t('deleteOrder'),
      t('deleteOrderConfirmation', { orderNumber: order.order_number }),
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderAPI.deleteOrder(order.id);
              Alert.alert(t('success'), t('orderDeletedSuccessfully'));
              loadOrders();
            } catch (error) {
              Alert.alert(t('error'), error.error || t('failedToDeleteOrder'));
            }
          },
        },
      ]
    );
  };

  const handleEditOrder = async (order) => {
    try {
      console.log('Edit order clicked:', order);
      
      // Fetch complete order data including measurements
      const completeOrder = await orderAPI.getOrderById(order.id);
      console.log('Complete order data:', completeOrder);
      
      // Ensure all required fields are present
      const orderToEdit = {
        ...completeOrder,
        // Ensure measurements is an array
        measurements: completeOrder.measurements || [],
        // Ensure garment_types is an array
        garment_types: Array.isArray(completeOrder.garment_types) ? completeOrder.garment_types : 
                     (completeOrder.garment_types ? [completeOrder.garment_types] : []),
      };
      
      console.log('Order to edit:', orderToEdit);
      navigation.navigate('AddOrder', { order: orderToEdit, isEdit: true });
    } catch (error) {
      console.error('Error fetching complete order:', error);
      Alert.alert(t('error'), 'Failed to load order data');
    }
  };

  const handleStatusUpdate = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      await orderAPI.updateOrder(selectedOrder.id, { status: newStatus });
      Alert.alert(t('success'), t('orderStatusUpdatedSuccessfully'));
      loadOrders(); // Reload orders to reflect the change
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (error) {
      Alert.alert(t('error'), error.error || t('failedToUpdateOrderStatus'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'in_progress': return '#3498db';
      case 'ready': return '#9b59b6';
      case 'delivered': return '#2ecc71';
      case 'completed': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusLabel = (status) => {
    const statusObj = translatedOrderStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
          <View style={styles.orderHeader}>
            <View style={styles.orderNumberContainer}>
              <Text style={styles.orderNumber}>{item.order_number}</Text>
              <Text style={[styles.statusText, { backgroundColor: getStatusColor(item.status) }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.amount}>₹{item.total_amount}</Text>
              <Text style={styles.balanceText}>{t('balance')}: ₹{item.balance_amount}</Text>
            </View>
          </View>
          
          <View style={styles.customerInfo}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{item.customer_name ? item.customer_name.charAt(0).toUpperCase() : 'C'}</Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{item.customer_name}</Text>
              <Text style={styles.customerContact}>📞 {item.contact_number || 'N/A'}</Text>
              <Text style={styles.customerNumber}>Customer #: {item.customer_number}</Text>
            </View>
          </View>
          
          <View style={styles.orderDates}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>{t('orderDate')}</Text>
              <Text style={styles.dateValue}>{item.order_date}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>{t('deliveryDate')}</Text>
              <Text style={styles.dateValue}>{item.delivery_date}</Text>
            </View>
          </View>
          
          {item.garment_types && item.garment_types.length > 0 && (
            <View style={styles.garmentTags}>
              {item.garment_types.map((garment, index) => (
                <View key={index} style={styles.garmentTag}>
                  <Text style={styles.garmentTagText}>{garment}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Design Image Thumbnail */}
          {item.design_image && (
            <View style={styles.imageThumbnailContainer}>
              <Image 
                source={{ uri: `${UPLOADS_URL}/${item.design_image}` }} 
                style={styles.imageThumbnail}
                resizeMode="cover"
              />
              <Text style={styles.imageThumbnailText}>{t('designImage')}</Text>
            </View>
          )}
          
          {/* Key Measurements Preview */}
          {item.measurements && Array.isArray(item.measurements) && item.measurements.length > 0 && (
            <View style={styles.measurementsPreview}>
              <Text style={styles.measurementsPreviewTitle}>{t('measurements')}:</Text>
              <View style={styles.measurementsList}>
                {item.measurements.slice(0, 3).map((measurement, index) => {
                  if (!measurement || !measurement.measurement_type) return null;
                  
                  // Get the translated measurement label
                  const getTranslatedMeasurementLabel = (measurementType) => {
                    // Find the measurement in any garment type
                    for (const garmentType of Object.values(garmentTypes)) {
                      const foundMeasurement = garmentType.measurements.find(
                        m => m.id === measurementType
                      );
                      if (foundMeasurement) {
                        // Translate the label
                        const translationKey = measurementTranslations[foundMeasurement.label];
                        const translatedText = translationKey ? t(translationKey) : foundMeasurement.label;
                        return translatedText;
                      }
                    }
                    
                    // Fallback - use measurement type directly
                    return String(measurementType).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  };
                  
                  const translatedLabel = getTranslatedMeasurementLabel(measurement.measurement_type);
                  
                  return (
                    <View key={index} style={styles.measurementPreviewItem}>
                      <Text style={styles.measurementPreviewLabel}>
                        {translatedLabel}
                      </Text>
                      <Text style={styles.measurementPreviewValue}>
                        {measurement.value} {measurement.unit || 'inch'}
                      </Text>
                    </View>
                  );
                })}
                {item.measurements.length > 3 && (
                  <Text style={styles.moreMeasurementsText}>+{item.measurements.length - 3} more</Text>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.orderActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditOrder(item)}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.statusButton]}
            onPress={() => handleStatusUpdate(item)}
          >
            <Text style={styles.statusButtonText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteOrder(item)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenWrapper showBottomNav={true}>
      <View style={styles.container}>
        {/* Filter Indicator */}
        {filter && (
          <View style={styles.filterIndicator}>
            <Text style={styles.filterText}>
              {t('showing')}: {t(filter)} {t('orders')}
            </Text>
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => navigation.setParams({ filter: null })}
            >
              <Text style={styles.clearFilterText}>{t('clearFilter')}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchByOrderNumber')}
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
              <ActivityIndicator color="#fff" size="small" />
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
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {filter ? t('noFilteredOrders', { status: t(filter) }) : t('noOrders')}
                </Text>
                <TouchableOpacity
                  style={styles.addOrderButton}
                  onPress={() => navigation.navigate('AddCustomer')}
                >
                  <Text style={styles.addOrderButtonText}>{t('addOrder')}</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('AddOrder')}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('updateStatus')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.orderInfo}>
              {t('order')}: {selectedOrder?.order_number}
            </Text>
            <Text style={styles.currentStatus}>
              {t('currentStatus')}: {selectedOrder ? getStatusLabel(selectedOrder.status) : ''}
            </Text>
            
            <View style={styles.statusGrid}>
              {translatedOrderStatuses.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusOption,
                    selectedOrder?.status === status.value && styles.selectedStatus,
                    { backgroundColor: selectedOrder?.status === status.value ? getStatusColor(status.value) : '#f8f9fa' }
                  ]}
                  onPress={() => updateOrderStatus(status.value)}
                >
                  <Text style={[
                    styles.statusOptionText,
                    selectedOrder?.status === status.value && styles.selectedStatusText
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  filterIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2196f3',
    borderRadius: 16,
  },
  
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  orderItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumberContainer: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 2,
  },
  balanceText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '500',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customerAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  customerContact: {
    fontSize: 12,
    color: '#27ae60',
    marginBottom: 1,
  },
  customerNumber: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  orderDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: '#f1f3f4',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  garmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  garmentTag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  garmentTagText: {
    fontSize: 11,
    color: '#27ae60',
    fontWeight: '500',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  statusButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
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
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  addOrderButtonText: {
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
    backgroundColor: '#27ae60',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  orderInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  currentStatus: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusOption: {
    width: '48%',
    margin: '1%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
  },
  selectedStatus: {
    elevation: 3,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2c3e50',
  },
  selectedStatusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Image thumbnail styles
  imageThumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  imageThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
  },
  imageThumbnailText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Measurements preview styles
  measurementsPreview: {
    marginBottom: 10,
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 6,
  },
  measurementsPreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  measurementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  measurementPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  measurementPreviewLabel: {
    fontSize: 10,
    color: '#666',
    marginRight: 4,
  },
  measurementPreviewValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  moreMeasurementsText: {
    fontSize: 10,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginLeft: 4,
  },
});
