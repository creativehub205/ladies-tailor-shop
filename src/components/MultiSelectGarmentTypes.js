import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

const MultiSelectGarmentTypes = ({ selectedValues, onChange }) => {
  const { t } = useLanguage();
  const garmentTypes = [
    { id: 'kurti', name: t('kurtiKameezTop'), icon: '👗' },
    { id: 'salwar', name: t('salwarPantChuridar'), icon: '🩳' },
    { id: 'blouse', name: t('blouseSareeBlouse'), icon: '🪡' },
    { id: 'lehenga', name: t('lehengaSkirt'), icon: '👗' },
    { id: 'gown', name: t('gownAnarkali'), icon: '👗' },
    { id: 'dress', name: t('dressWesternWear'), icon: '👗' },
    { id: 'other', name: t('other'), icon: '📏' },
  ];

  const toggleSelection = (garmentId) => {
    const newSelection = selectedValues.includes(garmentId)
      ? selectedValues.filter(id => id !== garmentId)
      : [...selectedValues, garmentId];
    onChange(newSelection);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('selectGarmentTypes')}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.optionsContainer}>
          {garmentTypes.map((garment) => {
            const isSelected = selectedValues.includes(garment.id);
            return (
              <TouchableOpacity
                key={garment.id}
                style={[
                  styles.option,
                  isSelected && styles.selectedOption,
                ]}
                onPress={() => toggleSelection(garment.id)}
              >
                <Text style={styles.icon}>{garment.icon}</Text>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}>
                  {garment.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      {selectedValues.length === 0 && (
        <Text style={styles.errorText}>{t('pleaseSelectAtLeastOneGarmentType')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  scrollView: {
    marginBottom: 5,
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  option: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    minWidth: 100,
    minHeight: 80,
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 12,
    color: '#495057',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 5,
  },
});

export default MultiSelectGarmentTypes;
