import { Routes, Route } from 'react-router-dom';
import PublicRoutes from './publicRoutes';
import PrivateRoutes from './privateRoutes';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/*" element={<PublicRoutes />} />
      <Route path="/dashboard/*" element={<PrivateRoutes />} />
      <Route path="/profile/*" element={<PrivateRoutes />} />
    </Routes>
  );
};

export default AppRouter;