export const testConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await fetch('http://10.30.122.67:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Connection successful:', data);
      return true;
    } else {
      console.error('Connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Connection error:', error);
    return false;
  }
};
