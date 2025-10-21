import React, { useState, useEffect } from 'react';
import { formatDate } from '@app/utils/formatting';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  showDateTime?: boolean;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ 
  title, 
  onClose, 
  showDateTime = true 
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    if (showDateTime) {
      const updateDateTime = () => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setCurrentDate(formatDate(now));
      };
      updateDateTime();
      const interval = setInterval(updateDateTime, 60000);
      return () => clearInterval(interval);
    }
  }, [showDateTime]);

  return (
    <div className="modalHeader">
      <div className="header-left">
        <h1>{title}</h1>
      </div>
      
      <div className="header-right">
        {showDateTime && (
          <div className="timeDate">
            <div className="currTime">{currentTime}</div>
            <div className="currDate">{currentDate}</div>
          </div>
        )}
        <button type="button" className="closeButton" onClick={onClose}>
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
  );
};

export default ModalHeader;
