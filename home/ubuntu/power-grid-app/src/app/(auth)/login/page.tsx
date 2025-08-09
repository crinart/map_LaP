// src/app/(auth)/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase'; // <— используем напрямую

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1) Логинимся в Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Неверный email или пароль'
          : `Ошибка входа: ${error.message}`);
        setLoading(false);
        return;
      }

      // 2) Подтягиваем профиль/роль из public.users
      const userId = data.user?.id;
      if (!userId) {
        setError('Не получен пользователь из Supabase');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, role, name')
        .eq('id', userId)
        .single();

      if (profileError) {
        // профиль могли не создать — не критично для входа
        console.warn('Не удалось получить профиль пользователя:', profileError.message);
      }

      // 3) Сохраняем сессию/профиль локально (по желанию)
      try {
        localStorage.setItem('sb_session', JSON.stringify(data.session));
        if (profile) localStorage.setItem('sb_profile', JSON.stringify(profile));
      } catch {}

      // 4) Переход в приложение
      router.replace('/dashboard');
    } catch (err: any) {
      setError('Произошла непредвиденная ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Управление линиями электропередач
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="worker@example.com"
              required
            />

            <Input
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Войти
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
