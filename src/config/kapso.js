import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';

export const kapso = new WhatsAppClient({
  baseUrl: 'https://api.kapso.ai/meta/whatsapp',
  kapsoApiKey: process.env.KAPSO_API_KEY
});

