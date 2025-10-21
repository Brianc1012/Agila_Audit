'use client';

import React, { useState, useRef, useEffect } from 'react';
import '../styles/components/MonthYearPicker.css';

interface MonthYearPickerProps {
  value: string; // Format: "YYYY-MM"
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  allowManualInput?: boolean; // New prop to enable manual input
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  placeholder = 'Select month',
  allowManualInput = true // Default to true for flexibility
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState(false); // Toggle between input and display mode
  const [isValid, setIsValid] = useState(true);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate flexible year range (10 years back, current year, 10 years forward)
  const startYear = currentYear - 10;
  const endYear = currentYear + 10;
  const years = Array.from({ length: 21 }, (_, i) => startYear + i);

  // Initialize selected values from prop
  useEffect(() => {
    if (value) {
      const [year, month] = value.split('-').map(Number);
      setSelectedYear(year);
      setSelectedMonth(month - 1); // Convert to 0-based index
      setInputValue(formatDisplayValue());
    } else {
      setInputValue('');
      setSelectedYear(null);
      setSelectedMonth(null);
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (inputMode) {
          handleInputSubmit();
        }
      }
    };

    if (isOpen || inputMode) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, inputMode, inputValue]);

  // Focus input when entering input mode
  useEffect(() => {
    if (inputMode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [inputMode]);

  const formatDisplayValue = () => {
    if (!value) return placeholder;
    const [year, month] = value.split('-').map(Number);
    return `${months[month - 1]} ${year}`;
  };

  const isPastMonth = (year: number, month: number) => {
    return year < currentYear || (year === currentYear && month < currentMonth);
  };

  // Validate input format
  const validateInput = (input: string) => {
    // Support multiple formats: "MM/YYYY", "MM-YYYY", "YYYY-MM", "January 2024", etc.
    const formats = [
      /^(\d{1,2})\/(\d{4})$/,          // MM/YYYY or M/YYYY
      /^(\d{1,2})-(\d{4})$/,           // MM-YYYY or M-YYYY
      /^(\d{4})-(\d{1,2})$/,           // YYYY-MM or YYYY-M
      /^([a-zA-Z]+)\s+(\d{4})$/,       // "January 2024"
      /^([a-zA-Z]+)\s(\d{4})$/,        // "Jan 2024"
    ];

    for (const format of formats) {
      const match = input.trim().match(format);
      if (match) {
        let month: number, year: number;

        if (format === formats[0] || format === formats[1]) {
          // MM/YYYY or MM-YYYY format
          month = parseInt(match[1], 10) - 1; // Convert to 0-based
          year = parseInt(match[2], 10);
        } else if (format === formats[2]) {
          // YYYY-MM format
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1; // Convert to 0-based
        } else {
          // Month name format
          const monthName = match[1].toLowerCase();
          const monthIndex = months.findIndex(m => 
            m.toLowerCase().startsWith(monthName.substring(0, 3))
          );
          
          if (monthIndex === -1) continue; // Invalid month name
          
          month = monthIndex;
          year = parseInt(match[2], 10);
        }

        // Validate month and year ranges
        if (month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
          return { month, year, isValid: true };
        }
      }
    }

    return { month: 0, year: currentYear, isValid: false };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const validation = validateInput(newValue);
    setIsValid(validation.isValid);
  };

  const handleInputSubmit = () => {
    if (inputValue.trim() === '') {
      setInputMode(false);
      return;
    }

    const validation = validateInput(inputValue);
    if (validation.isValid) {
      const formattedValue = `${validation.year}-${String(validation.month + 1).padStart(2, '0')}`;
      onChange(formattedValue);
      setSelectedYear(validation.year);
      setSelectedMonth(validation.month);
      setIsValid(true);
    } else {
      // Reset to previous valid value or empty
      setInputValue(value ? formatDisplayValue() : '');
      setIsValid(true);
    }
    setInputMode(false);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setInputValue(value ? formatDisplayValue() : '');
      setInputMode(false);
      setIsValid(true);
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    if (selectedYear) {
      const formattedValue = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
      onChange(formattedValue);
      setSelectedMonth(monthIndex);
      setInputValue(formatDisplayValue());
      setIsOpen(false);
    }
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    // If month is selected, update the value immediately
    if (selectedMonth !== null) {
      const formattedValue = `${year}-${String(selectedMonth + 1).padStart(2, '0')}`;
      onChange(formattedValue);
      setInputValue(formatDisplayValue());
    }
  };

  const handleCurrentMonth = () => {
    const todayValue = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    onChange(todayValue);
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setInputValue(formatDisplayValue());
    setIsOpen(false);
  };

  const handleInputModeToggle = () => {
    if (allowManualInput) {
      setInputMode(true);
      setInputValue(value ? formatDisplayValue() : '');
      setIsOpen(false);
    }
  };

  return (
    <div className={`month-year-picker ${className}`} ref={pickerRef}>
      <div className="picker-container">
        {inputMode ? (
          // Input Mode
          <input
            ref={inputRef}
            type="text"
            className={`picker-input-field ${!isValid ? 'invalid' : ''}`}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyPress}
            onBlur={handleInputSubmit}
            placeholder="Type: MM/YYYY, January 2024, etc."
            disabled={disabled}
          />
        ) : (
          // Display Mode
          <div 
            className={`picker-input ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            <span className="picker-value">
              {value ? formatDisplayValue() : placeholder}
            </span>
            <div className="picker-actions">
              {allowManualInput && (
                <button
                  type="button"
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInputModeToggle();
                  }}
                  title="Edit manually"
                >
                  <i className="ri-edit-line" />
                </button>
              )}
              <i className={`ri-arrow-down-s-line picker-arrow ${isOpen ? 'open' : ''}`} />
            </div>
          </div>
        )}

        {!isValid && inputMode && (
          <div className="validation-message">
            <i className="ri-error-warning-line" />
            <span>Please enter a valid date format (MM/YYYY, January 2024, etc.)</span>
          </div>
        )}
      </div>

      {isOpen && !disabled && !inputMode && (
        <div className="picker-dropdown">
          <div className="picker-header">
            <h4>Select Budget Period</h4>
            <p>Choose year and month or type manually</p>
          </div>
          
          <div className="picker-content">
            {/* Quick Input Section */}
            {allowManualInput && (
              <div className="quick-input-section">
                <h5>
                  <i className="ri-keyboard-line"></i>
                  Quick Input
                </h5>
                <button 
                  className="manual-input-btn"
                  onClick={handleInputModeToggle}
                >
                  <i className="ri-edit-line" />
                  Type Date Manually
                  <span className="input-hint">MM/YYYY, January 2024, etc.</span>
                </button>
              </div>
            )}

            {/* Year Selection */}
            <div className="year-section">
              <h5>
                <i className="ri-calendar-line"></i>
                Year
              </h5>
              <div className="year-scroll">
                <div className="year-grid">
                  {years.map((year) => (
                    <button
                      key={year}
                      className={`year-option ${selectedYear === year ? 'selected' : ''} ${
                        year === currentYear ? 'current-year' : ''
                      }`}
                      onClick={() => handleYearSelect(year)}
                    >
                      {year}
                      {year === currentYear && <span className="current-indicator">Current</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Month Selection */}
            {selectedYear && (
              <div className="month-section">
                <h5>
                  <i className="ri-calendar-month-line"></i>
                  Month - {selectedYear}
                </h5>
                <div className="month-grid">
                  {months.map((month, index) => {
                    const isPast = isPastMonth(selectedYear, index);
                    const isCurrent = selectedYear === currentYear && index === currentMonth;
                    
                    return (
                      <button
                        key={month}
                        className={`month-option ${selectedMonth === index ? 'selected' : ''} ${
                          isPast ? 'past' : ''
                        } ${isCurrent ? 'current-month' : ''}`}
                        onClick={() => handleMonthSelect(index)}
                      >
                        <span className="month-name">{month}</span>
                        <div className="month-labels">
                          {isPast && <span className="past-label">Past</span>}
                          {isCurrent && <span className="current-label">Current</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="picker-footer">
            <button 
              className="cancel-btn"
              onClick={() => setIsOpen(false)}
            >
              <i className="ri-close-line"></i>
              Cancel
            </button>
            <button 
              className="today-btn"
              onClick={handleCurrentMonth}
            >
              <i className="ri-calendar-check-line"></i>
              Current Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthYearPicker;