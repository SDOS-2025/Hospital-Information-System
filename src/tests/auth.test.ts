import { AuthService } from '../services/auth.service';
import { AppDataSource } from '../db/data-source';
import { User } from '../models/User';
import { UserRole } from '../types/auth.types';

describe('Authentication Tests', () => {
  let authService: AuthService;
  
  beforeAll(async () => {
    await AppDataSource.initialize();
    authService = new AuthService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  afterEach(async () => {
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.delete({ email: 'test@example.com' });
  });

  it('should register a new user', async () => {
    const result = await authService.register({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Test123!@#',
      role: UserRole.STUDENT
    }, '127.0.0.1', 'test-agent');

    expect(result).toBeDefined();
    expect(result.email).toBe('test@example.com');
    expect(result.role).toBe(UserRole.STUDENT);
  });

  it('should login user with correct credentials', async () => {
    await authService.register({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Test123!@#',
      role: UserRole.STUDENT
    }, '127.0.0.1', 'test-agent');

    const result = await authService.login(
      'test@example.com',
      'Test123!@#',
      '127.0.0.1',
      'test-agent'
    );
    
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });

  it('should fail login with incorrect password', async () => {
    await authService.register({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Test123!@#',
      role: UserRole.STUDENT
    }, '127.0.0.1', 'test-agent');

    await expect(
      authService.login(
        'test@example.com',
        'wrongpassword',
        '127.0.0.1',
        'test-agent'
      )
    ).rejects.toThrow('Invalid email or password');
  });
});