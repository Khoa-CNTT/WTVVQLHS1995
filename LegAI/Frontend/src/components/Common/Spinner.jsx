import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'medium' }) => {
  const spinnerClass = `spinner spinner-${size}`;
  
  return (
    <div className={spinnerClass}>
      <div className="spinner-inner"></div>
    </div>
  );
};

export default Spinner; 