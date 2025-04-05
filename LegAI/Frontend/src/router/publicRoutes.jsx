import { Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/Login/LoginPage'; // Giả sử bạn có một trang đăng nhập
import HomePage from '../pages/Home/Home'; // Giả sử bạn có một trang chủ công khai
import RegisterPage from '../pages/Register/Register';
import UsersManagerPage from '../pages/Dashboard/UsersManager/UsersManager';

const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/usersManager" element={<UsersManagerPage />} />

    </Routes>
  );
};

export default PublicRoutes;