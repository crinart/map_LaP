// src/services/demo-data.service.ts
import { MapObject, PowerLine, Comment, User } from '@/types';

export class DemoDataService {
  // Демо-пользователи для аутентификации
  private static demoUsers: User[] = [
    {
      id: 'demo-user-1',
      email: 'demo@example.com',
      name: 'Демо Пользователь',
      role: 'рабочий',
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  // Демо-пароли (в реальном приложении пароли должны быть хешированы)
  private static demoPasswords: { [email: string]: string } = {
    'demo@example.com': 'demo123'
  };

  // Текущий демо-пользователь
  private static currentDemoUser: User | null = null;

  // Демо-аутентификация: регистрация
  static async demoSignUp(email: string, password: string, name: string, role: 'рабочий' | 'руководитель' = 'рабочий') {
    try {
      // Проверяем, не существует ли уже пользователь с таким email
      const existingUser = this.demoUsers.find(user => user.email === email);
      if (existingUser) {
        throw new Error('Пользователь с таким email уже существует');
      }

      // Создаем нового демо-пользователя
      const newUser: User = {
        id: `demo-user-${Date.now()}`,
        email,
        name,
        role,
        created_at: new Date().toISOString()
      };

      // Добавляем пользователя и пароль
      this.demoUsers.push(newUser);
      this.demoPasswords[email] = password;
      this.currentDemoUser = newUser;

      return { 
        data: { 
          user: newUser,
          session: { user: newUser }
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Демо-аутентификация: вход
  static async demoSignIn(email: string, password: string) {
    try {
      // Ищем пользователя
      const user = this.demoUsers.find(u => u.email === email);
      if (!user) {
        throw new Error('Неверный email или пароль');
      }

      // Проверяем пароль
      if (this.demoPasswords[email] !== password) {
        throw new Error('Неверный email или пароль');
      }

      this.currentDemoUser = user;

      return { 
        data: { 
          user,
          session: { user }
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Демо-аутентификация: выход
  static async demoSignOut() {
    this.currentDemoUser = null;
    return { error: null };
  }

  // Демо-аутентификация: получение текущего пользователя
  static async getDemoCurrentUser(): Promise<User | null> {
    return this.currentDemoUser;
  }

  // Демо-данные для объектов
  static getDemoObjects(): MapObject[] {
    return [
      {
        id: '1',
        type: 'опора',
        latitude: 55.7558,
        longitude: 37.6176,
        created_by: 'demo-user',
        created_at: '2024-01-15T10:00:00Z',
        created_by_name: 'Иван Петров',
        comments: [
          {
            id: '1',
            object_id: '1',
            user_id: 'demo-user',
            text: 'Обнаружена коррозия на опоре, требует внимания',
            photo_url: undefined,
            status: 'active',
            created_at: '2024-01-16T14:30:00Z',
            user_name: 'Сергей Иванов'
          }
        ]
      },
      {
        id: '2',
        type: 'ТП',
        latitude: 55.7520,
        longitude: 37.6156,
        created_by: 'demo-user',
        created_at: '2024-01-10T09:00:00Z',
        created_by_name: 'Иван Петров',
        comments: [
          {
            id: '2',
            object_id: '2',
            user_id: 'demo-user',
            text: 'Плановое обслуживание выполнено',
            photo_url: undefined,
            status: 'done',
            repaired_by: 'Михаил Сидоров',
            repaired_at: '2024-01-17T16:00:00Z',
            created_at: '2024-01-17T12:00:00Z',
            user_name: 'Алексей Козлов'
          }
        ]
      },
      {
        id: '3',
        type: 'РП',
        latitude: 55.7580,
        longitude: 37.6200,
        created_by: 'demo-user',
        created_at: '2024-01-12T11:00:00Z',
        created_by_name: 'Иван Петров',
        comments: []
      },
      {
        id: '4',
        type: 'опора',
        latitude: 55.7540,
        longitude: 37.6180,
        created_by: 'demo-user',
        created_at: '2024-01-14T13:00:00Z',
        created_by_name: 'Иван Петров',
        comments: [
          {
            id: '3',
            object_id: '4',
            user_id: 'demo-user',
            text: 'Требуется замена изоляторов',
            photo_url: undefined,
            status: 'active',
            created_at: '2024-01-18T09:15:00Z',
            user_name: 'Дмитрий Волков'
          },
          {
            id: '4',
            object_id: '4',
            user_id: 'demo-user',
            text: 'Изоляторы заменены, проверка выполнена',
            photo_url: undefined,
            status: 'done',
            repaired_by: 'Николай Морозов',
            repaired_at: '2024-01-19T15:30:00Z',
            created_at: '2024-01-19T15:30:00Z',
            user_name: 'Николай Морозов'
          }
        ]
      }
    ];
  }

  // Демо-данные для линий ЛЭП
  static getDemoPowerLines(): PowerLine[] {
    return [
      {
        id: '1',
        name: 'Линия ЛЭП-110 "Центральная"',
        points: [
          { lat: 55.7558, lng: 37.6176 },
          { lat: 55.7540, lng: 37.6180 },
          { lat: 55.7520, lng: 37.6156 },
          { lat: 55.7580, lng: 37.6200 }
        ],
        created_by: 'demo-user',
        created_at: '2024-01-10T08:00:00Z',
        created_by_name: 'Иван Петров'
      },
      {
        id: '2',
        name: 'Линия ЛЭП-35 "Северная"',
        points: [
          { lat: 55.7600, lng: 37.6100 },
          { lat: 55.7620, lng: 37.6120 },
          { lat: 55.7640, lng: 37.6140 }
        ],
        created_by: 'demo-user',
        created_at: '2024-01-08T10:00:00Z',
        created_by_name: 'Иван Петров'
      }
    ];
  }

  // Проверка, используются ли демо-данные
  static isDemoMode(): boolean {
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || 
           process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co';
  }
}

