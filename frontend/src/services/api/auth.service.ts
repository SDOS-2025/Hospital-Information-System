import axios from 'axios';

interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
  userType: string;
}

interface LoginResponse {
  status: string;
  message: string;
  data: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      profilePicture?: string;
    };
    token: string;
  };
}

class AuthService {
  private readonly baseUrl = '/api/v1/auth';

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${this.baseUrl}/login`, {
      email: credentials.usernameOrEmail,
      password: credentials.password,
      userType: credentials.userType
    });

    // Validate user role matches selected type
    if (response.data.data.user.role !== credentials.userType) {
      throw new Error(`Invalid credentials for ${credentials.userType} login`);
    }
    
    // Store the token
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('userRole', response.data.data.user.role);
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/logout`);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();