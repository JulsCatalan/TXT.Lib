// types.ts - ACTUALIZACIÓN
// Agregar user_id al tipo Text

export interface Text {
  id: string;
  title: string;
  content: string;
  category?: string;
  audio_url?: string;
  audio_generated: boolean;
  word_count: number;
  created_at: string;
  updated_at?: string;
}

export interface SharedText {
  share_id: string;
  can_edit: boolean;
  shared_at: string;
  shared_by: {
    id: string;
    username: string;
    email: string;
  };
  text: {
    id: string;
    title: string;
    content: string;
    audio_url: string | null;
    audio_generated: boolean;
    category: string | null;
    word_count: number;
    created_at: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

// types.ts
export interface SharedUser {
  share_id: string;
  username: string;
}

export interface SharedTextGroup {
  text: {
    id: string;
    title: string;
    content: string;
    word_count: number;
    category?: string;
  };
  shared_at: string;
  users: SharedUser[];
}
