import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/layout/TransitionPage/PageTransition';
import PublicRoutes from './publicRoutes';
import PrivateRoutes from './privateRoutes';
import RouteChangeDetector from '../components/layout/TransitionPage/RouteChangeDetector';

const AppRouter = () => {
  const location = useLocation();

  return (
    <>
      <RouteChangeDetector />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/*" element={
            <PageTransition custom="fade">
              <PublicRoutes />
            </PageTransition>
          } />
          <Route path="/dashboard/*" element={
            <PageTransition custom="fade">
              <PrivateRoutes />
            </PageTransition>
          } />
          <Route path="/profile/*" element={
            <PageTransition custom="fade">
              <PrivateRoutes />
            </PageTransition>
          } />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default AppRouter;