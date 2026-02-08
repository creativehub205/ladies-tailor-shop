import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { orderAPI } from '../services/api';
import { garmentTypes, orderStatuses, getTranslatedMeasurements, additionalMeasurements, measurementTranslations } from '../utils/measurements';
import { UPLOADS_URL } from '../utils/config';
import ScreenWrapper from '../components/ScreenWrapper';
import { useLanguage } from '../contexts/LanguageContext';

export default function OrderDetailScreen({ route, navigation }) {
  const { t } = useLanguage();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);

  const { orderId } = route.params;
  
  // State for translated measurements to trigger re-renders
  const [translatedOrderStatuses, setTranslatedOrderStatuses] = useState([]);
  
  // Update translated measurements when language changes
  useEffect(() => {
    const measurements = getTranslatedMeasurements(t);
    setTranslatedOrderStatuses(measurements.orderStatuses);
  }, [t]);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const response = await orderAPI.getOrderById(orderId);
      setOrder(response);
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert(t('error'), t('failedToLoadOrderDetails'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      in_progress: '#3498db',
      ready: '#27ae60',
      delivered: '#6c757d',
      cancelled: '#dc3545',
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusLabel = (status) => {
    const statusObj = translatedOrderStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await orderAPI.updateOrder(order.id, { status: newStatus });
      setOrder(prev => ({ ...prev, status: newStatus }));
      Alert.alert(t('success'), t('orderStatusUpdatedSuccessfully'));
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert(t('error'), t('failedToUpdateOrderStatus'));
    }
  };

  const handleDeleteOrder = () => {
    Alert.alert(
      t('confirm'),
      t('confirmDeleteOrder'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await orderAPI.deleteOrder(order.id);
              Alert.alert(t('success'), t('orderDeletedSuccessfully'));
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting order:', error);
              Alert.alert(t('error'), t('failedToDeleteOrder'));
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenWrapper showBottomNav={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!order) {
    return (
      <ScreenWrapper showBottomNav={true}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper showBottomNav={true}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
          </View>
        </View>

        <View style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{order.customer_name ? order.customer_name.charAt(0).toUpperCase() : 'C'}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.customer_name}</Text>
              <Text style={styles.customerContact}>📞 {order.contact_number || 'N/A'}</Text>
              <Text style={styles.customerNumber}>Customer #: {order.customer_number}</Text>
              {order.address && (
                <Text style={styles.customerAddress}>📍 {order.address}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('orderDetails')}</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('garmentTypes')}</Text>
            <Text style={styles.infoValue}>
              {Array.isArray(order.garment_types) ? order.garment_types.join(', ') : order.garment_types || 'N/A'}
            </Text>
            
            <Text style={styles.infoLabel}>{t('orderDate')}</Text>
            <Text style={styles.infoValue}>{new Date(order.order_date).toLocaleDateString()}</Text>
            
            <Text style={styles.infoLabel}>{t('deliveryDate')}</Text>
            <Text style={styles.infoValue}>
              {order.delivery_date || 'Not set'}
            </Text>
            
            {order.notes && (
              <>
                <Text style={styles.infoLabel}>{t('notes')}</Text>
                <Text style={styles.infoValue}>{order.notes}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('paymentInformation')}</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{t('totalAmount')}:</Text>
              <Text style={styles.paymentAmount}>₹{order.total_amount}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{t('advanceAmount')}:</Text>
              <Text style={styles.advanceAmount}>₹{order.advance_amount}</Text>
            </View>
            <View style={[styles.paymentRow, styles.borderTop]}>
              <Text style={styles.paymentLabel}>{t('balanceAmount')}:</Text>
              <Text style={styles.balanceAmount}>₹{order.balance_amount}</Text>
            </View>
          </View>
        </View>

        {order.design_image && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('designImage')}</Text>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => {
                setModalImageUri(`${UPLOADS_URL}/${order.design_image}`);
                setShowImageModal(true);
              }}
            >
              <Image 
                source={{ uri: `${UPLOADS_URL}/${order.design_image}` }} 
                style={styles.designImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageOverlayText}>🔍 {t('viewFullScreen')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {order?.measurements && Array.isArray(order.measurements) && order.measurements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('measurements')}</Text>
            <View style={styles.measurementsCard}>
              {order.measurements.map((measurement, index) => {
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
                  
                  // Fallback for additional measurements
                  const additionalMeasurement = additionalMeasurements.find(
                    m => m.id === measurementType
                  );
                  if (additionalMeasurement) {
                    const translationKey = measurementTranslations[additionalMeasurement.label];
                    return translationKey ? t(translationKey) : additionalMeasurement.label;
                  }
                  
                  // Final fallback
                  return String(measurementType).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                };
                
                const translatedLabel = getTranslatedMeasurementLabel(measurement.measurement_type);
                
                return (
                  <View key={index} style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>
                      {translatedLabel}
                    </Text>
                    <Text style={styles.measurementValue}>
                      {measurement.value || ''} {measurement.unit || 'inch'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('updateStatus')}</Text>
          <View style={styles.statusContainer}>
            {translatedOrderStatuses.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusButton,
                  order.status === status.value && styles.selectedStatus,
                  { backgroundColor: order.status === status.value ? getStatusColor(status.value) : '#fff' }
                ]}
                onPress={() => handleStatusUpdate(status.value)}
              >
                <Text style={[
                  styles.statusButtonText,
                  order.status === status.value && styles.selectedStatusText
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddOrder', { 
              customer: {
                id: order.customer_id,
                name: order.customer_name,
                contact_number: order.contact_number,
                customer_number: order.customer_number
              },
              order: order
            })}
          >
            <Text style={styles.actionButtonText}>{t('editOrder')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteOrder}
          >
            <Text style={styles.deleteButtonText}>{t('deleteOrder')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Full Screen Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalContent}>
              <Image
                source={{ uri: modalImageUri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImageModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  customerCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  customerAvatarText: {
    fontSize: 24,
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
    marginBottom: 5,
  },
  customerContact: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 3,
  },
  customerNumber: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 3,
  },
  customerAddress: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 15,
  },
  paymentCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  advanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  imageContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  designImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height - 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  measurementsCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  measurementLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  measurementValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedStatus: {
    borderWidth: 0,
  },
  statusButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  selectedStatusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    margin: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
