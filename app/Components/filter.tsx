import React, { useState, useRef, useEffect } from "react";
import '../styles/components/filter.css';

// Generic filter option type
export interface FilterOption {
    id: string;
    label: string;
}

// Types of filter fields we support
export type FilterFieldType = 'dateRange' | 'checkbox' | 'radio';

// Definition for a single filter section
export interface FilterSection {
    id: string;
    title: string;
    type: FilterFieldType;
    options?: FilterOption[];
    defaultValue?: string | string[] | { from: string; to: string }; // Specify possible types
    placeholder?: string;
}

// Props for the FilterDropdown component
export interface FilterDropdownProps {
    sections: FilterSection[];
    onApply: (filterValues: Record<string, string | string[] | { from: string; to: string }>) => void; // Specify possible types
    initialValues?: Record<string, string | string[] | { from: string; to: string }>; // Specify possible types
    className?: string;
}

export default function FilterDropdown({
    sections,
    onApply,
    initialValues = {},
    className = ""
}: FilterDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Initialize filter values with default values from sections and any provided initialValues
    const getInitialFilterValues = () => {
        const defaults: Record<string, string | string[] | { from: string; to: string }> = {};

        sections.forEach(section => {
            if (initialValues[section.id] !== undefined) {
                defaults[section.id] = initialValues[section.id];
            } else if (section.defaultValue !== undefined) {
                defaults[section.id] = section.defaultValue;
            } else {
                // Set appropriate default based on filter type
                switch (section.type) {
                    case 'dateRange':
                        defaults[section.id] = { from: '', to: '' };
                        break;
                    case 'checkbox':
                        defaults[section.id] = [];
                        break;
                    case 'radio':
                        defaults[section.id] = '';
                        break;
                }
            }
        });

        return defaults;
    };

    const [filterValues, setFilterValues] = useState<Record<string, string | string[] | { from: string; to: string }>>(getInitialFilterValues());

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                !(event.target as Element).closest('.filter-btn')) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // Handle date range changes
    const handleDateRangeChange = (sectionId: string, field: "from" | "to", value: string) => {
        setFilterValues({
            ...filterValues,
            [sectionId]: {
                ...filterValues[sectionId] as { from: string; to: string }, // Type assertion
                [field]: value
            }
        });
    };

    // Handle checkbox selection (multiple selection)
    const handleCheckboxChange = (sectionId: string, optionId: string) => {
        const currentValues = filterValues[sectionId] as string[] || [];
        const newValues = currentValues.includes(optionId)
            ? currentValues.filter((item: string) => item !== optionId)
            : [...currentValues, optionId];

        setFilterValues({
            ...filterValues,
            [sectionId]: newValues
        });
    };

    // Handle radio selection (single selection)
    const handleRadioChange = (sectionId: string, value: string) => {
        setFilterValues({
            ...filterValues,
            [sectionId]: value
        });
    };

    // Apply filters
    const handleApply = () => {
        onApply(filterValues);
        setIsOpen(false);
    };

    // Clear all filters
    const handleClearAll = () => {
        setFilterValues(getInitialFilterValues());
    };

    // Check if a checkbox option is selected
    const isCheckboxSelected = (sectionId: string, optionId: string) => {
        const values = filterValues[sectionId] as string[] || [];
        return values.includes(optionId);
    };

    // Render field based on type
    const renderFilterField = (section: FilterSection) => {
        switch (section.type) {
            case 'dateRange':
                return (
                    <div className="date-range-inputs">
                        <div className="date-field">
                            <label>From:</label>
                            <input
                                type="date"
                                value={(filterValues[section.id] as { from: string; to: string })?.from || ''}
                                onChange={(e) => handleDateRangeChange(section.id, "from", e.target.value)}
                                placeholder={section.placeholder || "mm/dd/yyyy"}
                            />
                        </div>
                        <div className="date-field">
                            <label>To:</label>
                            <input
                                type="date"
                                value={(filterValues[section.id] as { from: string; to: string })?.to || ''}
                                onChange={(e) => handleDateRangeChange(section.id, "to", e.target.value)}
                                placeholder={section.placeholder || "mm/dd/yyyy"}
                            />
                        </div>
                    </div>
                );

            case 'checkbox':
                return (
                    <div className="filter-options">
                        {section.options?.map((option) => (
                            <div
                                key={option.id}
                                className={`filter-option ${isCheckboxSelected(section.id, option.id) ? "selected" : ""}`}
                                onClick={() => handleCheckboxChange(section.id, option.id)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                );

            case 'radio':
                return (
                    <div className="filter-options">
                        {section.options?.map((option) => (
                            <div
                                key={option.id}
                                className={`filter-option ${filterValues[section.id] === option.id ? "selected" : ""}`}
                                onClick={() => handleRadioChange(section.id, option.id)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`filter ${className}`}>
            <button className="filter-btn" onClick={toggleDropdown}>
                <i className="ri-equalizer-line" /> Filter
            </button>

            {isOpen && (
                <div className="filter-dropdown" ref={dropdownRef}>
                    {sections.map((section) => (
                        <div className="filter-section" key={section.id}>
                            <h3>{section.title}</h3>
                            {renderFilterField(section)}
                        </div>
                    ))}

                    {/* Action Buttons */}
                    <div className="filter-actions">
                        <button className="clear-btn" onClick={handleClearAll}>
                            Clear All
                        </button>
                        <button className="apply-btn" onClick={handleApply}>
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
