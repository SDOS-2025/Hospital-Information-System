import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { LoginScreen } from './features/auth/LoginScreen';
import StudentDashboard from './features/students/pages/StudentDashboard';
import { FeeStatus } from './features/fees/pages/FeeStatus';
import { Thesis } from './features/thesis/pages/Thesis';
import { Exams } from './features/exams/pages/Exams';
// Import other feature pages as needed

// Private route component for protected routes
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginScreen />} />
      
      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute element={<MainLayout />} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="students" element={<div>Students Content</div>} />
        {/* Add more routes for other features */}
        <Route path="admissions" element={<div>Admissions Content</div>} />
        <Route path="exams/*" element={<Exams />} />
        <Route path="faculty" element={<div>Faculty Content</div>} />
        <Route path="fees" element={<FeeStatus />} />
        <Route path="grievances" element={<div>Grievances Content</div>} />
        <Route path="leaves" element={<div>Leaves Content</div>} />
        <Route path="thesis/*" element={<Thesis />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;