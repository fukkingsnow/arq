// DTO Exports - Data Transfer Objects for API validation

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface CreateBrowserSessionDto {
  name: string;
  config?: Record<string, any>;
    userId?: string;
}

export interface UpdateBrowserSessionDto {
  name?: string;
  config?: Record<string, any>;
  isActive?: boolean;
}

export interface CreateBrowserTabDto {
  sessionId: string;
  url: string;
  title?: string;
  metadata?: Record<string, any>;
}

export interface UpdateBrowserTabDto {
  url?: string;
  title?: string;
  metadata?: Record<string, any>;
}


// Browser Controller DTOs
export type CreateSessionDto = CreateBrowserSessionDto;
