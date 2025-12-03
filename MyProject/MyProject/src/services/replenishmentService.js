import apiClient from './api';

export const fetchReplenishmentAlerts = async () => {
  const response = await apiClient.get('/replenishments/alerts');
  return response.data;
};

export const fetchReplenishmentProgress = async () => {
  const response = await apiClient.get('/replenishments/progress');
  return response.data;
};

export const submitReplenishmentApplication = async (payload) => {
  const response = await apiClient.post('/replenishments/applications', payload);
  return response.data;
};

export const fetchReplenishmentApplications = async (status) => {
  const response = await apiClient.get('/replenishments/applications', {
    params: status ? { status } : {}
  });
  return response.data;
};

export const updateReplenishmentApplicationStatus = async (requestId, payload) => {
  const response = await apiClient.patch(`/replenishments/applications/${requestId}`, payload);
  return response.data;
};

