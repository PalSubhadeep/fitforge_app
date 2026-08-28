import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: change this to your deployed backend URL once you host it
// (see server/README.md). While developing with Expo Go on a physical
// device, "localhost" will NOT work — use your computer's LAN IP instead,
// e.g. "http://192.168.1.20:4000".
export const API_BASE_URL = 'https://fitforgeapp-production.up.railway.app/';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('fitforge_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiErrorMessage(err) {
  return err?.response?.data?.error || err?.message || 'Something went wrong. Please try again.';
}

export default api;
