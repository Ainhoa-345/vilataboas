import axios from "axios";

const BASE = "/api/clientes";

export const getClientes = async (incluirHistorico = false) => {
  // envia un query param para que el backend devuelva también los clientes en histórico
  // (ajusta el nombre del parámetro si vuestro backend espera otro)
  const params = {};
  if (incluirHistorico) params.withHistorico = 1;
  const res = await axios.get(BASE, { params });
  return res.data;
};

export const getClientePorDni = async (dni) => {
  const res = await axios.get(`${BASE}/dni/${encodeURIComponent(dni)}`);
  return res.data;
};

// <-- añadido: alias/compatibilidad para getDni usado en el componente -->
export const getDni = async (dni) => {
  // devuelve lo mismo que getClientePorDni (ajusta si necesitas otro comportamiento)
  return await getClientePorDni(dni);
};

export const getClientePorMovil = async (movil) => {
  const res = await axios.get(`${BASE}/movil/${encodeURIComponent(movil)}`);
  return res.data;
};

export const getClienteLogueado = async () => {
  const token = sessionStorage.getItem('token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await axios.get(`${BASE}/logueado`, { headers });
  return res.data;
};

export const addCliente = async (payload) => {
  const res = await axios.post(BASE, payload);
  return res.data;
};

export const updateCliente = async (id, payload) => {
  const res = await axios.put(`${BASE}/${encodeURIComponent(id)}`, payload);
  return res.data;
};

export const patchCliente = async (id, payload) => {
  const res = await axios.patch(`${BASE}/${encodeURIComponent(id)}`, payload);
  return res.data;
};

export const deleteCliente = async (id) => {
  const res = await axios.delete(`${BASE}/${encodeURIComponent(id)}`);
  return res.data;
};