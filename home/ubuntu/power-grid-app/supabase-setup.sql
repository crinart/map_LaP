-- Supabase Setup SQL Script
-- Этот скрипт создает все необходимые таблицы и политики безопасности

-- 1. Создание таблицы пользователей
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN (
        'рабочий',
        'руководитель'
    )),
    name TEXT NOT NULL
);

-- Включение Row Level Security (RLS) для таблицы users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы users
CREATE POLICY "Users can read their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all user data" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'руководитель'));
CREATE POLICY "Users can insert their own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can delete user data" ON public.users FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'руководитель'));

-- 2. Создание таблицы линий электропередач
CREATE TABLE public.power_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    points JSONB NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Включение Row Level Security (RLS) для таблицы power_lines
ALTER TABLE public.power_lines ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы power_lines
CREATE POLICY "Authenticated users can read power_lines" ON public.power_lines FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can insert power_lines" ON public.power_lines FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'руководитель'));
CREATE POLICY "Managers can update power_lines" ON public.power_lines FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'руководитель'));
CREATE POLICY "Managers can delete power_lines" ON public.power_lines FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'руководитель'));

-- 3. Создание таблицы объектов
CREATE TABLE public.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN (
        'опора',
        'ТП',
        'РП'
    )),
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    line_id UUID REFERENCES public.power_lines(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Включение Row Level Security (RLS) для таблицы objects
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы objects
CREATE POLICY "Authenticated users can read objects" ON public.objects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can insert objects" ON public.objects FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'руководитель'));
CREATE POLICY "Managers can update objects" ON public.objects FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'руководитель'));
CREATE POLICY "Managers can delete objects" ON public.objects FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'руководитель'));

-- 4. Создание таблицы комментариев
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id UUID REFERENCES public.objects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active',
        'done'
    )),
    repaired_by TEXT,
    repaired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Включение Row Level Security (RLS) для таблицы comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы comments
CREATE POLICY "Authenticated users can read comments" ON public.comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Managers can update comment status" ON public.comments FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'руководитель'));
CREATE POLICY "Managers can delete comments" ON public.comments FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'руководитель'));

-- 5. Создание bucket для хранения фотографий
-- Это нужно выполнить через интерфейс Supabase Storage или через API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('comment-photos', 'comment-photos', true);

-- 6. Политики для Storage bucket 'comment-photos'
-- CREATE POLICY "Allow authenticated users to upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'comment-photos' AND auth.role() = 'authenticated');
-- CREATE POLICY "Allow authenticated users to view photos" ON storage.objects FOR SELECT USING (bucket_id = 'comment-photos' AND auth.role() = 'authenticated');

-- 7. Создание функции для автоматического создания профиля пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, name)
  VALUES (
    NEW.id,
    NEW.email,
    'рабочий', -- роль по умолчанию
    COALESCE(NEW.raw_user_meta_data->>'name', 'Новый пользователь')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Создание триггера для автоматического создания профиля
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

