import React from 'react';
import { View, StyleSheet } from 'react-native';
import BottomNavigation from './BottomNavigation';

const ScreenWrapper = ({ children, showBottomNav = true }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.content, showBottomNav && styles.contentWithNav]}>
        {children}
      </View>
      {showBottomNav && <BottomNavigation />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  contentWithNav: {
    paddingBottom: 0,
  },
});

export default ScreenWrapper;
