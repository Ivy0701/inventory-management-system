import apiClient from './api.js';

export const fetchOrders = async () => {
  const response = await apiClient.get('/orders');
  return response.data;
};

export const createOrder = async (payload) => {
  const response = await apiClient.post('/orders', payload);
  return response.data;
};

export const confirmOrderReceipt = async (orderId) => {
  const response = await apiClient.patch(`/orders/${orderId}/confirm-receipt`);
  return response.data;
};

export const returnOrder = async (orderId) => {
  const response = await apiClient.patch(`/orders/${orderId}/return`);
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const response = await apiClient.patch(`/orders/${orderId}/cancel`);
  return response.data;
};

export const confirmOrder = async (orderId) => {
  const response = await apiClient.patch(`/orders/${orderId}/confirm`);
  return response.data;
};

export const shipOrder = async (orderId) => {
  const response = await apiClient.patch(`/orders/${orderId}/ship`);
  return response.data;
};

