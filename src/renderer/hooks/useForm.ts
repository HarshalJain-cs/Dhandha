import { useState, useCallback, useEffect, useRef } from 'react';
import { validateField, validateForm } from '../utils/validation';
import { DraftSaver } from '../utils/storage';

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: any;
  onSubmit: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  enableAutoSave?: boolean;
  autoSaveKey?: string;
  autoSaveInterval?: number;
  restoreFromDraft?: boolean;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (name: keyof T, value: any) => void;
  handleBlur: (name: keyof T) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  setFieldTouched: (name: keyof T, touched: boolean) => void;
  setValues: (values: Partial<T>) => void;
  resetForm: () => void;
  resetTo: (values: T) => void;
  validateField: (name: keyof T) => void;
  validateFormFull: () => boolean;
  clearDraft: () => void;
  hasDraft: () => boolean;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
  enableAutoSave = false,
  autoSaveKey,
  autoSaveInterval = 30000,
  restoreFromDraft = true,
}: UseFormOptions<T>): UseFormReturn<T> => {
  // Draft saver instance
  const draftSaver = useRef<DraftSaver<T> | null>(null);

  // Initialize draft saver if auto-save is enabled
  if (enableAutoSave && autoSaveKey && !draftSaver.current) {
    draftSaver.current = new DraftSaver<T>(autoSaveKey, autoSaveInterval);
  }

  // Check for saved draft on mount
  const [initialValuesWithDraft] = useState<T>(() => {
    if (enableAutoSave && autoSaveKey && restoreFromDraft && draftSaver.current) {
      const draft = draftSaver.current.load();
      if (draft) {
        return draft;
      }
    }
    return initialValues;
  });

  const [values, setValues] = useState<T>(initialValuesWithDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track if form has changes
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  // Check if form is currently valid
  const isValid = Object.keys(errors).length === 0;

  const validateFieldInternal = useCallback(
    (name: keyof T) => {
      if (validationSchema && validationSchema[name]) {
        const error = validateField(values[name], validationSchema[name], values);
        setErrors((prev) => ({
          ...prev,
          [name]: error || '',
        }));
      }
    },
    [values, validationSchema]
  );

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (validateOnChange) {
        validateFieldInternal(name);
      }
    },
    [validateOnChange, validateFieldInternal]
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      if (validateOnBlur) {
        validateFieldInternal(name);
      }
    },
    [validateOnBlur, validateFieldInternal]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      Object.keys(values).forEach((key) => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      // Validate all fields
      if (validationSchema) {
        const validation = validateForm(values, validationSchema);
        setErrors(validation.errors);

        if (!validation.isValid) {
          setIsSubmitting(false);
          return;
        }
      }

      try {
        await onSubmit(values);

        // Clear draft on successful submission
        if (enableAutoSave && draftSaver.current) {
          draftSaver.current.clear();
        }
      } catch (error) {
        console.error('Form submission error:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validationSchema, onSubmit, enableAutoSave]
  );

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const setFieldTouched = useCallback((name: keyof T, touched: boolean) => {
    setTouched((prev) => ({
      ...prev,
      [name]: touched,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);

    // Clear draft if auto-save is enabled
    if (enableAutoSave && draftSaver.current) {
      draftSaver.current.clear();
    }
  }, [initialValues, enableAutoSave]);

  // Set multiple values at once
  const setValuesMultiple = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  // Reset to specific values
  const resetTo = useCallback((newValues: T) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, []);

  // Validate form and return result
  const validateFormFull = useCallback((): boolean => {
    if (!validationSchema) {
      return true;
    }

    const validation = validateForm(values, validationSchema);
    setErrors(validation.errors);
    return validation.isValid;
  }, [values, validationSchema]);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (draftSaver.current) {
      draftSaver.current.clear();
    }
  }, []);

  // Check if draft exists
  const hasDraft = useCallback((): boolean => {
    return draftSaver.current?.hasDraft() || false;
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (enableAutoSave && draftSaver.current) {
      draftSaver.current.startAutosave(() => values);

      return () => {
        draftSaver.current?.stopAutosave();
      };
    }
  }, [enableAutoSave, values]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues: setValuesMultiple,
    resetForm,
    resetTo,
    validateField: validateFieldInternal,
    validateFormFull,
    clearDraft,
    hasDraft,
  };
};
