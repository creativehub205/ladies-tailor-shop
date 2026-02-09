export const getLocalIP = () => {
  // Replace with your deployed backend URL from Render/Heroku/etc
  // Example: 'ladies-tailor-backend.onrender.com'
  return 'https://ladies-tailor-shop.onrender.com'; // Replace with your actual deployed URL
};

export const API_BASE_URL = `https://${getLocalIP()}/api`;

export const UPLOADS_URL = `https://${getLocalIP()}/uploads`;
