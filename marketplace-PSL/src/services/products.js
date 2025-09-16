// src/services/products.js
import { api } from '../lib/apiClient';

export async function listProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/products${qs ? `?${qs}` : ''}`);
}

export async function getProduct(id) {
  return api.get(`/products/${id}`);
}
