import apiClient from './api.js';

export const initializeInventory = async () => {
  const response = await apiClient.post('/inventory/initialize');
  return response.data;
};

export const getInventory = async () => {
  const response = await apiClient.get('/inventory');
  return response.data;
};

