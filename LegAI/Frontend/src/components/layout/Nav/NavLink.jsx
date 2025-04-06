import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
    >
      {children}
    </Link>
  );
};

export default NavLink; 