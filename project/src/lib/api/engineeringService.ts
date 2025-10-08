// Minimal client helper for engineering services API
// Usage: import { fetchServices, fetchServicesByEngineer, assignService } from '@/lib/api/engineeringService'

const BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function request(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts && opts.headers) Object.assign(headers, opts.headers as Record<string, string>);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export async function fetchServices(query: Record<string, any> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null) params.append(k, String(v)); });
  return request(`/api/engineering-services?${params.toString()}`, { method: 'GET' });
}

export async function fetchServicesByEngineer(engineerId: string, query: Record<string, any> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null) params.append(k, String(v)); });
  return request(`/api/engineering-services/engineer/${engineerId}?${params.toString()}`, { method: 'GET' });
}

export async function fetchServicesByFacility(query: Record<string, any> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null) params.append(k, String(v)); });
  return request(`/api/engineering-services/facility?${params.toString()}`, { method: 'GET' });
}

export async function fetchMyServices(query: Record<string, any> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null) params.append(k, String(v)); });
  return request(`/api/engineering-services/mine?${params.toString()}`, { method: 'GET' });
}

export async function assignService(serviceId: string, payload: Record<string, any>) {
  return request(`/api/engineering-services/${serviceId}/assign`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function createEngineeringService(payload: Record<string, any>) {
  return request('/api/engineering-services', { method: 'POST', body: JSON.stringify(payload) });
}
