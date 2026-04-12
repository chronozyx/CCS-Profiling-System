import React from 'react';

const Logo = () => {
  return (
    <svg width="45" height="45" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" fill="#ff6b35" />
      
      {/* Inner Circle */}
      <circle cx="50" cy="50" r="40" fill="#fff" />
      
      {/* CCS Letters */}
      <text 
        x="50" 
        y="58" 
        fontFamily="Arial, sans-serif" 
        fontSize="28" 
        fontWeight="bold" 
        fill="#ff6b35" 
        textAnchor="middle"
      >
        CCS
      </text>
      
      {/* Decorative Elements */}
      <circle cx="50" cy="20" r="3" fill="#ff8c42" />
      <circle cx="50" cy="80" r="3" fill="#ff8c42" />
      <circle cx="20" cy="50" r="3" fill="#ff8c42" />
      <circle cx="80" cy="50" r="3" fill="#ff8c42" />
    </svg>
  );
};

export default Logo;
