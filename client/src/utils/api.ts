// utils/api.ts

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

// =============== AUTH ===================

export const login = async (credentials: { email: string; password: string }) => {
  return fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const register = async (userData: { username: string; email: string; password: string }) => {
  return fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const logout = async () => {
  return fetchAPI('/auth/logout', { method: 'POST' });
};

// =============== TEXTS ===================

export const getTexts = async () => {
  return fetchAPI('/texts/get-all-texts');
};

export const getText = async (id: string) => {
  return fetchAPI(`/texts/get-text/${id}`);
};

export const createText = async (textData: { title: string; content: string; category?: string }) => {
  return fetchAPI('/texts/create-text', {
    method: 'POST',
    body: JSON.stringify(textData),
  });
};

export const updateText = async (
  id: string, 
  textData: { title?: string; content?: string; category?: string }
) => {
  return fetchAPI(`/texts/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(textData),
  });
};

export const deleteText = async (id: string) => {
  return fetchAPI(`/texts/delete/${id}`, { method: 'DELETE' });
};

// Generar audio
export const generateAudio = async (textId: string, gender: 'male' | 'female' = 'female') => {
  return fetchAPI('/texts/generate-audio-from-text', {
    method: 'POST',
    body: JSON.stringify({ id: textId, gender }),
  });
};

// =============== USERS ===================

// Buscar usuarios por username
export const searchUsers = async (query: string) => {
  return fetchAPI(`/users/search?q=${encodeURIComponent(query)}`);
};

// =============== SHARED ===================

// Textos compartidos conmigo
export const getSharedWithMe = async () => {
  const response = await fetch(`${API_URL}/shared/received`, {
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener textos compartidos');
  }

  return response.json();
};

// Textos compartidos por mí
export const getSharedByMe = async () => {
  return fetchAPI('/shared/sent');
};

// Compartir texto con UN usuario
export const shareText = async (data: { 
  text_id: string; 
  shared_with_user_id: string;
}) => {
  return fetchAPI('/shared/share', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Compartir texto con VARIOS usuarios
export const shareWithMultiple = async (data: { 
  text_id: string;
  usernames: string[];
}) => {
  return fetchAPI('/shared/share-multiple', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const unshareText = async (shareId: string) => {
  return fetchAPI(`/shared/${shareId}`, {
    method: 'DELETE',
  });
};
