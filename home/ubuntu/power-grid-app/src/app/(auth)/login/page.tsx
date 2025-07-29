// src/app/(auth)/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Импортируй supabase, если используешь его напрямую
import { supabase } from '@/lib/supabase';
// Импортируй useAuth, если используешь глобальный хук авторизации
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'рабочий' | 'руководитель'>('рабочий');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth?.() || {}; // Используй хук, если реализован
  const router = useRouter();

  // Перенаправление, если пользователь уже авторизован (через Supabase)
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // --- ЖЁСТКИЕ ПОЛЬЗОВАТЕЛИ ДЛЯ ОБХОДА АВТОРИЗАЦИИ ---
  const HARDCODE_USERS = [
    { email: "admin@test.com", password: "admin123", name: "Супер Руководитель", role: "руководитель" },
    { email: "worker@test.com", password: "worker123", name: "Рабочий Вася", role: "рабочий" }
  ];

  // Основная обработка формы входа/регистрации
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Сначала проверяем на "жёстких" пользователей
    const found = HARDCODE_USERS.find(
      u => u.email === email && u.password === password
    );
    if (found) {
      // Для имитации авторизации сохраняем в localStorage и делаем редирект
      localStorage.setItem("fakeUser", JSON.stringify(found));
      router.push('/dashboard');
      setLoading(false);
      return;
    }

    // 2. Если не найден, используем настоящую регистрацию/авторизацию через Supabase
    if (isSignUp) {
      // Регистрация
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        // Создаём профиль в таблице users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: signUpData.user.id,
            email,
            name,
            role,
          });

        if (profileError) {
          setError(profileError.message);
        } else {
          router.push('/dashboard');
        }
      }
      setLoading(false);
    } else {
      // Вход
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Неверный email или пароль');
      } else {
        router.push('/dashboard');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          {isSignUp ? 'Создание аккаунта' : 'Вход в систему'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <input
              type="text"
              placeholder="Ваше полное имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Пароль (не менее 6 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isSignUp && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'рабочий' | 'руководитель')}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="рабочий">Я - Рабочий</option>
              <option value="руководитель">Я - Руководитель</option>
            </select>
          )}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-blue-400"
          >
            {loading ? 'Загрузка...' : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          {isSignUp ? 'Уже есть аккаунт?' : 'Впервые здесь?'}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-blue-600 hover:underline ml-1"
          >
            {isSignUp ? 'Войти' : 'Создать аккаунт'}
          </button>
        </p>
        <div className="mt-4 text-xs text-gray-400">
          <p>Для теста можно войти под <b>admin@test.com / admin123</b> (руководитель)</p>
          <p>или <b>worker@test.com / worker123</b> (рабочий)</p>
        </div>
      </div>
    </div>
  );
}
