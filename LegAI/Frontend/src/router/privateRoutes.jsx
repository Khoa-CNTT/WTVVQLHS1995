import { Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard/Dashboard';
import Profile from '../pages/Profile/Profile';

// const isAuthenticated = () => {
//   return !!localStorage.getItem('token');
// };

const PrivateRoutes = () => {
  return isAuthenticated() ? (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoutes;