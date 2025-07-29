// src/hooks/useAuth.ts
'use client';

import { useState, useEffect, useContext } from 'react';
import { User } from '@/types';
import { AuthService } from '@/services/auth.service';
import { AuthContext } from '@/components/AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем, настроен ли Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
      // Демо-режим: используем локальное хранилище
      const savedUser = localStorage.getItem('demo-user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    } else {
      // Реальный режим: используем Supabase
      const getCurrentUser = async () => {
        try {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Ошибка получения пользователя:', error);
        } finally {
          setLoading(false);
        }
      };

      getCurrentUser();

      // Подписываемся на изменения состояния аутентификации
      const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: проверяем демо-учетные данные
        if (email === 'demo@example.com' && password === 'demo123') {
          const demoUser: User = {
            id: 'demo-user-id',
            email: 'demo@example.com',
            name: 'Демо Пользователь',
            role: 'руководитель'
          };
          setUser(demoUser);
          localStorage.setItem('demo-user', JSON.stringify(demoUser));
          return { error: null };
        } else if (email === 'worker@example.com' && password === 'worker123') {
          const demoWorker: User = {
            id: 'demo-worker-id',
            email: 'worker@example.com',
            name: 'Демо Рабочий',
            role: 'рабочий'
          };
          setUser(demoWorker);
          localStorage.setItem('demo-user', JSON.stringify(demoWorker));
          return { error: null };
        } else {
          return { error: 'Неверные учетные данные для демо-режима' };
        }
      } else {
        // Реальный режим: используем Supabase
        const { data, error } = await AuthService.signIn(email, password);
        if (!error && data.user) {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        }
        return { error };
      }
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'рабочий' | 'руководитель' = 'рабочий') => {
    setLoading(true);
    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: создаем демо-пользователя
        const demoUser: User = {
          id: `demo-${Date.now()}`,
          email,
          name,
          role
        };
        setUser(demoUser);
        localStorage.setItem('demo-user', JSON.stringify(demoUser));
        return { error: null };
      } else {
        // Реальный режим: используем Supabase
        const { data, error } = await AuthService.signUp(email, password, name, role);
        if (!error && data.user) {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        }
        return { error };
      }
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: очищаем локальное хранилище
        localStorage.removeItem('demo-user');
        setUser(null);
      } else {
        // Реальный режим: используем Supabase
        await AuthService.signOut();
        setUser(null);
      }
    } catch (error) {
      console.error('Ошибка выхода:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: обновляем локально
        if (user) {
          const updatedUser = { ...user, ...updates };
          setUser(updatedUser);
          localStorage.setItem('demo-user', JSON.stringify(updatedUser));
          return { error: null };
        }
        return { error: 'Пользователь не найден' };
      } else {
        // Реальный режим: используем Supabase
        const { data, error } = await AuthService.updateProfile(updates);
        if (!error && data) {
          setUser(data);
        }
        return { error };
      }
    } catch (error) {
      return { error };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  };
};

