import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Container,
  CircularProgress,
  IconButton,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/api/auth.service';
import { Notification } from '../../components/common/Notification';

interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
  userType: 'student' | 'faculty' | 'admin';
}

interface FormErrors {
  usernameOrEmail?: string;
  password?: string;
}

export const LoginScreen: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    usernameOrEmail: '',
    password: '',
    userType: 'student'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  const navigate = useNavigate();
  
  const loginMutation = useMutation({
    mutationFn: (data: LoginCredentials) => authService.login(data),
    onSuccess: () => {
      setNotification({
        open: true,
        message: 'Login successful!',
        severity: 'success'
      });
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      setNotification({
        open: true,
        message: error.message || 'Failed to login. Please try again.',
        severity: 'error'
      });
    }
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!credentials.usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = 'Username or email is required';
      isValid = false;
    }

    if (!credentials.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      loginMutation.mutate(credentials);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification((prev) => ({
      ...prev,
      open: false
    }));
  };

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'student' | 'faculty' | 'admin') => {
    setCredentials(prev => ({
      ...prev,
      userType: newValue
    }));
  };
  
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d1deee 100%)',
        overflow: 'hidden'
      }}
      component="main"
      role="main"
    >
      <Container 
        maxWidth={false}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          m: 0,
          p: 0
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            overflow: 'hidden',
            width: { xs: '95%', sm: '450px' },
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <Box 
            sx={{ 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 4,
              pb: 3,
              bgcolor: '#fff'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box 
                component="img" 
                src="/logo.png" 
                alt="Hospital Logo" 
                sx={{ 
                  height: 50, 
                  mr: 2 
                }} 
              />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0a2472', lineHeight: 1.2 }}>
                  HINDURAO HOSPITAL MEDICAL COLLEGE
                </Typography>
                <Typography variant="subtitle2" sx={{ color: '#555' }}>
                  Enterprise Resource Planning System
                </Typography>
              </Box>
            </Box>
          </Box>

          <Tabs 
            value={credentials.userType} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{ 
              width: '100%', 
              bgcolor: '#f5f5f5', 
              '& .MuiTabs-indicator': { 
                backgroundColor: '#122870' 
              } 
            }}
          >
            <Tab 
              label="Student" 
              value="student"
              sx={{ 
                textTransform: 'none', 
                fontWeight: 500,
                '&.Mui-selected': { color: '#122870' }
              }} 
            />
            <Tab 
              label="Faculty" 
              value="faculty" 
              sx={{ 
                textTransform: 'none', 
                fontWeight: 500,
                '&.Mui-selected': { color: '#122870' }
              }} 
            />
            <Tab 
              label="Admin" 
              value="admin" 
              sx={{ 
                textTransform: 'none', 
                fontWeight: 500,
                '&.Mui-selected': { color: '#122870' }
              }} 
            />
          </Tabs>
          
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ width: '100%', p: 4 }}
            noValidate
            aria-label="Login form"
          >
            <Typography variant="body1" sx={{ mb: 0.5, fontWeight: 500 }}>
              Username or Email
            </Typography>
            <TextField
              fullWidth
              id="usernameOrEmail"
              name="usernameOrEmail"
              placeholder="Enter username or email"
              value={credentials.usernameOrEmail}
              onChange={handleChange}
              variant="outlined"
              size="small"
              error={!!errors.usernameOrEmail}
              helperText={errors.usernameOrEmail}
              disabled={loginMutation.isPending}
              inputProps={{
                'aria-label': 'Username or email'
              }}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body1" sx={{ mb: 0.5, fontWeight: 500 }}>
              Password
            </Typography>
            <TextField
              fullWidth
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={credentials.password}
              onChange={handleChange}
              variant="outlined"
              size="small"
              error={!!errors.password}
              helperText={errors.password}
              disabled={loginMutation.isPending}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={handleTogglePassword}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              inputProps={{
                'aria-label': 'Password'
              }}
              sx={{ mb: 1 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                color="primary" 
                size="small" 
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '0.75rem',
                  p: 0
                }}
              >
                Forgot password
              </Button>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loginMutation.isPending}
              aria-label={loginMutation.isPending ? 'Logging in...' : 'Log in'}
              sx={{ 
                py: 1, 
                textTransform: 'none',
                backgroundColor: '#142c8e', 
                '&:hover': { backgroundColor: '#0d1c57' }
              }}
            >
              {loginMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Log in'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
      
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
      />
    </Box>
  );
};

export default LoginScreen;