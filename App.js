import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CustomerListScreen from './src/screens/CustomerListScreen';
import AddCustomerScreen from './src/screens/AddCustomerScreen';
import AddOrderScreen from './src/screens/AddOrderScreen';
import OrderListScreen from './src/screens/OrderListScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import MeasurementScreen from './src/screens/MeasurementScreen';
import CustomerOrdersScreen from './src/screens/CustomerOrdersScreen';

const Stack = createStackNavigator();

const AppContent = () => {
  const { userToken, isLoading } = React.useContext(AuthContext);
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator>
        {userToken ? (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CustomerList" 
              component={CustomerListScreen}
              options={{ headerShown: true, title: t('customers') }}
            />
            <Stack.Screen 
              name="AddCustomer" 
              component={AddCustomerScreen}
              options={{ headerShown: true, title: t('addCustomer') }}
            />
            <Stack.Screen 
              name="AddOrder" 
              component={AddOrderScreen}
              options={{ headerShown: true, title: t('addOrder') }}
            />
            <Stack.Screen 
              name="OrderList" 
              component={OrderListScreen}
              options={{ headerShown: true, title: t('orders') }}
            />
            <Stack.Screen 
              name="OrderDetail" 
              component={OrderDetailScreen}
              options={{ headerShown: true, title: t('orderDetails') }}
            />
            <Stack.Screen 
              name="Measurement" 
              component={MeasurementScreen}
              options={{ headerShown: true, title: t('measurements') }}
            />
            <Stack.Screen 
              name="CustomerOrders" 
              component={CustomerOrdersScreen}
              options={{ headerShown: true, title: t('customerOrders') }}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
