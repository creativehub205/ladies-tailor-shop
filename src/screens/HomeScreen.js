import React, { useState, useRef, useContext, useReducer, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { customerAPI } from '../services/api';
import { orderAPI } from '../services/api';
import { testBackendConnection } from '../utils/connectionTest';
import ScreenWrapper from '../components/ScreenWrapper';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import QuickActions from '../components/QuickActions';
import { COLORS, SIZES } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const { language, changeLanguage, t } = useLanguage();
  const [tailorData, setTailorData] = useState(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  const { width } = Dimensions.get('window');

  useFocusEffect(
    React.useCallback(() => {
      loadTailorData();
      checkConnectionAndLoadStats();
      startAnimations();
    }, [])
  );
  
  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkConnectionAndLoadStats = async () => {
    setConnectionStatus('checking');
    const isConnected = await testBackendConnection();
    
    if (isConnected) {
      setConnectionStatus('connected');
      loadStats();
    } else {
      setConnectionStatus('disconnected');
      setIsLoading(false);
      Alert.alert(
        t('connectionError'),
        t('cannotConnectToBackendServer'),
        [
          {
            text: t('retry'),
            onPress: () => checkConnectionAndLoadStats(),
          },
          {
            text: t('ok'),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const loadTailorData = async () => {
    try {
      // For now, use mock tailor data since we don't have persistent storage
      const mockTailorData = {
        username: 'admin',
        shop_name: t('tailorShop')
      };
      setTailorData(mockTailorData);
    } catch (error) {
      console.error('Error loading tailor data:', error);
    }
  };

  const loadStats = async () => {
    try {
      console.log('Loading stats...');
      const [customers, orders] = await Promise.all([
        customerAPI.getCustomers(),
        orderAPI.getOrders(),
      ]);

      console.log('Customers loaded:', customers.length);
      console.log('Orders loaded:', orders.length);

      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const completedOrders = orders.filter(order => order.status === 'completed').length;

      setStats({
        totalCustomers: customers.length,
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
      });
      
      // Load recent activities
      setRecentOrders(orders.slice(0, 3));
      setRecentCustomers(customers.slice(0, 3));
    } catch (error) {
      console.error('Error loading stats:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Show user-friendly error message
      Alert.alert(
        t('connectionError'),
        t('cannotConnectToBackendServer'),
        [
          {
            text: t('retry'),
            onPress: () => loadStats(),
          },
          {
            text: t('ok'),
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('logout'),
      t('areYouSureToLogout'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('logout'),
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkConnectionAndLoadStats();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'in_progress':
        return COLORS.info;
      case 'ready':
        return COLORS.primary;
      case 'delivered':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.textLight;
    }
  };

  const menuItems = [
    {
      id: 1,
      title: 'customers',
      subtitle: 'viewAndManageCustomers',
      icon: '👥',
      color: COLORS.primary,
      onPress: () => navigation.navigate('CustomerList'),
    },
    {
      id: 2,
      title: 'addCustomer',
      subtitle: 'addNewCustomer',
      icon: '➕',
      color: COLORS.success,
      onPress: () => navigation.navigate('AddCustomer'),
    },
    {
      id: 3,
      title: 'orders',
      subtitle: 'viewAndManageOrders',
      icon: '📋',
      color: COLORS.warning,
      onPress: () => navigation.navigate('OrderList'),
    },
    {
      id: 4,
      title: 'addOrder',
      subtitle: 'createNewOrder',
      icon: '🧵',
      color: COLORS.error,
      onPress: () => navigation.navigate('AddOrder'),
    },
  ];

  return (
    <ScreenWrapper showBottomNav={true}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Animated Header */}
        <Animated.View style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>{t('welcome')}</Text>
            <Text style={styles.shopName}>
              {tailorData?.shop_name || t('tailorShop')}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.languageSelector}
              onPress={() => setShowLanguageModal(true)}
            >
              <Text style={styles.languageText}>
                {language === 'en' ? '🇬🇧 EN' : '🇮🇳 ગુજ'}
              </Text>
            </TouchableOpacity>
            <View style={[
              styles.connectionIndicator,
              connectionStatus === 'connected' && styles.connected,
              connectionStatus === 'disconnected' && styles.disconnected,
              connectionStatus === 'checking' && styles.checking
            ]}>
              <Text style={styles.connectionText}>
                {connectionStatus === 'connected' && '🟢'}
                {connectionStatus === 'disconnected' && '🔴'}
                {connectionStatus === 'checking' && '🟡'}
              </Text>
            </View>
            <Button
              title={t('logout')}
              onPress={handleLogout}
              variant="outline"
              size="small"
            />
          </View>
        </Animated.View>

        {/* Animated Stats Container */}
        <Animated.View style={[
          styles.statsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          <Card variant="elevated" padding="lg">
            <Text style={styles.statsTitle}>{t('businessOverview')}</Text>
            <View style={styles.statsGrid}>
              <TouchableOpacity 
                style={styles.statCard} 
                onPress={() => navigation.navigate('CustomerList')}
                activeOpacity={0.7}
              >
                <View style={[styles.statIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="people" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>{stats.totalCustomers}</Text>
                <Text style={styles.statLabel}>{t('totalCustomers')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.statCard} 
                onPress={() => navigation.navigate('OrderList')}
                activeOpacity={0.7}
              >
                <View style={[styles.statIcon, { backgroundColor: COLORS.warning }]}>
                  <Ionicons name="document-text" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>{stats.totalOrders}</Text>
                <Text style={styles.statLabel}>{t('totalOrders')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.statCard} 
                onPress={() => navigation.navigate('OrderList', { filter: 'pending' })}
                activeOpacity={0.7}
              >
                <View style={[styles.statIcon, { backgroundColor: COLORS.error }]}>
                  <Ionicons name="time" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
                <Text style={styles.statLabel}>{t('pendingOrders')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.statCard} 
                onPress={() => navigation.navigate('OrderList', { filter: 'completed' })}
                activeOpacity={0.7}
              >
                <View style={[styles.statIcon, { backgroundColor: COLORS.success }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>{stats.completedOrders}</Text>
                <Text style={styles.statLabel}>{t('completedOrders')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        {/* Enhanced Quick Actions */}
        <Animated.View style={[
          styles.actionsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          <Card variant="elevated" padding="lg">
            <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
            <View style={styles.actionsGrid}>
            {menuItems.map((action, index) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={action.onPress}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <Text style={styles.actionIconText}>{action.icon}</Text>
                  </View>
                  <Text style={styles.actionTitle}>{t(action.title)}</Text>
                  <Text style={styles.actionSubtitle}>{t(action.subtitle)}</Text>
                </TouchableOpacity>
            ))}
          </View>
          </Card>
        </Animated.View>

        {/* Recent Activities */}
        <Animated.View style={[
          styles.recentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Card variant="elevated" padding="lg">
            <Text style={styles.sectionTitle}>{t('recentActivities')}</Text>
            
            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentSectionTitle}>{t('recentOrders')}</Text>
                {recentOrders.map((order) => (
                  <TouchableOpacity 
                    key={order.id}
                    style={styles.recentItem}
                    onPress={() => navigation.navigate('OrderDetail', { order })}
                  >
                    <View style={styles.recentItemLeft}>
                      <Text style={styles.recentItemTitle}>#{order.order_number}</Text>
                      <Text style={styles.recentItemSubtitle}>{order.customer_name}</Text>
                    </View>
                    <View style={styles.recentItemRight}>
                      <Text style={[
                        styles.recentItemStatus,
                        { backgroundColor: getStatusColor(order.status) }
                      ]}>
                        {t(order.status)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Recent Customers */}
            {recentCustomers.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentSectionTitle}>{t('recentCustomers')}</Text>
                {recentCustomers.map((customer) => (
                  <TouchableOpacity 
                    key={customer.id}
                    style={styles.recentItem}
                    onPress={() => navigation.navigate('CustomerOrders', { customer })}
                  >
                    <View style={styles.recentItemLeft}>
                      <View style={styles.recentAvatar}>
                        <Text style={styles.recentAvatarText}>
                          {customer.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.recentItemTitle}>{customer.name}</Text>
                        <Text style={styles.recentItemSubtitle}>{customer.phone}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>
        </Animated.View>
      </ScrollView>
      
      {/* Quick Actions FAB */}
      <QuickActions visible={showQuickActions} />
      
      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.languageModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.languageOptions}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  language === 'en' && styles.selectedLanguage
                ]}
                onPress={() => {
                  changeLanguage('en');
                  setShowLanguageModal(false);
                }}
              >
                <View style={styles.languageFlag}>
                  <Text>🇬🇧</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>English</Text>
                  <Text style={styles.languageNative}>English</Text>
                </View>
                {language === 'en' && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  language === 'gu' && styles.selectedLanguage
                ]}
                onPress={() => {
                  changeLanguage('gu');
                  setShowLanguageModal(false);
                }}
              >
                <View style={styles.languageFlag}>
                  <Text>🇮🇳</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>Gujarati</Text>
                  <Text style={styles.languageNative}>ગુજરાતી</Text>
                </View>
                {language === 'gu' && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>
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
    backgroundColor: COLORS.background,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.padding.xxl,
    paddingBottom: SIZES.padding.lg,
    paddingRight: SIZES.padding.lg,
    paddingLeft: SIZES.padding.lg,
    backgroundColor: COLORS.surface,
    ...SIZES.shadow.sm,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  welcomeText: {
    fontSize: SIZES.large,
    color: COLORS.textLight,
    marginBottom: SIZES.padding.xs / 2,
  },
  
  shopName: {
    fontSize: SIZES.xlarge,
    fontWeight: '700',
    color: COLORS.text,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.padding.sm,
  },
  
  connectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  connected: {
    backgroundColor: COLORS.success,
  },
  
  disconnected: {
    backgroundColor: COLORS.error,
  },
  
  checking: {
    backgroundColor: COLORS.warning,
  },
  
  connectionText: {
    fontSize: SIZES.small,
  },
  
  languageSelector: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.padding.sm,
    paddingVertical: SIZES.padding.xs,
    borderRadius: SIZES.radius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SIZES.padding.sm,
  },
  
  languageText: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  statsContainer: {
    padding: SIZES.padding.lg,
  },
  
  statsTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding.lg,
    textAlign: 'center',
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SIZES.padding.md,
  },
  
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: SIZES.padding.md,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.padding.sm,
  },
  
  statNumber: {
    fontSize: SIZES.xxxlarge,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.padding.xs / 2,
  },
  
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  actionsContainer: {
    padding: SIZES.padding.lg,
  },
  
  sectionTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding.lg,
  },
  
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SIZES.padding.md,
  },
  
  actionCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: SIZES.padding.lg,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SIZES.shadow.sm,
  },
  
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: SIZES.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.padding.md,
    ...SIZES.shadow.md,
  },
  
  actionIconText: {
    fontSize: SIZES.xxxlarge,
  },
  
  actionTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding.xs / 2,
    textAlign: 'center',
  },
  
  actionSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  
  // Recent Activities Styles
  recentContainer: {
    padding: SIZES.padding.lg,
  },
  
  recentSection: {
    marginBottom: SIZES.padding.lg,
  },
  
  recentSectionTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding.md,
  },
  
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding.md,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius.sm,
    marginBottom: SIZES.padding.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  recentItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  recentItemRight: {
    alignItems: 'flex-end',
  },
  
  recentAvatar: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.padding.md,
  },
  
  recentAvatarText: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: '#fff',
  },
  
  recentItemTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding.xs / 2,
  },
  
  recentItemSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  
  recentItemStatus: {
    paddingHorizontal: SIZES.padding.sm,
    paddingVertical: SIZES.padding.xs / 2,
    borderRadius: SIZES.radius.full,
    fontSize: SIZES.small,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Language Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding.lg,
  },
  
  languageModal: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    width: '90%',
    maxWidth: 400,
    ...SIZES.shadow.lg,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  modalTitle: {
    fontSize: SIZES.xlarge,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  closeButton: {
    padding: SIZES.padding.sm,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.background,
  },
  
  languageOptions: {
    padding: SIZES.padding.lg,
  },
  
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding.lg,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.padding.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  
  selectedLanguage: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  
  languageFlag: {
    fontSize: 32,
    marginRight: SIZES.padding.md,
  },
  
  languageInfo: {
    flex: 1,
  },
  
  languageName: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding.xs / 2,
  },
  
  languageNative: {
    fontSize: SIZES.small,
    color: COLORS.textLight,
  },
  
  checkmark: {
    marginLeft: SIZES.padding.sm,
  },
});
