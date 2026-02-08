import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { orderAPI } from '../services/api';
import { garmentTypes, orderStatuses, generalMeasurements, additionalMeasurements, getTranslatedMeasurements, measurementTranslations } from '../utils/measurements';
import { UPLOADS_URL } from '../utils/config';
import DatePicker from '../components/DatePicker';
import MultiSelectGarmentTypes from '../components/MultiSelectGarmentTypes';
import ScreenWrapper from '../components/ScreenWrapper';
import { useLanguage } from '../contexts/LanguageContext';

export default function AddOrderScreen({ navigation, route }) {
  const { t } = useLanguage();
  const [orderData, setOrderData] = useState({
    customer_id: '',
    garment_types: [],
    delivery_date: '',
    notes: '',
    total_amount: '',
    advance_amount: '',
    status: 'pending',
  });
  const [measurements, setMeasurements] = useState({});
  const [additionalMeasurementsData, setAdditionalMeasurementsData] = useState({});
  const [designImage, setDesignImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [areMeasurementsLoading, setAreMeasurementsLoading] = useState(false);
  const [showAdditionalMeasurements, setShowAdditionalMeasurements] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // State for translated measurements to trigger re-renders
  const [translatedGarmentTypes, setTranslatedGarmentTypes] = useState({});
  const [translatedAdditionalMeasurements, setTranslatedAdditionalMeasurements] = useState([]);
  const [translatedOrderStatuses, setTranslatedOrderStatuses] = useState([]);
  
  // Update translated measurements when language changes
  useEffect(() => {
    const measurements = getTranslatedMeasurements(t);
    setTranslatedGarmentTypes(measurements.garmentTypes);
    setTranslatedAdditionalMeasurements(measurements.additionalMeasurements);
    setTranslatedOrderStatuses(measurements.orderStatuses);
  }, [t]);

  // Handle selected customer from CustomerListScreen
  useEffect(() => {
    if (route.params?.selectedCustomer) {
      setOrderData(prev => ({ ...prev, customer_id: route.params.selectedCustomer.id }));
      // Clear the params to avoid re-processing
      navigation.setParams({ selectedCustomer: undefined });
    }
  }, [route.params?.selectedCustomer, navigation]);

  // Debug designImage state changes
  useEffect(() => {
    // Image state change logged for debugging
  }, [designImage]);
  
  // Refs for auto-focus
  const totalAmountRef = useRef(null);
  const advanceAmountRef = useRef(null);
  const notesRef = useRef(null);
  
  // Dynamic refs for measurement fields
  const measurementRefs = useRef({});

  const { customer, order } = route.params || {};
  const isEdit = !!order;

  useEffect(() => {
    const loadOrderData = async () => {
      if (customer) {
        setOrderData(prev => ({ ...prev, customer_id: customer.id.toString() }));
      }
      if (order) {
        // Ensure garment_types is always an array
        const garmentTypes = Array.isArray(order.garment_types) 
          ? order.garment_types 
          : (order.garment_types ? [order.garment_types] : []);
        
        setOrderData({
          customer_id: order.customer_id?.toString() || '',
          garment_types: garmentTypes,
          delivery_date: order.delivery_date || '',
          notes: order.notes || '',
          total_amount: order.total_amount?.toString() || '',
          advance_amount: order.advance_amount?.toString() || '',
          status: order.status || 'pending',
        });
        
        if (order.design_image) {
          const imageUrl = `${UPLOADS_URL}/${order.design_image}`;
          setDesignImage(imageUrl);
          // Force a re-render after setting image
          setTimeout(() => {
            setForceUpdate(prev => prev + 1);
          }, 100);
        }
      }
    };
    
    loadOrderData();
  }, [customer, order]);

  // Load measurements after order data and translations are available
  useEffect(() => {
    if (order && Object.keys(translatedGarmentTypes).length > 0) {
      // Load existing measurements
      if (order.measurements && Array.isArray(order.measurements)) {
        setAreMeasurementsLoading(true);
        const measurementsData = {};
        const additionalMeasurementsData = {};
        
        order.measurements.forEach(measurement => {
          if (measurement && measurement.measurement_type) {
            if (measurement.garment_type === 'additional' || measurement.garment_type === 'other') {
              additionalMeasurementsData[measurement.measurement_type] = measurement.value;
            } else {
              measurementsData[measurement.measurement_type] = measurement.value;
            }
          }
        });
        
        // Set measurements state with a delay to ensure it's not overridden
        setTimeout(() => {
          setMeasurements(measurementsData);
          setAdditionalMeasurementsData(additionalMeasurementsData);
          setAreMeasurementsLoading(false);
          setForceUpdate(prev => prev + 1);
        }, 50);
      }
    }
  }, [order, translatedGarmentTypes]);

  // Debug: Log when measurements state changes
  useEffect(() => {
    // Measurements state change logged for debugging
  }, [measurements]);

  // Debug: Log when orderData.garment_types changes
  useEffect(() => {
    // Don't clear measurements if garment types are same during edit
    if (order && order.measurements && Array.isArray(order.measurements) && orderData.garment_types.length > 0) {
      // Preserving existing measurements as garment types are loaded for edit
      return; // Don't do anything if we have order data and garment types
    }
    if (!order && orderData.garment_types.length > 0) {
      // Only clear measurements for new orders when garment types change
      setMeasurements({});
      setAdditionalMeasurementsData({});
    }
  }, [orderData.garment_types]);

  const updateField = (field, value) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const updateMeasurement = (measurementId, value) => {
    // Update measurements state for garment-based measurements
    setMeasurements(prev => {
      const newMeasurements = { ...prev, [measurementId]: value };
      // Force re-render
      setForceUpdate(prev => prev + 1);
      return newMeasurements;
    });
    
    // Also update order.measurements if it exists (for edit mode)
    if (order && order.measurements) {
      const updatedMeasurements = order.measurements.map(m => 
        m.measurement_type === measurementId ? { ...m, value: value } : m
      );
      // Update the order object reference
      order.measurements = updatedMeasurements;
    }
  };

  const updateAdditionalMeasurement = (measurementId, value) => {
    setAdditionalMeasurementsData(prev => ({ ...prev, [measurementId]: value }));
  };

  // Get all measurement fields in order for auto-focus
  const getAllMeasurementFields = () => {
    const fields = [];
    
    // Add order measurements (existing)
    if (order && order.measurements && Array.isArray(order.measurements)) {
      order.measurements.forEach((measurement, index) => {
        if (measurement && measurement.measurement_type) {
          fields.push({
            id: measurement.measurement_type,
            ref: `order_${measurement.measurement_type}`,
            type: 'order'
          });
        }
      });
    }
    
    // Add garment measurements
    orderData.garment_types.forEach(garmentType => {
      const garment = translatedGarmentTypes[garmentType];
      if (garment && garment.measurements) {
        garment.measurements.forEach(measurement => {
          fields.push({
            id: measurement.id,
            ref: `garment_${measurement.id}`,
            type: 'garment'
          });
        });
      }
    });
    
    // Add additional measurements
    if (showAdditionalMeasurements) {
      translatedAdditionalMeasurements.forEach(measurement => {
        fields.push({
          id: measurement.id,
          ref: `additional_${measurement.id}`,
          type: 'additional'
        });
      });
    }
    
    return fields;
  };

  // Get next measurement field to focus
  const getNextMeasurementField = (currentId) => {
    const fields = getAllMeasurementFields();
    const currentIndex = fields.findIndex(f => f.id === currentId);
    if (currentIndex < fields.length - 1) {
      const nextField = fields[currentIndex + 1];
      return measurementRefs.current[nextField.ref];
    }
    return null;
  };

  const pickImage = async (source) => {
    try {
      console.log(`Starting image picker from ${source}...`);
      
      let result;
      
      if (source === 'camera') {
        // Request camera permissions
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        
        if (!permissionResult.granted) {
          console.log('Camera permissions not granted');
          Alert.alert(
            t('permissionRequired'),
            t('cameraPermission'),
            [{ text: t('ok') }]
          );
          return;
        }
        
        console.log('Camera permissions granted, launching camera...');
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      } else {
        // Request media library permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (!permissionResult.granted) {
          console.log('Media library permissions not granted');
          Alert.alert(
            t('permissionRequired'),
            t('cameraRollPermission'),
            [{ text: t('ok') }]
          );
          return;
        }
        
        console.log('Media library permissions granted, launching image library...');
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      }

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Image selected:', result.assets[0].uri);
        console.log('Image asset details:', result.assets[0]);
        
        const imageUri = result.assets[0].uri;
        setDesignImage(imageUri);
        console.log('designImage state updated to:', imageUri);
      } else {
        console.log('Image selection cancelled or failed');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('error'), t('failedToPickImage'));
    }
  };

  const showImagePickerOptions = () => {
    setShowImagePickerModal(true);
  };

  const handleSaveOrder = async () => {
    if (!orderData.customer_id) {
      Alert.alert(t('error'), t('customerRequired'));
      return;
    }

    if (orderData.garment_types.length === 0) {
      Alert.alert(t('error'), t('garmentTypesRequired'));
      return;
    }

    if (!orderData.total_amount) {
      Alert.alert(t('error'), t('totalAmountRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      // Append order data
      Object.keys(orderData).forEach(key => {
        if (key !== 'design_image') {
          formData.append(key, orderData[key]);
        }
      });

      // Append measurements
      const allMeasurements = [];
      
      // Add garment measurements
      orderData.garment_types.forEach(garmentType => {
        const garment = translatedGarmentTypes[garmentType];
        if (garment && garment.measurements) {
          garment.measurements.forEach(measurement => {
            if (measurements[measurement.id]) {
              allMeasurements.push({
                measurement_type: measurement.id, // Use ID instead of translated label
                value: measurements[measurement.id],
                unit: measurement.unit,
                garment_type: garmentType
              });
            }
          });
        }
      });

      // Add additional measurements
      Object.keys(additionalMeasurementsData).forEach(measurementId => {
        const measurement = translatedAdditionalMeasurements.find(m => m.id === measurementId);
        if (measurement && additionalMeasurementsData[measurementId]) {
          allMeasurements.push({
            measurement_type: measurement.id, // Use ID instead of translated label
            value: additionalMeasurementsData[measurementId],
            unit: measurement.unit,
            garment_type: 'additional'
          });
        }
      });

      // Prepare order data with proper customer_id format
      const orderDataToSave = {
        ...orderData,
        customer_id: parseInt(orderData.customer_id), // Ensure customer_id is a number
        garment_types: orderData.garment_types,
        measurements: allMeasurements,
        delivery_date: orderData.delivery_date,
        notes: orderData.notes,
        total_amount: parseFloat(orderData.total_amount) || 0,
        advance_amount: parseFloat(orderData.advance_amount) || 0,
        status: orderData.status
      };

      console.log('Saving order with data:', orderDataToSave);
      console.log('Image URI type:', typeof designImage);

      let response;
      if (isEdit) {
        response = await orderAPI.updateOrder(order.id, orderDataToSave, designImage);
      } else {
        response = await orderAPI.createOrder(orderDataToSave, designImage);
      }

      Alert.alert(
        t('success'),
        isEdit ? t('orderUpdatedSuccessfully') : t('orderCreatedSuccessfully'),
        [
          {
            text: t('ok'),
            onPress: () => navigation.navigate('OrderList')
          }
        ]
      );
    } catch (error) {
      console.error('Order save error:', error);
      const errorMessage = error.response?.data?.message || error.message || (isEdit ? t('failedToUpdateOrder') : t('failedToCreateOrder'));
      Alert.alert(t('error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper showBottomNav={true}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>{isEdit ? t('editOrder') : t('createNewOrder')}</Text>
            
            {/* Customer Selection */}
            <Text style={styles.label}>{t('customerRequired')}</Text>
            <TouchableOpacity 
              style={styles.customerSelector}
              onPress={() => navigation.navigate('CustomerList', { 
                mode: 'select',
                returnScreen: 'AddOrder'
              })}
            >
              <Text style={styles.customerText}>
                {orderData.customer_id ? `${t('customerId')}: ${orderData.customer_id}` : t('selectCustomer')}
              </Text>
              <Text style={styles.selectCustomerIcon}>👤</Text>
            </TouchableOpacity>

            {/* Garment Types */}
            <MultiSelectGarmentTypes
              selectedValues={orderData.garment_types}
              onChange={(values) => {
                if (!isEdit) {
                  setOrderData(prev => ({ ...prev, garment_types: values }));
                }
              }}
            />

            {/* Measurements Section */}
            {areMeasurementsLoading ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('measurements')}</Text>
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>{t('loading')} {t('measurements')}...</Text>
                </View>
              </View>
            ) : (orderData.garment_types.length > 0 || (order && order.measurements && order.measurements.length > 0)) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('measurements')}</Text>
                
                {/* Display measurements directly from order data like OrderDetailScreen */}
                {order && order.measurements && Array.isArray(order.measurements) && order.measurements.length > 0 ? (
                  <View style={styles.measurementsCard}>
                    {order.measurements.map((measurement, index) => {
                      if (!measurement || !measurement.measurement_type) return null;
                      
                      // Get translated measurement label (same logic as OrderDetailScreen)
                      const getTranslatedMeasurementLabel = (measurementType) => {
                        // Find measurement in any garment type
                        for (const garmentType of Object.values(translatedGarmentTypes)) {
                          const foundMeasurement = garmentType.measurements?.find(
                            m => m.id === measurementType
                          );
                          if (foundMeasurement) {
                            // Translate label
                            const translationKey = measurementTranslations[foundMeasurement.label];
                            const translatedText = translationKey ? t(translationKey) : foundMeasurement.label;
                            return translatedText;
                          }
                        }
                        
                        // Fallback for additional measurements
                        const additionalMeasurement = translatedAdditionalMeasurements.find(
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
                        <View key={index} style={styles.measurementField}>
                          <Text style={styles.measurementLabel}>
                            {translatedLabel} ({measurement.unit || 'inch'})
                          </Text>
                          <TextInput
                            key={`${measurement.measurement_type}-${forceUpdate}`}
                            ref={(ref) => {
                              if (ref) measurementRefs.current[`order_${measurement.measurement_type}`] = ref;
                            }}
                            style={styles.measurementInput}
                            value={measurement.value ? String(measurement.value) : ''}
                            onChangeText={(value) => updateMeasurement(measurement.measurement_type, value)}
                            placeholder={t('enterMeasurementValue')}
                            keyboardType="numeric"
                            blurOnSubmit={false}
                            returnKeyType="next"
                            onSubmitEditing={() => {
                              const nextField = getNextMeasurementField(measurement.measurement_type);
                              if (nextField) {
                                nextField.focus();
                              } else {
                                totalAmountRef.current?.focus();
                              }
                            }}
                          />
                        </View>
                      );
                    })}
                  </View>
                ) : null}
                
                {/* Fallback to garment-based measurements if order measurements not available */}
                {(!order || !order.measurements || order.measurements.length === 0) && orderData.garment_types.length > 0 && (
                  orderData.garment_types.map(garmentType => {
                    const garment = translatedGarmentTypes[garmentType];
                    if (!garment || !garment.measurements) {
                      return null;
                    }
                    
                    return (
                      <View key={garmentType} style={styles.garmentMeasurementsCard}>
                        <Text style={styles.garmentTitle}>{garment.name}</Text>
                        {garment.measurements.map(measurement => {
                          const measurementValue = measurements[measurement.id] || '';
                          return (
                            <View key={measurement.id} style={styles.measurementField}>
                              <Text style={styles.measurementLabel}>
                                {measurement.label} ({measurement.unit})
                              </Text>
                              <TextInput
                                ref={(ref) => {
                                  if (ref) measurementRefs.current[`garment_${measurement.id}`] = ref;
                                }}
                                style={styles.measurementInput}
                                value={measurementValue}
                                onChangeText={(value) => updateMeasurement(measurement.id, value)}
                                placeholder={t('enterMeasurementValue')}
                                keyboardType="numeric"
                                blurOnSubmit={false}
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                  const nextField = getNextMeasurementField(measurement.id);
                                  if (nextField) {
                                    nextField.focus();
                                  } else {
                                    totalAmountRef.current?.focus();
                                  }
                                }}
                              />
                            </View>
                          );
                        })}
                      </View>
                    );
                  })
                )}

                <View style={styles.measurementsCard}>
                  <View style={styles.additionalMeasurementsHeader}>
                    <Text style={styles.measurementsSubtitle}>{t('additionalMeasurements')}</Text>
                    <TouchableOpacity 
                      onPress={() => setShowAdditionalMeasurements(!showAdditionalMeasurements)}
                      style={styles.toggleButton}
                    >
                      <Text style={styles.toggleButtonText}>
                        {showAdditionalMeasurements ? t('hide') : t('show')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {showAdditionalMeasurements && translatedAdditionalMeasurements.map(measurement => {
                    const additionalValue = additionalMeasurementsData[measurement.id] || '';
                    return (
                      <View key={measurement.id} style={styles.measurementField}>
                        <Text style={styles.measurementLabel}>
                          {measurement.label} {measurement.unit !== 'text' ? `(${measurement.unit})` : ''}
                        </Text>
                        <TextInput
                          key={`${measurement.id}`}
                          ref={(ref) => {
                            if (ref) measurementRefs.current[`additional_${measurement.id}`] = ref;
                          }}
                          style={styles.measurementInput}
                          value={additionalValue}
                          onChangeText={(value) => updateAdditionalMeasurement(measurement.id, value)}
                          placeholder={t('enterMeasurementValue')}
                          keyboardType={measurement.unit === 'text' ? 'default' : 'numeric'}
                          blurOnSubmit={false}
                          returnKeyType="next"
                          onSubmitEditing={() => {
                            const nextField = getNextMeasurementField(measurement.id);
                            if (nextField) {
                              nextField.focus();
                            } else {
                              totalAmountRef.current?.focus();
                            }
                          }}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Design Image */}
            {designImage ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('designImage')}</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={showImagePickerOptions}>
                  <View>
                    <View style={styles.previewImageContainer}>
                      <Image 
                        key={`design-image-${designImage}-${forceUpdate}`}
                        source={{ uri: designImage }} 
                        style={styles.previewImage}
                        resizeMode="cover"
                        onError={(error) => {
                          console.error('Image load error:', error);
                          console.error('Failed URI:', designImage);
                          Alert.alert(t('error'), t('failedToLoadDesignImage'));
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully from:', designImage);
                        }}
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.removeImageButton} 
                      onPress={() => {
                        setDesignImage(null);
                        setForceUpdate(prev => prev + 1);
                      }}
                    >
                      <Text style={styles.removeImageText}>{t('remove')}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            ) : order && order.design_image ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('designImage')}</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={showImagePickerOptions}>
                  <View>
                    <View style={styles.previewImageContainer}>
                      <Image 
                        key={`design-image-${order.design_image}-${forceUpdate}`}
                        source={{ uri: `${UPLOADS_URL}/${order.design_image}` }} 
                        style={styles.previewImage}
                        resizeMode="cover"
                        onError={(error) => {
                          console.error('Image load error:', error);
                          console.error('Failed URI:', `${UPLOADS_URL}/${order.design_image}`);
                          Alert.alert(t('error'), t('failedToLoadDesignImage'));
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully from:', `${UPLOADS_URL}/${order.design_image}`);
                        }}
                        onLayout={(event) => {
                          console.log('Image layout:', event.nativeEvent.layout);
                        }}
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.removeImageButton} 
                      onPress={() => {
                        setDesignImage(null);
                        setForceUpdate(prev => prev + 1);
                      }}
                    >
                      <Text style={styles.removeImageText}>{t('remove')}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('designImage')}</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={showImagePickerOptions}>
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>
                      {t('addDesignImage')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Delivery Date */}
            <Text style={styles.label}>{t('deliveryDate')}</Text>
            <DatePicker
              value={orderData.delivery_date}
              onChange={(value) => updateField('delivery_date', value)}
              placeholder={t('selectDeliveryDate')}
            />

            {/* Amount Fields */}
            <Text style={styles.label}>{t('totalAmount')}</Text>
            <TextInput
              ref={totalAmountRef}
              style={styles.input}
              value={orderData.total_amount}
              onChangeText={(value) => updateField('total_amount', value)}
              placeholder={t('enterTotalAmount')}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => advanceAmountRef.current?.focus()}
            />

            <Text style={styles.label}>{t('advanceAmount')}</Text>
            <TextInput
              ref={advanceAmountRef}
              style={styles.input}
              value={orderData.advance_amount}
              onChangeText={(value) => updateField('advance_amount', value)}
              placeholder={t('enterAdvanceAmount')}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => notesRef.current?.focus()}
            />

            {/* Notes */}
            <Text style={styles.label}>{t('notes')}</Text>
            <TextInput
              ref={notesRef}
              style={[styles.input, styles.textArea]}
              value={orderData.notes}
              onChangeText={(value) => updateField('notes', value)}
              placeholder={t('enterOrderNotes')}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="done"
            />

            {/* Status */}
            <Text style={styles.label}>{t('status')}</Text>
            <View style={styles.statusContainer}>
              {translatedOrderStatuses.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusButton,
                    orderData.status === status.value && styles.selectedStatus,
                  ]}
                  onPress={() => updateField('status', status.value)}
                >
                  <Text style={[
                    styles.statusButtonText,
                    orderData.status === status.value && styles.selectedStatusText
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.disabledButton]}
                onPress={handleSaveOrder}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={styles.saveButtonText}>
                    {isEdit ? t('updatingOrder') : t('creatingOrder')}
                  </Text>
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isEdit ? t('updateOrder') : t('createOrder')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectImageSource')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImagePickerModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>{t('chooseImageSource')}</Text>
            
            <View style={styles.imageOptions}>
              <TouchableOpacity
                style={styles.imageOption}
                onPress={() => {
                  pickImage('camera');
                  setShowImagePickerModal(false);
                }}
              >
                <View style={styles.imageOptionIcon}>
                  <Text style={styles.imageOptionIconText}>📷</Text>
                </View>
                <Text style={styles.imageOptionText}>{t('camera')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageOption}
                onPress={() => {
                  pickImage('gallery');
                  setShowImagePickerModal(false);
                }}
              >
                <View style={styles.imageOptionIcon}>
                  <Text style={styles.imageOptionIconText}>🖼️</Text>
                </View>
                <Text style={styles.imageOptionText}>{t('gallery')}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  customerSelector: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  selectCustomerIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  section: {
    marginBottom: 20,
  },
  garmentMeasurementsCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  garmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  measurementField: {
    marginBottom: 15,
  },
  measurementLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  measurementInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  measurementsCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  additionalMeasurementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  measurementsSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toggleButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 20,
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  previewImageContainer: {
    width: 300,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  removeImageButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statusButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedStatus: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedStatusText: {
    color: '#fff',
  },
  saveButtonContainer: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Image Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  imagePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 320,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  
  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  
  imageOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  imageOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  imageOptionIconText: {
    fontSize: 24,
  },
  
  imageOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
});
