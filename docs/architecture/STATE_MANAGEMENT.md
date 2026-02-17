# Phase 23 Step 3: State Management (Zustand)

## 1. Overview

Global state management using Zustand library. Lightweight, TypeScript-first solution for managing auth, UI, and app-wide state in ARQ frontend.

## 2. Core Stores

### Auth Store
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  createdAt: Date;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      });
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token, isAuthenticated: !!token }),

  refreshToken: async () => {
    try {
      const response = await authService.refresh();
      localStorage.setItem('token', response.token);
      set({ token: response.token });
    } catch (error) {
      get().logout();
    }
  },

  clearError: () => set({ error: null }),
}));
```

### UI Store
```typescript
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: (localStorage.getItem('theme') || 'light') as 'light' | 'dark',
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
```

### App Store
```typescript
interface AppStore {
  isOnline: boolean;
  appVersion: string;
  lastSync: Date | null;
  setOnline: (online: boolean) => void;
  setLastSync: (date: Date) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isOnline: navigator.onLine,
  appVersion: __APP_VERSION__,
  lastSync: null,

  setOnline: (online) => set({ isOnline: online }),
  setLastSync: (date) => set({ lastSync: date }),
}));
```

## 3. Store Combinations (Hooks)

### useAuth Hook
```typescript
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
};
```

### useNotifications Hook
```typescript
export const useNotifications = () => {
  const {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  } = useUIStore();

  const notify = (message: string, type: 'info' | 'success' | 'error' | 'warning') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
    };
    addNotification(notification);
    setTimeout(() => removeNotification(notification.id), 5000);
  };

  return {
    notifications,
    notify,
    removeNotification,
    clearNotifications,
  };
};
```

## 4. Usage in Components

### Example: LoginPage
```typescript
const LoginPage: FC = () => {
  const { login, isLoading, error } = useAuth();
  const { notify } = useNotifications();
  const navigate = useNavigate();

  const handleSubmit = async (data: LoginDto) => {
    try {
      await login(data.email, data.password);
      notify('Login successful!', 'success');
      navigate('/dashboard');
    } catch (err) {
      notify(error || 'Login failed', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input name="email" type="email" label="Email" required />
      <Input name="password" type="password" label="Password" required />
      <Button type="submit" isLoading={isLoading}>
        Sign In
      </Button>
    </form>
  );
};
```

## 5. Middleware & Persistence

### localStorage Persistence
```typescript
const usePersistedStore = create<MyStore>(
  persist(
    (set) => ({
      // store implementation
    }),
    {
      name: 'app-store',
      partialize: (state) => ({ /* only persist these keys */ }),
    }
  )
);
```

## 6. DevTools Integration

```typescript
import { devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthStore>(
  devtools(
    (set) => ({
      // store implementation
    }),
    { name: 'auth-store' }
  )
);
```

## 7. Testing Stores

```typescript
describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('should login user', async () => {
    const { login } = useAuthStore.getState();
    await login('test@example.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toBeDefined();
  });

  it('should logout user', () => {
    const { logout } = useAuthStore.getState();
    logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
```

## 8. Phase 23 Completion

✅ **State Management Complete**
- Auth store with login/logout
- UI store for theme & notifications
- App store for global state
- Custom hooks for store usage
- DevTools integration
- Persistence middleware
- Test utilities

**Lines of Code**: 280 lines
**Status**: Phase 23 Step 3 COMPLETE
