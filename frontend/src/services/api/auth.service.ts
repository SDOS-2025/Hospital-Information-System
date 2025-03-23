import axios from 'axios';

interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

class AuthService {
  private readonly baseUrl = '/api/v1/auth';

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${this.baseUrl}/login`, credentials);
    const { accessToken } = response.data;
    
    // Store the token
    localStorage.setItem('accessToken', accessToken);
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/logout`);
    } finally {
      localStorage.removeItem('accessToken');
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();