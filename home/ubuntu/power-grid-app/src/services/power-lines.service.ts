// src/services/power-lines.service.ts
import { supabase } from '@/lib/supabase';
import { PowerLine } from '@/types';

export class PowerLinesService {
  // Получение всех линий
  static async getAllPowerLines(): Promise<PowerLine[]> {
    try {
      const { data, error } = await supabase
        .from('power_lines')
        .select(`
          *,
          users!power_lines_created_by_fkey (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(line => ({
        ...line,
        created_by_name: line.users?.name || 'Неизвестно'
      }));
    } catch (error) {
      console.error('Ошибка получения линий:', error);
      throw error;
    }
  }

  // Создание новой линии
  static async createPowerLine(lineData: {
    name: string;
    points: { lat: number; lng: number }[];
  }): Promise<PowerLine> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Пользователь не аутентифицирован');
      }

      const { data, error } = await supabase
        .from('power_lines')
        .insert({
          ...lineData,
          created_by: user.id
        })
        .select(`
          *,
          users!power_lines_created_by_fkey (name)
        `)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        created_by_name: data.users?.name || 'Неизвестно'
      };
    } catch (error) {
      console.error('Ошибка создания линии:', error);
      throw error;
    }
  }

  // Обновление линии
  static async updatePowerLine(lineId: string, updates: Partial<PowerLine>): Promise<PowerLine> {
    try {
      const { data, error } = await supabase
        .from('power_lines')
        .update(updates)
        .eq('id', lineId)
        .select(`
          *,
          users!power_lines_created_by_fkey (name)
        `)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        created_by_name: data.users?.name || 'Неизвестно'
      };
    } catch (error) {
      console.error('Ошибка обновления линии:', error);
      throw error;
    }
  }

  // Удаление линии
  static async deletePowerLine(lineId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('power_lines')
        .delete()
        .eq('id', lineId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Ошибка удаления линии:', error);
      throw error;
    }
  }

  // Получение линии по ID
  static async getPowerLineById(lineId: string): Promise<PowerLine | null> {
    try {
      const { data, error } = await supabase
        .from('power_lines')
        .select(`
          *,
          users!power_lines_created_by_fkey (name)
        `)
        .eq('id', lineId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Линия не найдена
        }
        throw error;
      }

      return {
        ...data,
        created_by_name: data.users?.name || 'Неизвестно'
      };
    } catch (error) {
      console.error('Ошибка получения линии:', error);
      throw error;
    }
  }
}

