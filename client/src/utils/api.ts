const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==========================================
// HELPER PARA PETICIONES
// ==========================================
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

// ==========================================
// AUTH
// ==========================================
export const login = async (credentials: { email: string; password: string }) => {
  return fetchAPI('/auth/login', { 
    method: 'POST', 
    body: JSON.stringify(credentials) 
  });
};

export const register = async (userData: { 
  username: string; 
  email: string; 
  password: string 
}) => {
  return fetchAPI('/auth/register', { 
    method: 'POST', 
    body: JSON.stringify(userData) 
  });
};

export const logout = async () => {
  return fetchAPI('/auth/logout', { method: 'POST' });
};

// ==========================================
// TEXTS
// ==========================================
export const getTexts = async () => {
  return fetchAPI('/texts/get-all-texts');
};

export const getText = async (id: string) => {
  return fetchAPI(`/texts/get-text/${id}`);
};

export const createText = async (textData: { 
  title: string; 
  content: string; 
  category?: string 
}) => {
  return fetchAPI('/texts/create-text', { 
    method: 'POST', 
    body: JSON.stringify(textData) 
  });
};

export const updateText = async (
  id: string, 
  textData: { 
    title?: string; 
    content?: string; 
    category?: string 
  }
) => {
  return fetchAPI(`/texts/update/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(textData) 
  });
};

export const deleteText = async (id: string) => {
  return fetchAPI(`/texts/delete/${id}`, { method: 'DELETE' });
};

export const generateAudio = async (
  textId: string, 
  gender: 'male' | 'female' = 'female'
) => {
  return fetchAPI('/texts/generate-audio-from-text', { 
    method: 'POST', 
    body: JSON.stringify({ id: textId, gender }) 
  });
};

// ==========================================
// USERS
// ==========================================
export const searchUsers = async (query: string) => {
  return fetchAPI(`/users/search?q=${encodeURIComponent(query)}`);
};

/**
 * Obtener perfil completo del usuario con estadísticas
 */
export const getUserProfile = async () => {
  return fetchAPI('/users/profile');
};

/**
 * Actualizar número de teléfono
 */
export const updatePhoneNumber = async (phone_number: string) => {
  return fetchAPI('/users/phone', {
    method: 'PUT',
    body: JSON.stringify({ phone_number })
  });
};

/**
 * Solicitar código de verificación de WhatsApp
 */
export const requestVerificationCode = async () => {
  return fetchAPI('/users/request-verification', {
    method: 'POST'
  });
};

/**
 * Verificar código de WhatsApp
 */
export const verifyWhatsAppCode = async (code: string) => {
  return fetchAPI('/users/verify', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
};

/**
 * Activar/desactivar notificaciones de WhatsApp
 */
export const toggleNotifications = async (enabled: boolean) => {
  return fetchAPI('/users/notifications', {
    method: 'PUT',
    body: JSON.stringify({ enabled })
  });
};

/**
 * Eliminar número de teléfono
 */
export const removePhoneNumber = async () => {
  return fetchAPI('/users/phone', {
    method: 'DELETE'
  });
};

// ==========================================
// SHARED TEXTS
// ==========================================
export const getSharedWithMe = async () => {
  return fetchAPI('/shared/received');
};

export const getSharedByMe = async () => {
  return fetchAPI('/shared/sent');
};

export const shareText = async (data: { 
  text_id: string; 
  shared_with_user_id: string 
}) => {
  return fetchAPI('/shared/share', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
};

export const shareWithMultiple = async (data: { 
  text_id: string; 
  usernames: string[] 
}) => {
  return fetchAPI('/shared/share-multiple', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });
};

export const unshareText = async (shareId: string) => {
  return fetchAPI(`/shared/${shareId}`, { method: 'DELETE' });
};

// ==========================================
// FAVORITES
// ==========================================
export const getFavorites = async () => {
  return fetchAPI('/favorites/get-all');
};

export const addFavorite = async (textId: string) => {
  return fetchAPI('/favorites/add-favorite', {
    method: 'POST',
    body: JSON.stringify({ text_id: textId }),
  });
};

export const removeFavorite = async (textId: string) => {
  return fetchAPI(`/favorites/${textId}`, {
    method: 'DELETE',
  });
};

export const checkFavorite = async (textId: string) => {
  return fetchAPI(`/favorites/check/${textId}`);
};

// ==========================================
// ANALYTICS - Dashboard General
// ==========================================
export const getAnalyticsAll = async () => {
  return fetchAPI('/analytics/get-all');
};

// ==========================================
// ANALYTICS - Tracking de Eventos
// ==========================================

/**
 * Inicia una sesión de reproducción de audio
 * @returns {session_id} ID de la sesión para actualizar después
 */
export const trackPlayStart = async (textId: string) => {
  return fetchAPI('/analytics/track/play-start', {
    method: 'POST',
    body: JSON.stringify({ text_id: textId })
  });
};

/**
 * Actualiza el progreso de una sesión de reproducción
 * Usar cada 10 segundos mientras se reproduce
 */
export const updatePlaySession = async (
  sessionId: string, 
  durationPlayed: number, 
  completed: boolean
) => {
  return fetchAPI('/analytics/track/play-session', {
    method: 'PUT',
    body: JSON.stringify({
      session_id: sessionId,
      duration_played: Math.round(durationPlayed),
      completed
    })
  });
};

/**
 * Registra una descarga de audio
 */
export const trackAudioDownload = async (textId: string) => {
  return fetchAPI('/analytics/track/download', {
    method: 'POST',
    body: JSON.stringify({ text_id: textId })
  });
};

/**
 * Obtiene estadísticas detalladas de un texto específico
 */
export const getTextStats = async (textId: string) => {
  return fetchAPI(`/analytics/text/${textId}`);
};

// ==========================================
// WHATSAPP
// ==========================================

/**
 * Obtener configuración de WhatsApp del usuario
 */
export const getWhatsAppConfig = async () => {
  return fetchAPI('/whatsapp/config');
};

/**
 * Enviar solo audio por WhatsApp
 */
export const sendAudio = async ({
  text_id,
  to_self = true,
  to_phone,
}: {
  text_id: string;
  to_self?: boolean;
  to_phone?: string;
}) => {
  return fetchAPI('/whatsapp/send-audio', {
    method: 'POST',
    body: JSON.stringify({ text_id, to_self, to_phone }),
  });
};

/**
 * Enviar solo texto por WhatsApp
 */
export const sendText = async ({
  text_id,
  to_self = true,
  to_phone,
}: {
  text_id: string;
  to_self?: boolean;
  to_phone?: string;
}) => {
  return fetchAPI('/whatsapp/send-text', {
    method: 'POST',
    body: JSON.stringify({ text_id, to_self, to_phone }),
  });
};

/**
 * Enviar texto + audio por WhatsApp
 */
export const sendTextAndAudio = async ({
  text_id,
  to_self = true,
  to_phone,
}: {
  text_id: string;
  to_self?: boolean;
  to_phone?: string;
}) => {
  return fetchAPI('/whatsapp/send-text-and-audio', {
    method: 'POST',
    body: JSON.stringify({ text_id, to_self, to_phone }),
  });
};