import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/layout/MainLayout';
import { Students } from './features/students/pages/Students';
import theme from './styles/theme';

// Initialize React Query client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/students" replace />} />
              <Route path="admissions/*" element={<div>Admissions</div>} />
              <Route path="exams/*" element={<div>Exams</div>} />
              <Route path="faculty/*" element={<div>Faculty</div>} />
              <Route path="fees/*" element={<div>Fees</div>} />
              <Route path="grievances/*" element={<div>Grievances</div>} />
              <Route path="leaves/*" element={<div>Leaves</div>} />
              <Route path="students/*" element={<Students />} />
              <Route path="thesis/*" element={<div>Thesis</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
