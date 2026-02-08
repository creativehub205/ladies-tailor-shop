import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { customerAPI } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { useLanguage } from '../contexts/LanguageContext';

export default function AddCustomerScreen({ navigation, route }) {
  const { t } = useLanguage();
  const [customerData, setCustomerData] = useState({
    name: '',
    contact_number: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Refs for auto-focus
  const nameRef = useRef(null);
  const contactRef = useRef(null);
  const addressRef = useRef(null);

  const customer = route.params?.customer;

  React.useEffect(() => {
    if (customer) {
      setCustomerData({
        name: customer.name,
        contact_number: customer.contact_number || '',
        address: customer.address || '',
      });
    }
  }, [customer]);

  const handleSaveCustomer = async () => {
    if (!customerData.name.trim()) {
      Alert.alert(t('error'), t('customerNameRequired'));
      return;
    }

    setIsLoading(true);
    try {
      if (customer && customer.id) {
        // Update existing customer
        await customerAPI.updateCustomer(customer.id, customerData);
        Alert.alert(
          t('success'),
          t('customerUpdatedSuccessfully'),
          [
            {
              text: t('ok'),
              onPress: () => navigation.navigate('CustomerList'),
            },
          ]
        );
      } else {
        // Add new customer
        await customerAPI.addCustomer(customerData);
        Alert.alert(
          t('success'),
          t('customerAddedSuccessfully'),
          [
            {
              text: t('ok'),
              onPress: () => navigation.navigate('CustomerList'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(t('error'), error.error || t('failedToSaveCustomer'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <ScreenWrapper showBottomNav={true}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.label}>{t('customerName')} *</Text>
            <TextInput
              ref={nameRef}
              style={styles.input}
              value={customerData.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder={t('enterCustomerName')}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => contactRef.current?.focus()}
            />

            <Text style={styles.label}>{t('contactNumber')}</Text>
            <TextInput
              ref={contactRef}
              style={styles.input}
              value={customerData.contact_number}
              onChangeText={(value) => updateField('contact_number', value)}
              placeholder={t('enterContactNumber')}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => addressRef.current?.focus()}
            />
            <Text style={styles.label}>{t('address')}</Text>
            <TextInput
              ref={addressRef}
              style={[styles.input, styles.textArea]}
              value={customerData.address}
              onChangeText={(value) => updateField('address', value)}
              placeholder={t('enterCustomerAddress')}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSaveCustomer}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.saveButtonText}>{t('saving')}</Text>
              ) : (
                <Text style={styles.saveButtonText}>
                  {customer ? t('updateCustomer') : t('saveCustomer')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
