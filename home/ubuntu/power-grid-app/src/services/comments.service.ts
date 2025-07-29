// src/services/comments.service.ts
import { supabase } from '@/lib/supabase';
import { Comment } from '@/types';

export class CommentsService {
  // Получение комментариев для объекта
  static async getCommentsByObjectId(objectId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users!comments_user_id_fkey (name)
        `)
        .eq('object_id', objectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(comment => ({
        ...comment,
        user_name: comment.users?.name || 'Неизвестно'
      }));
    } catch (error) {
      console.error('Ошибка получения комментариев:', error);
      throw error;
    }
  }

  // Создание нового комментария
  static async createComment(commentData: {
    object_id: string;
    text: string;
    photo_url?: string;
  }): Promise<Comment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Пользователь не аутентифицирован');
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          ...commentData,
          user_id: user.id
        })
        .select(`
          *,
          users!comments_user_id_fkey (name)
        `)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        user_name: data.users?.name || 'Неизвестно'
      };
    } catch (error) {
      console.error('Ошибка создания комментария:', error);
      throw error;
    }
  }

  // Обновление статуса комментария (отметка как выполненный)
  static async markCommentAsDone(commentId: string, repairedBy: string): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({
          status: 'done',
          repaired_by: repairedBy,
          repaired_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select(`
          *,
          users!comments_user_id_fkey (name)
        `)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        user_name: data.users?.name || 'Неизвестно'
      };
    } catch (error) {
      console.error('Ошибка обновления статуса комментария:', error);
      throw error;
    }
  }

  // Обновление комментария
  static async updateComment(commentId: string, updates: Partial<Comment>): Promise<Comment> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update(updates)
        .eq('id', commentId)
        .select(`
          *,
          users!comments_user_id_fkey (name)
        `)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        user_name: data.users?.name || 'Неизвестно'
      };
    } catch (error) {
      console.error('Ошибка обновления комментария:', error);
      throw error;
    }
  }

  // Удаление комментария
  static async deleteComment(commentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
      throw error;
    }
  }

  // Загрузка фотографии
  static async uploadPhoto(file: File, commentId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${commentId}-${Date.now()}.${fileExt}`;
      const filePath = `comments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('comment-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('comment-photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Ошибка загрузки фотографии:', error);
      throw error;
    }
  }

  // Удаление фотографии
  static async deletePhoto(photoUrl: string): Promise<void> {
    try {
      // Извлекаем путь к файлу из URL
      const urlParts = photoUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // comments/filename.ext

      const { error } = await supabase.storage
        .from('comment-photos')
        .remove([filePath]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Ошибка удаления фотографии:', error);
      throw error;
    }
  }
}

