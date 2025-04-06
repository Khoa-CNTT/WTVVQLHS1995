import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children, custom = 'fade' }) => {
  // Định nghĩa hiệu ứng fade đơn giản
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }
  };

  // Chọn hiệu ứng từ prop custom (duy trì API để tương thích ngược)
  const selectedVariant = variants[custom] || variants.fade;

  // Thiết lập thời gian chuyển trang ngắn
  const transition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3, // Thời gian ngắn để hiệu ứng nhanh
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={selectedVariant}
      transition={transition}
      className="page-transition-wrapper"
      style={{ 
        width: '100%', 
        height: '100%'
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;