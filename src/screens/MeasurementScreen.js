import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { garmentTypes, generalMeasurements, additionalMeasurements, getTranslatedMeasurements } from '../utils/measurements';
import { API_BASE_URL } from '../utils/config';
import ScreenWrapper from '../components/ScreenWrapper';
import { useLanguage } from '../contexts/LanguageContext';

export default function MeasurementScreen({ route, navigation }) {
  const { t } = useLanguage();
  const [measurements, setMeasurements] = useState({});
  const [additionalMeasurementsData, setAdditionalMeasurementsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdditionalMeasurements, setShowAdditionalMeasurements] = useState(false);
  
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
  
  // Create refs for auto-focus
  const inputRefs = useRef({});

  const { orderId, garmentTypes: selectedGarmentTypes } = route.params;

  useEffect(() => {
    if (orderId) {
      loadExistingMeasurements();
    }
  }, [orderId, t]); // Add t as dependency to re-render when language changes

  const loadExistingMeasurements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      const data = await response.json();
      
      if (data.measurements) {
        const measurementsMap = {};
        data.measurements.forEach(measurement => {
          measurementsMap[measurement.measurement_type] = measurement.value.toString();
        });
        setMeasurements(measurementsMap);
      }
    } catch (error) {
      console.error('Error loading measurements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMeasurement = (field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateAdditionalMeasurement = (field, value) => {
    setAdditionalMeasurementsData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveMeasurements = async () => {
    setIsSaving(true);
    try {
      const allMeasurements = [
        ...Object.entries(measurements).map(([type, value]) => ({
          type,
          value: parseFloat(value) || 0
        })),
        ...Object.entries(additionalMeasurementsData).map(([type, value]) => ({
          type,
          value: parseFloat(value) || 0
        }))
      ];

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/measurements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ measurements: allMeasurements }),
      });

      if (response.ok) {
        Alert.alert(t('success'), t('measurementsSavedSuccessfully'), [
          {
            text: t('ok'),
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error('Failed to save measurements');
      }
    } catch (error) {
      Alert.alert(t('error'), t('failedToSaveMeasurements'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderMeasurementField = (field, index, fields) => {
    // Get all measurement keys to determine next field
    const getAllFieldKeys = () => {
      const allKeys = [];
      
      // Add garment type measurements
      if (selectedGarmentTypes) {
        selectedGarmentTypes.forEach(garmentType => {
          const garment = translatedGarmentTypes[garmentType];
          if (garment && garment.measurements) {
            garment.measurements.forEach(measurement => {
              allKeys.push(measurement.id);
            });
          }
        });
      }
      
      // Add additional measurements if shown
      if (showAdditionalMeasurements) {
        translatedAdditionalMeasurements.forEach(measurement => {
          allKeys.push(measurement.id);
        });
      }
      
      return allKeys;
    };

    const allFieldKeys = getAllFieldKeys();
    const currentFieldIndex = allFieldKeys.indexOf(field.key);
    const nextFieldKey = currentFieldIndex < allFieldKeys.length - 1 ? allFieldKeys[currentFieldIndex + 1] : null;

    return (
      <View key={field.key} style={styles.measurementRow}>
        <Text style={styles.measurementLabel}>{field.label}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            ref={(ref) => {
              if (ref) {
                inputRefs.current[field.key] = ref;
              }
            }}
            style={styles.measurementInput}
            value={measurements[field.key] || ''}
            onChangeText={(value) => updateMeasurement(field.key, value)}
            placeholder={t('enterMeasurementValue')}
            keyboardType="numeric"
            returnKeyType={nextFieldKey ? "next" : "done"}
            onSubmitEditing={() => {
              if (nextFieldKey && inputRefs.current[nextFieldKey]) {
                inputRefs.current[nextFieldKey].focus();
              }
            }}
          />
          <Text style={styles.unitText}>{field.unit}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>{t('loading')} {t('measurements')}...</Text>
      </View>
    );
  }

  const getAllMeasurementsForSelectedGarments = () => {
    const garmentMeasurements = [];
    
    console.log('selectedGarmentTypes:', selectedGarmentTypes);
    
    // Add measurements for each selected garment type (NOT general measurements)
    if (selectedGarmentTypes && Array.isArray(selectedGarmentTypes) && selectedGarmentTypes.length > 0) {
      selectedGarmentTypes.forEach(garmentType => {
        const garment = translatedGarmentTypes[garmentType];
        console.log('Processing garment type:', garmentType, 'garment:', garment);
        if (garment && garment.measurements) {
          garmentMeasurements.push({
            garmentType,
            garmentName: garment.name,
            measurements: garment.measurements
          });
        }
      });
    } else {
      // Fallback to general measurements if no garment types selected
      console.log('No garment types selected, using general measurements');
      garmentMeasurements.push({
        garmentType: 'general',
        garmentName: t('general'),
        measurements: translatedAdditionalMeasurements
      });
    }
    
    console.log('Final garment measurements:', garmentMeasurements);
    return garmentMeasurements;
  };

  const currentMeasurements = getAllMeasurementsForSelectedGarments();

  const getGarmentTypeNames = () => {
    if (!selectedGarmentTypes || selectedGarmentTypes.length === 0) {
      return t('general');
    }
    return selectedGarmentTypes
      .map(type => translatedGarmentTypes[type]?.name || type)
      .join(' + ');
  };

  return (
    <ScreenWrapper showBottomNav={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {t('measurements')} for {selectedGarmentTypes.map(type => translatedGarmentTypes[type]?.name || type).join(' + ')}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {selectedGarmentTypes.map(garmentType => {
            const garment = translatedGarmentTypes[garmentType];
            if (!garment || !garment.measurements) return null;

            return (
              <View key={garmentType} style={styles.section}>
                <Text style={styles.sectionTitle}>{garment.name} {t('measurements')}</Text>
                <View style={styles.measurementsCard}>
                  {garment.measurements.map(renderMeasurementField)}
                </View>
              </View>
            );
          })}

          <View style={styles.section}>
            <View style={styles.additionalMeasurementsHeader}>
              <Text style={styles.sectionTitle}>{t('additionalMeasurements')}</Text>
              <TouchableOpacity 
                onPress={() => setShowAdditionalMeasurements(!showAdditionalMeasurements)}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleButtonText}>
                  {showAdditionalMeasurements ? t('hide') : t('show')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.measurementsCard}>
              {showAdditionalMeasurements && translatedAdditionalMeasurements.map(renderMeasurementField)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('customNotes')}</Text>
            <View style={styles.notesCard}>
              <TextInput
                style={styles.notesInput}
                placeholder={t('customNotesPlaceholder')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={additionalMeasurementsData.notes || ''}
                onChangeText={(value) => updateAdditionalMeasurement('notes', value)}
              />
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSaveMeasurements}
              disabled={isSaving}
            >
              {isSaving ? (
                <Text style={styles.saveButtonText}>{t('saving')}</Text>
              ) : (
                <Text style={styles.saveButtonText}>{t('saveMeasurements')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  measurementsCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  garmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  additionalMeasurementsHeader: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  measurementLabel: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    marginRight: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  measurementInput: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
  },
  unitText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesInput: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 100,
  },
  actionButtons: {
    padding: 20,
    paddingBottom: 30,
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 10,
  },
});
