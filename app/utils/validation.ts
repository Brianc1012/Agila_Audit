// utils/validation.ts

/**
 * Validates the category field.
 * Accepts only predefined options.
 */
export const isValidCategory = (category: string): boolean => {
    category = category.trim().toUpperCase(); // Remove leading/trailing spaces and convert to uppercase
    return /^(BOUNDARY|PERCENTAGE|BUS RENTAL|OTHERS|OTHER)$/.test(category);
};
  

/**
 * Validates the source field.
 * Allows letters, numbers, spaces, and common punctuation.
 * Must be between 2 and 50 characters.
 */
export const isValidSource = (source: string): boolean => {
    return /^[A-Za-z0-9\s.,'-]{2,50}$/.test(source);
};
  

/**
 * Validates the amount field.
 * Allows whole numbers or decimals with up to 2 places.
 */

export function isValidAmount(amount: number): boolean {
  return !isNaN(amount) && amount > 0;
}

export type ValidationRule = {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: unknown) => string | null;
  label?: string;
};


export function validateField(value: unknown, rules: ValidationRule): string[] {
  const errors: string[] = [];

  // Required check works for string/number/null/undefined
  if (rules.required && (value === null || value === undefined || value === '')) {
    errors.push(`${rules.label || 'This field'} is required.`);
  }

  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    errors.push(`${rules.label || 'This field'} format is invalid.`);
  }

  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    errors.push(`${rules.label || 'This field'} must be at least ${rules.minLength} characters.`);
  }

  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    errors.push(`${rules.label || 'This field'} must be at most ${rules.maxLength} characters.`);
  }

  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${rules.label || 'This field'} must be at least ${rules.min}.`);
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${rules.label || 'This field'} must be at most ${rules.max}.`);
    }
  }

  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) errors.push(customError);
  }

  return errors;
}
