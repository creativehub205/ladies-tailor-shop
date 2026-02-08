export const getLocalIP = () => {
  // Replace with YOUR actual IP address from ipconfig
  // For testing on same computer, use 'localhost'
  // For mobile testing, use your computer's IP address
  return '10.221.169.66';
};

export const API_BASE_URL = `http://${getLocalIP()}:3000/api`;

export const UPLOADS_URL = `http://${getLocalIP()}:3000/uploads`;
