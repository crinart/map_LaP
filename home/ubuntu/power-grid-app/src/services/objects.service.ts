// src/services/objects.service.ts
import { supabase } from '@/lib/supabase';
import { MapObject } from '@/types';

export class ObjectsService {
  // Получение всех объектов с комментариями
  static async getAllObjects(): Promise<MapObject[]> {
    try {
      const { data, error } = await supabase
        .from('objects')
        .select(`
          *,
          comments (
            id,
            text,
            photo_url,
            status,
            repaired_by,
            repaired_at,
            created_at,
            user_id,
            users!comments_user_id_fkey (name)
          ),
          users!objects_created_by_fkey (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(obj => ({
        ...obj,
        comments: obj.comments.map((comment: any) => ({
          ...comment,
          user_name: comment.users?.name || 'Неизвестно'
        })),
        created_by_name: obj.users?.name || 'Неизвестно'
      }));
    } catch (error) {
      console.error('Ошибка получения объектов:', error);
      throw error;
    }
  }

  // Создание нового объекта
  static async createObject(objectData: {
    type: 'опора' | 'ТП' | 'РП';
    latitude: number;
    longitude: number;
    line_id?: string;
  }): Promise<MapObject> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Пользователь не аутентифицирован');
      }

      const { data, error } = await supabase
        .from('objects')
        .insert({
          ...objectData,
          created_by: user.id
        })
        .select(`
          *,
          users!objects_created_by_fkey (name)
        `)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        comments: [],
        created_by_name: data.users?.name || 'Неизвестно'
      };
    } catch (error) {
      console.error('Ошибка создания объекта:', error);
      throw error;
    }
  }

  // Обновление объекта
  static async updateObject(objectId: string, updates: Partial<MapObject>): Promise<MapObject> {
    try {
      const { data, error } = await supabase
        .from('objects')
        .update(updates)
        .eq('id', objectId)
        .select(`
          *,
          comments (
            id,
            text,
            photo_url,
            status,
            repaired_by,
            repaired_at,
            created_at,
            user_id,
            users!comments_user_id_fkey (name)
          ),
          users!objects_created_by_fkey (name)
        `)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        comments: data.comments.map((comment: any) => ({
          ...comment,
          user_name: comment.users?.name || 'Неизвестно'
        })),
        created_by_name: data.users?.name || 'Неизвестно'
      };
    } catch (error) {
      console.error('Ошибка обновления объекта:', error);
      throw error;
    }
  }

  // Удаление объекта
  static async deleteObject(objectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('objects')
        .delete()
        .eq('id', objectId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Ошибка удаления объекта:', error);
      throw error;
    }
  }

  // Получение объектов в определенной области
  static async getObjectsInBounds(
    bounds: [[number, number], [number, number]]
  ): Promise<MapObject[]> {
    try {
      const [[southWest_lat, southWest_lng], [northEast_lat, northEast_lng]] = bounds;

      const { data, error } = await supabase
        .from('objects')
        .select(`
          *,
          comments (
            id,
            text,
            photo_url,
            status,
            repaired_by,
            repaired_at,
            created_at,
            user_id,
            users!comments_user_id_fkey (name)
          ),
          users!objects_created_by_fkey (name)
        `)
        .gte('latitude', Math.min(southWest_lat, northEast_lat))
        .lte('latitude', Math.max(southWest_lat, northEast_lat))
        .gte('longitude', Math.min(southWest_lng, northEast_lng))
        .lte('longitude', Math.max(southWest_lng, northEast_lng));

      if (error) {
        throw error;
      }

      return data.map(obj => ({
        ...obj,
        comments: obj.comments.map((comment: any) => ({
          ...comment,
          user_name: comment.users?.name || 'Неизвестно'
        })),
        created_by_name: obj.users?.name || 'Неизвестно'
      }));
    } catch (error) {
      console.error('Ошибка получения объектов в области:', error);
      throw error;
    }
  }
}

