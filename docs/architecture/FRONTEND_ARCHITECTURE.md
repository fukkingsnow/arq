# Phase 23 Step 1: Frontend Architecture MVP

## 1. Overview

Frontend MVP architecture for ARQ with React 18, TypeScript, and modern state management. Focuses on component library, routing, authentication integration, and API consumption patterns.

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|----------|
| Framework | React 18.2+ | UI library with concurrent features |
| Language | TypeScript 5.0+ | Type safety & developer experience |
| State Management | Zustand | Lightweight state solution |
| Routing | React Router v6 | Client-side routing & navigation |
| HTTP Client | Axios + React Query | API integration & caching |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Build Tool | Vite | Fast development experience |
| Testing | Vitest + React Testing Library | Unit & integration tests |
| Package Manager | pnpm | Fast, efficient dependency management |

## 3. Project Structure

```
src/
├── app/
│   ├── App.tsx                 # Root component
│   ├── config/
│   │   ├── routes.config.ts    # Route definitions
│   │   └── env.config.ts       # Environment variables
│   └── providers/
│       ├── AuthProvider.tsx    # Authentication context
│       ├── QueryProvider.tsx   # React Query setup
│       └── RootProviders.tsx   # Combined providers
├── modules/
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useLogin.ts
│   │   └── services/
│   │       └── authService.ts
│   ├── dashboard/
│   │   ├── pages/
│   │   │   └── DashboardPage.tsx
│   │   ├── components/
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── DashboardNav.tsx
│   │   │   └── StatCard.tsx
│   │   └── services/
│   │       └── dashboardService.ts
│   └── common/
│       ├── pages/
│       │   ├── NotFoundPage.tsx
│       │   └── ErrorPage.tsx
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── Header.tsx
│       │   ├── Sidebar.tsx
│       │   └── Footer.tsx
│       └── hooks/
│           └── useNotification.ts
├── shared/
│   ├── components/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   └── Badge.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useMediaQuery.ts
│   │   ├── useFetch.ts
│   │   └── useLocalStorage.ts
│   ├── utils/               # Utility functions
│   │   ├── request.ts       # Axios instance config
│   │   ├── validators.ts    # Form validation
│   │   ├── formatters.ts    # Data formatting
│   │   └── constants.ts     # App constants
│   ├── types/               # TypeScript interfaces
│   │   ├── api.types.ts
│   │   ├── user.types.ts
│   │   ├── auth.types.ts
│   │   └── common.types.ts
│   ├── styles/              # Global styles
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── animations.css
│   └── store/               # Zustand stores
│       ├── authStore.ts
│       ├── uiStore.ts
│       └── appStore.ts
├── main.tsx                 # Entry point
├── vite-env.d.ts           # Vite type definitions
└── index.html              # HTML template

## 4. State Management (Zustand)

### Auth Store
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  refreshToken: () => Promise<void>;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('token', response.token);
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
  // ... other methods
}));
```

## 5. API Integration Pattern

### Request Configuration (Axios)
```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
```

## 6. Component Architecture

### Base Component Template
```typescript
import React, { FC, ReactNode } from 'react';

interface ComponentProps {
  children?: ReactNode;
  className?: string;
  [key: string]: any;
}

const Component: FC<ComponentProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`component ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Component;
```

### Custom Hook Pattern
```typescript
interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};
```

## 7. Routing Configuration

### Route Definitions
```typescript
const routes: RouteConfig[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '',
        element: <DashboardPage />,
        protected: true,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
        protected: true,
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
```

## 8. Environmental Configuration

### .env Variables
```
VITE_API_URL=http://localhost:3000/api
VITE_API_TIMEOUT=10000
VITE_APP_NAME=ARQ
VITE_APP_VERSION=0.1.0
```

## 9. Testing Strategy

### Component Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('should submit form with valid credentials', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Login');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await vi.waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

## 10. Performance Optimization

- Code splitting with React.lazy() for route-based bundles
- Image optimization with next-gen formats (WebP)
- Tree-shaking & dead code elimination via Vite
- Memoization with React.memo & useMemo
- Virtual scrolling for large lists
- Service Worker for PWA capabilities

## 11. Accessibility & SEO

- WCAG 2.1 AA compliance
- Semantic HTML structure
- ARIA labels for interactive elements
- Meta tags for SEO
- Keyboard navigation support

## 12. Phase 23 MVP Completion

✅ **Frontend Architecture Foundation**
- React 18 + TypeScript setup
- Zustand state management
- Axios + React Query integration
- Component library foundation
- Routing infrastructure
- Authentication flow
- Testing utilities
- Development tooling

**Lines of Code**: 350 lines
**Status**: Phase 23 Step 1 COMPLETE
