// Loading.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from './Loading.module.css';

const Loading = () => {
  return (
    <motion.div
      className={styles.loadingContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.loader}>
        <div className={styles.blackhole}>
          <div className={styles["blackhole-circle"]}></div>
          <div className={styles["blackhole-disc"]}></div>
        </div>
        
        <svg className={styles.curve} viewBox="0 0 500 500">
          <path id="curve" d="M73.2,148.6c4-6.1,65.5-96.8,178.6-95.6c111.3,1.2,170.8,90.3,175.1,97" />
          <text width="500">
            <textPath xlinkHref="#curve">
            • LEGAI • 
            </textPath>
          </text>
        </svg>
      </div>
    </motion.div>
  );
};

export default Loading;