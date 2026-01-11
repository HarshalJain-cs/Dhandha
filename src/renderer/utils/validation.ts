type ValidationRule<T = any> = (value: T, allValues?: any) => string | undefined;

interface FieldSchema<T = any> {
  rules: ValidationRule<T>[];
}

interface ValidationSchema {
  [key: string]: FieldSchema;
}

// Common validation rules
export const required = (message = 'This field is required'): ValidationRule => {
  return (value) => {
    if (value === undefined || value === null || value === '') {
      return message;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return message;
    }
    return undefined;
  };
};

export const minLength = (min: number, message?: string): ValidationRule<string> => {
  return (value) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return undefined;
  };
};

export const maxLength = (max: number, message?: string): ValidationRule<string> => {
  return (value) => {
    if (value && value.length > max) {
      return message || `Must be at most ${max} characters`;
    }
    return undefined;
  };
};

export const email = (message = 'Invalid email address'): ValidationRule<string> => {
  return (value) => {
    if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return message;
    }
    return undefined;
  };
};

export const phone = (message = 'Invalid phone number'): ValidationRule<string> => {
  return (value) => {
    if (value && !/^[0-9]{10}$/.test(value.replace(/\D/g, ''))) {
      return message;
    }
    return undefined;
  };
};

export const gstin = (message = 'Invalid GSTIN'): ValidationRule<string> => {
  return (value) => {
    if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(value)) {
      return message;
    }
    return undefined;
  };
};

export const pan = (message = 'Invalid PAN'): ValidationRule<string> => {
  return (value) => {
    if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(value)) {
      return message;
    }
    return undefined;
  };
};

export const min = (minValue: number, message?: string): ValidationRule<number> => {
  return (value) => {
    if (value !== undefined && value !== null && value < minValue) {
      return message || `Must be at least ${minValue}`;
    }
    return undefined;
  };
};

export const max = (maxValue: number, message?: string): ValidationRule<number> => {
  return (value) => {
    if (value !== undefined && value !== null && value > maxValue) {
      return message || `Must be at most ${maxValue}`;
    }
    return undefined;
  };
};

export const decimal = (message = 'Must be a valid decimal number'): ValidationRule<string> => {
  return (value) => {
    if (value && !/^[0-9]+(\.[0-9]+)?$/.test(value)) {
      return message;
    }
    return undefined;
  };
};

// Validation schema builder
export const createSchema = (schema: ValidationSchema) => schema;

// Validate a single field
export const validateField = (
  value: any,
  fieldSchema: FieldSchema,
  allValues?: any
): string | undefined => {
  for (const rule of fieldSchema.rules) {
    const error = rule(value, allValues);
    if (error) {
      return error;
    }
  }
  return undefined;
};

// Validate all fields
export const validateForm = (
  values: any,
  schema: ValidationSchema
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  Object.keys(schema).forEach((fieldName) => {
    const error = validateField(values[fieldName], schema[fieldName], values);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
