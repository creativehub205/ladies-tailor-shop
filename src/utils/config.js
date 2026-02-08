export const getLocalIP = () => {
  // Replace with your ngrok URL or deployed backend URL
  // Example: 'your-ngrok-url.ngrok.io'
  return '10.221.169.66'; // Use your local IP if backend is on same network
};

export const API_BASE_URL = `http://${getLocalIP()}:3000/api`;

export const UPLOADS_URL = `http://${getLocalIP()}:3000/uploads`;
