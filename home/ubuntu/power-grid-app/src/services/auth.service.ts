// src/services/auth.service.ts
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { DemoDataService } from './demo-data.service';

export class AuthService {
  // Регистрация нового пользователя
  static async signUp(email: string, password: string, name: string, role: 'рабочий' | 'руководитель' = 'рабочий') {
    // В демо-режиме используем демо-аутентификацию
    if (DemoDataService.isDemoMode()) {
      return await DemoDataService.demoSignUp(email, password, name, role);
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });

      if (error) throw error;

      // После успешной регистрации создаем профиль пользователя
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name,
            role
          });

        if (profileError) {
          console.error('Ошибка создания профиля:', profileError);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      return { data: null, error };
    }
  }

  // Вход в систему
  static async signIn(email: string, password: string) {
    // В демо-режиме используем демо-аутентификацию
    if (DemoDataService.isDemoMode()) {
      return await DemoDataService.demoSignIn(email, password);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Ошибка входа:', error);
      return { data: null, error };
    }
  }

  // Выход из системы
  static async signOut() {
    // В демо-режиме используем демо-аутентификацию
    if (DemoDataService.isDemoMode()) {
      return await DemoDataService.demoSignOut();
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Ошибка выхода:', error);
      return { error };
    }
  }

  // Получение текущего пользователя
  static async getCurrentUser(): Promise<User | null> {
    // В демо-режиме используем демо-аутентификацию
    if (DemoDataService.isDemoMode()) {
      return await DemoDataService.getDemoCurrentUser();
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Ошибка получения профиля:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      return null;
    }
  }

  // Обновление профиля пользователя
  static async updateProfile(updates: Partial<User>) {
    // В демо-режиме обновления профиля не поддерживаются
    if (DemoDataService.isDemoMode()) {
      console.log('Обновление профиля в демо-режиме не поддерживается');
      return { data: null, error: new Error('Обновление профиля в демо-режиме не поддерживается') };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Пользователь не аутентифицирован');

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      return { data: null, error };
    }
  }

  // Подписка на изменения состояния аутентификации
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    // В демо-режиме подписка на изменения не поддерживается
    if (DemoDataService.isDemoMode()) {
      return { data: { subscription: null } };
    }

    return supabase.auth.onAuthStateChange(callback);
  }
}

