import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('commutesmart_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Stub endpoints
export async function loginStub(email: string, _password: string) {
  return { token: 'mock-token', user: { id: '1', name: 'Bilal Ahmed', email } };
}

export async function reportLocationStub(_lat: number, _long: number, _vehicleId?: string) {
  return { success: true };
}

export async function getNearbyLocationsStub(_lat: number, _long: number) {
  return { locations: [] };
}

export async function getUserAchievementsStub() {
  return { achievements: [] };
}
