'use client';

import React, { useState, useRef, useEffect } from 'react';
//@ts-ignore
import '../styles/components/itemTable.css';

// Types
export interface Item {
  item_name: string;
  quantity: number;
  unit_measure: string;
  unit_cost: number;
  supplier: string;
  subtotal: number;
  type: 'supply' | 'service'; // New field
}

interface ItemsTableProps {
  items: Item[];
  onItemsChange: (items:Item[]) => void;
  showItems: boolean;
  onToggleItems: () => void;
  readOnly?: boolean;
  title?: string;
  className?: string;
}

// Predefined options (you can move these to a config file)
const ITEM_SUGGESTIONS = [
  // Supplies
  'Office Supplies',
  'Computer Equipment', 
  'Furniture',
  'Cleaning Supplies',
  'Safety Equipment',
  'Raw Materials',
  'Tools and Equipment',
  'Vehicle Parts',
  'Medical Supplies',
  'Food and Beverages',
  // Services
  'Maintenance Service',
  'IT Support Service',
  'Training Service',
  'Consulting Service',
  'Security Service',
  'Cleaning Service',
  'Transportation Service',
  'Insurance Service',
  'Marketing Service',
  'Legal Service'
];

const SUPPLIER_SUGGESTIONS = [
  'ABC Supplies Corp',
  'Tech Solutions Inc',
  'Office Depot',
  'Industrial Equipment Ltd',
  'Local Hardware Store',
  'Medical Supplies Co',
  'Food Service Provider',
  'Maintenance Services Inc',
  'IT Support Solutions',
  'Training Academy',
  'Security Services Ltd',
  'Transportation Co',
  'Marketing Agency',
  'Legal Firm'
];

// Updated unit options - separated by type
const SUPPLY_UNITS = [
  'pcs', 'kg', 'lbs', 'liters', 'meters', 'boxes', 'sets', 'pairs', 'units', 'rolls', 'sheets'
];

const SERVICE_UNITS = [
  'hours', 'days', 'weeks', 'months', 'years', 'sessions', 'visits', 'consultations', 'projects', 'licenses'
];

// Dropdown component for suggestions
const SuggestionDropdown: React.FC<{
  value: string;
  suggestions: string[];
  onSelect: (value: string) => void;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}> = ({ value, suggestions, onSelect, onChange, placeholder, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const filtered = suggestions.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions);
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSelect(suggestion);
    setIsOpen(false);
  };

  return (
    <div className="suggestion-dropdown" ref={dropdownRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        className="suggestion-input"
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="suggestions-list">
          {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  onItemsChange,
  showItems,
  onToggleItems,
  readOnly = false,
  title = "Budget Items (Optional)",
  className = ""
}) => {
  
  const addItem = () => {
    const newItem: Item = {
      item_name: '',
      quantity: 1,
      unit_measure: 'pcs',
      unit_cost: 0,
      supplier: '',
      subtotal: 0,
      type: 'supply'
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If type changes, update the unit_measure to appropriate default
    if (field === 'type') {
      if (value === 'supply') {
        updatedItems[index].unit_measure = 'pcs';
      } else if (value === 'service') {
        updatedItems[index].unit_measure = 'hours';
      }
    }
    
    // Recalculate subtotal if quantity or unit_cost changes
    if (field === 'quantity' || field === 'unit_cost') {
      updatedItems[index].subtotal = updatedItems[index].quantity * updatedItems[index].unit_cost;
    }
    
    onItemsChange(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  };

  // Get appropriate unit options based on item type
  const getUnitOptions = (itemType: 'supply' | 'service') => {
    return itemType === 'supply' ? SUPPLY_UNITS : SERVICE_UNITS;
  };

  return (
    <div className={`budget-items-table ${className}`}>
      <div className="itemsHeader">
        <h3>{title}</h3>
        {!readOnly && (
          <button
            type="button"
            className="itemsToggle"
            onClick={onToggleItems}
          >
            <i className={`ri-${showItems ? 'eye-off' : 'eye'}-line`} />
            {showItems ? 'Hide Items' : 'Add Items'}
          </button>
        )}
      </div>

      {showItems && (
        <div className="items-container">
          {items.map((item, index) => (
            <div key={index} className="itemContainer">
              {!readOnly && (
                <button
                  type="button"
                  className="removeItemBtn"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  title="Remove Item"
                >
                  <i className="ri-close-line" />
                </button>
              )}

              <div className="itemGrid">
                {/* Type Toggle Switch */}
                <div className="itemField">
                  <label>Type<span className='requiredTags'> *</span></label>
                  <div className="type-toggle-container">
                    <div 
                      className={`type-toggle ${item.type === 'service' ? 'active' : ''}`}
                      onClick={() => !readOnly && updateItem(index, 'type', item.type === 'supply' ? 'service' : 'supply')}
                    >
                      <div className="toggle-slider"></div>
                      <span className="toggle-label service">Service</span>
                      <span className="toggle-label supply">Supply</span>
                    </div>
                  </div>
                </div>

                {/* Item Name with Suggestions */}
                <div className="itemField">
                  <label>Item Name<span className='requiredTags'> *</span></label>
                  {readOnly ? (
                    <input
                      type="text"
                      value={item.item_name}
                      readOnly
                      className="readonly-input"
                    />
                  ) : (
                    <SuggestionDropdown
                      value={item.item_name}
                      suggestions={ITEM_SUGGESTIONS}
                      onSelect={(value) => updateItem(index, 'item_name', value)}
                      onChange={(value) => updateItem(index, 'item_name', value)}
                      placeholder="Enter or select item name"
                      required
                    />
                  )}
                </div>

                <div className="itemField">
                  <label>Quantity<span className='requiredTags'> *</span></label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    min="1"
                    required
                    readOnly={readOnly}
                  />
                </div>

                {/* Updated Unit field with dynamic options */}
                <div className="itemField">
                  <label>Unit</label>
                  <select
                    value={item.unit_measure}
                    onChange={(e) => updateItem(index, 'unit_measure', e.target.value)}
                    disabled={readOnly}
                  >
                    {getUnitOptions(item.type).map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="itemField">
                  <label>Unit Cost<span className='requiredTags'> *</span></label>
                  <input
                    type="number"
                    value={item.unit_cost}
                    onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    required
                    readOnly={readOnly}
                  />
                </div>

                {/* Supplier with Suggestions */}
                <div className="itemField">
                  <label>Supplier<span className='requiredTags'> *</span></label>
                  {readOnly ? (
                    <input
                      type="text"
                      value={item.supplier}
                      readOnly
                      className="readonly-input"
                    />
                  ) : (
                    <SuggestionDropdown
                      value={item.supplier}
                      suggestions={SUPPLIER_SUGGESTIONS}
                      onSelect={(value) => updateItem(index, 'supplier', value)}
                      onChange={(value) => updateItem(index, 'supplier', value)}
                      placeholder="Enter or select supplier"
                      required
                    />
                  )}
                </div>

                <div className="itemField">
                  <label>Subtotal</label>
                  <div className="subtotalField">
                    ₱{item.subtotal.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!readOnly && (
            <button
              type="button"
              className="addItemBtn"
              onClick={addItem}
            >
              <i className="ri-add-line" /> Add Another Item
            </button>
          )}

          {items.length > 0 && (
            <div className="totalAmountDisplay">
              <h3>Total Amount from Items</h3>
              <div className="totalAmountValue">
                ₱{calculateTotal().toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemsTable;