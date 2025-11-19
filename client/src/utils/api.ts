const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Helper para hacer peticiones
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // cookies JWT
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición');
  }

  return data;
};

// ================= AUTH ===================
export const login = async (credentials: { email: string; password: string }) => {
  return fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
};

export const register = async (userData: { username: string; email: string; password: string }) => {
  return fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
};

export const logout = async () => {
  return fetchAPI('/auth/logout', { method: 'POST' });
};

// ================= TEXTS ===================
export const getTexts = async () => fetchAPI('/texts/get-all-texts');
export const getText = async (id: string) => fetchAPI(`/texts/get-text/${id}`);
export const createText = async (textData: { title: string; content: string; category?: string }) =>
  fetchAPI('/texts/create-text', { method: 'POST', body: JSON.stringify(textData) });
export const updateText = async (id: string, textData: { title?: string; content?: string; category?: string }) =>
  fetchAPI(`/texts/update/${id}`, { method: 'PUT', body: JSON.stringify(textData) });
export const deleteText = async (id: string) => fetchAPI(`/texts/delete/${id}`, { method: 'DELETE' });

export const generateAudio = async (textId: string, gender: 'male' | 'female' = 'female') =>
  fetchAPI('/texts/generate-audio-from-text', { method: 'POST', body: JSON.stringify({ id: textId, gender }) });

// ================= USERS ===================
export const searchUsers = async (query: string) =>
  fetchAPI(`/users/search?q=${encodeURIComponent(query)}`);

// ================= SHARED ===================
export const getSharedWithMe = async () => {
  const response = await fetch(`${API_URL}/shared/received`, { credentials: 'include' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener textos compartidos');
  }
  return response.json();
};

export const getSharedByMe = async () => fetchAPI('/shared/sent');

export const shareText = async (data: { text_id: string; shared_with_user_id: string }) =>
  fetchAPI('/shared/share', { method: 'POST', body: JSON.stringify(data) });

export const shareWithMultiple = async (data: { text_id: string; usernames: string[] }) =>
  fetchAPI('/shared/share-multiple', { method: 'POST', body: JSON.stringify(data) });

export const unshareText = async (shareId: string) =>
  fetchAPI(`/shared/${shareId}`, { method: 'DELETE' });

export async function getAnalyticsAll() {
  return fetchAPI('/analytics/get-all');
}

// ================= WHATSAPP ===================

export const getWhatsAppConfig = async () => fetchAPI('/whatsapp/config');

export const configureWhatsApp = async (phone_number: string) =>
  fetchAPI('/whatsapp/config', { method: 'POST', body: JSON.stringify({ phone_number }) });

export const requestWhatsAppVerification = async () =>
  fetchAPI('/whatsapp/request-verification', { method: 'POST' });

export const verifyWhatsAppCode = async (code: string) =>
  fetchAPI('/whatsapp/verify', { method: 'POST', body: JSON.stringify({ code }) });

export const toggleWhatsAppNotifications = async (enabled: boolean) =>
  fetchAPI('/whatsapp/notifications', { method: 'PUT', body: JSON.stringify({ enabled }) });

export const sendAudio = async ({
  text_id,
  to_self = true,
  to_phone,
}: {
  text_id: string;
  to_self?: boolean;
  to_phone?: string;
}) =>
  fetchAPI('/whatsapp/send-audio', {
    method: 'POST',
    body: JSON.stringify({ text_id, to_self, to_phone }),
  });


// ================= FAVORITOS =================

// Obtener todos los favoritos del usuario
export const getFavorites = async () => {
  return fetchAPI('/favorites/get-all');
};

// Agregar a favoritos
export const addFavorite = async (textId: string) => {
  return fetchAPI('/favorites/add-favorite', {
    method: 'POST',
    body: JSON.stringify({ text_id: textId }),
  });
};

// Quitar de favoritos
export const removeFavorite = async (textId: string) => {
  return fetchAPI(`/favorites/${textId}`, {
    method: 'DELETE',
  });
};

// Verificar si un texto ya es favorito
export const checkFavorite = async (textId: string) => {
  return fetchAPI(`/favorites/check/${textId}`);
};
