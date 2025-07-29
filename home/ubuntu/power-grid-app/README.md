# Управление ЛЭП - Веб-приложение для управления линиями электропередач

## Описание

Полнофункциональное веб-приложение для управления линиями электропередач (ЛЭП) с интерактивной картой, системой ролей и комментированием.

## Технологии

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Карты:** Яндекс.Карты API
- **Развертывание:** Vercel

## Функционал

### Аутентификация и роли
- **Руководитель:** Полный доступ (создание линий, объектов, управление)
- **Рабочий:** Просмотр карты, добавление комментариев

### Интерактивная карта
- Отображение линий ЛЭП и объектов
- Создание новых объектов кликом по карте
- Рисование линий ЛЭП
- Цветовая индикация статусов

### Система комментирования
- Добавление комментариев к объектам
- Загрузка фотографий
- Отметка ремонтов как выполненных
- История комментариев

## Демо-режим

Приложение работает в демо-режиме с локальными данными:

**Демо-аккаунты:**
- **Руководитель:** demo@example.com / demo123
- **Рабочий:** worker@example.com / worker123

## Развертывание

### 1. Vercel (рекомендуется)

```bash
# Клонировать репозиторий
git clone <repository-url>
cd power-grid-app

# Установить зависимости
npm install

# Развернуть на Vercel
vercel --prod
```

**Переменные окружения для Vercel:**
```
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=0ecb4dd6-bda0-465d-9ca1-901eca901307
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Netlify

```bash
# Сборка проекта
npm run build

# Загрузить папку .next на Netlify
```

### 3. VPS/Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## Настройка Supabase (для продакшена)

1. Создать проект на supabase.com
2. Выполнить SQL-скрипт из `supabase-setup.sql`
3. Настроить Storage bucket "comment-photos"
4. Обновить переменные окружения

## Локальная разработка

```bash
# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev

# Открыть http://localhost:3000
```

## Структура проекта

```
src/
├── app/                 # Next.js App Router
├── components/          # React компоненты
├── hooks/              # Пользовательские хуки
├── lib/                # Утилиты и конфигурация
├── services/           # API сервисы
└── types/              # TypeScript типы
```

## API-ключи

- **Яндекс.Карты:** 0ecb4dd6-bda0-465d-9ca1-901eca901307
- **Vercel:** zbzGpanZk4Mt3wMbroLNevzm

## Поддержка

Для вопросов и поддержки обращайтесь к разработчику.

