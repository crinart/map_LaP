// src/types/index.ts

export interface User {
  id: string;
  email: string;
  role: 'рабочий' | 'руководитель';
  name: string;
}

export interface PowerLine {
  id: string;
  name: string;
  points: { lat: number; lng: number }[];
  created_by: string;
  created_at: string;
  created_by_name?: string;
}

export interface MapObject {
  id: string;
  type: 'опора' | 'ТП' | 'РП';
  latitude: number;
  longitude: number;
  line_id?: string;
  created_by: string;
  created_at: string;
  comments?: Comment[];
  created_by_name?: string;
}

export interface Comment {
  id: string;
  object_id: string;
  user_id: string;
  text: string;
  photo_url?: string;
  status: 'active' | 'done';
  repaired_by?: string;
  repaired_at?: string;
  created_at: string;
  user_name?: string;
}

// Глобальные типы для Яндекс.Карт
declare global {
  interface Window {
    ymaps: any;
    loadYandexMaps: (apiKey: string) => Promise<any>;
    showObjectDetails: (objectId: string) => void;
  }
}

