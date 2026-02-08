import { API_BASE_URL } from './config';

export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection to:', API_BASE_URL.replace('/api', ''));
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('Backend connection successful');
      return true;
    } else {
      console.error('Backend connection failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Backend connection error:', error);
    return false;
  }
};
