/**
 * Centralized input validation utility for API endpoints.
 * Provides schema-based validation with standardized error responses.
 * Supports localized validation messages (default: Azerbaijani).
 */

import { errorResponse } from '@/lib/apiResponse'
import { validationMessages, type Locale, type LocaleMessages } from '@/lib/validation-messages'

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string
  message: string
  code?: string
}

/**
 * Validation result
 */
export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

/**
 * Field validation rule
 */
export interface FieldRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'date' | 'uuid'
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  enum?: readonly (string | number)[]
  custom?: (value: unknown) => string | null // returns error message or null
}

/**
 * Schema definition
 */
export type Schema = Record<string, FieldRule>

/**
 * Validate a single field against its rules
 */
function validateField(name: string, value: unknown, rules: FieldRule, msgs: LocaleMessages): ValidationError | null {
  // Required check
  if (rules.required && (value === undefined || value === null || value === '')) {
    return { field: name, message: msgs.required(name), code: 'REQUIRED' }
  }
  
  // Skip further validation if value is not provided and not required
  if (value === undefined || value === null) {
    return null
  }
  
  // Type check
  if (rules.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value
    
    if (rules.type === 'email') {
      if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { field: name, message: msgs.invalidEmail(name), code: 'INVALID_EMAIL' }
      }
    } else if (rules.type === 'url') {
      if (typeof value !== 'string') {
        return { field: name, message: msgs.invalidType(name), code: 'INVALID_TYPE' }
      }
      try {
        new URL(value)
      } catch {
        return { field: name, message: msgs.invalidUrl(name), code: 'INVALID_URL' }
      }
    } else if (rules.type === 'date') {
      if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
        return { field: name, message: msgs.invalidDate(name), code: 'INVALID_DATE' }
      }
    } else if (rules.type === 'uuid') {
      if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return { field: name, message: msgs.invalidUuid(name), code: 'INVALID_UUID' }
      }
    } else if (rules.type === 'number') {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return { field: name, message: msgs.invalidNumber(name), code: 'INVALID_NUMBER' }
      }
    } else if (rules.type === 'boolean') {
      if (typeof value !== 'boolean') {
        return { field: name, message: msgs.invalidBoolean(name), code: 'INVALID_BOOLEAN' }
      }
    } else if (rules.type === 'array') {
      if (!Array.isArray(value)) {
        return { field: name, message: msgs.invalidArray(name), code: 'INVALID_ARRAY' }
      }
    } else if (rules.type === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        return { field: name, message: msgs.invalidObject(name), code: 'INVALID_OBJECT' }
      }
    } else if (rules.type === 'string') {
      if (typeof value !== 'string') {
        return { field: name, message: msgs.invalidType(name), code: 'INVALID_TYPE' }
      }
    }
  }
  
  // String length checks
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return { field: name, message: msgs.tooShort(name, rules.minLength), code: 'TOO_SHORT' }
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return { field: name, message: msgs.tooLong(name, rules.maxLength), code: 'TOO_LONG' }
    }
  }
  
  // Number range checks
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return { field: name, message: msgs.tooSmall(name, rules.min), code: 'TOO_SMALL' }
    }
    if (rules.max !== undefined && value > rules.max) {
      return { field: name, message: msgs.tooLarge(name, rules.max), code: 'TOO_LARGE' }
    }
  }
  
  // Array length checks
  if (Array.isArray(value)) {
    if (rules.min !== undefined && value.length < rules.min) {
      return { field: name, message: msgs.tooFewItems(name, rules.min), code: 'TOO_FEW_ITEMS' }
    }
    if (rules.max !== undefined && value.length > rules.max) {
      return { field: name, message: msgs.tooManyItems(name, rules.max), code: 'TOO_MANY_ITEMS' }
    }
  }
  
  // Pattern check
  if (rules.pattern && typeof value === 'string') {
    if (!rules.pattern.test(value)) {
      return { field: name, message: msgs.invalidFormat(name), code: 'INVALID_FORMAT' }
    }
  }
  
  // Enum check
  if (rules.enum) {
    if (!rules.enum.includes(value as string | number)) {
      return { field: name, message: msgs.invalidEnum(name, rules.enum.map(String)), code: 'INVALID_ENUM' }
    }
  }
  
  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value)
    if (customError) {
      return { field: name, message: customError, code: 'CUSTOM_VALIDATION' }
    }
  }
  
  return null
}

/**
 * Validate data against a schema
 */
export function validateSchema<T = Record<string, unknown>>(
  data: unknown,
  schema: Schema,
  options?: { allowUnknownFields?: boolean; locale?: Locale }
): ValidationResult<T> {
  const errors: ValidationError[] = []
  const msgs = validationMessages[options?.locale || 'az']
  
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      success: false,
      errors: [{ field: 'body', message: msgs.invalidBody(), code: 'INVALID_BODY' }],
    }
  }
  
  const record = data as Record<string, unknown>
  
  // Validate each field in the schema
  for (const [fieldName, rules] of Object.entries(schema)) {
    const value = record[fieldName]
    const error = validateField(fieldName, value, rules, msgs)
    if (error) {
      errors.push(error)
    }
  }
  
  // Check for unknown fields if not allowed
  if (options?.allowUnknownFields === false) {
    const schemaFields = new Set(Object.keys(schema))
    for (const key of Object.keys(record)) {
      if (!schemaFields.has(key)) {
        errors.push({ field: key, message: msgs.unknownField(key), code: 'UNKNOWN_FIELD' })
      }
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  return { success: true, data: data as T }
}

/**
 * Create a Next.js error response from validation errors
 */
export function validationErrorResponse(errors: ValidationError[]) {
  const messages = errors.map(e => e.message)
  const fieldErrors = errors.reduce<Record<string, string[]>>((acc, err) => {
    if (!acc[err.field]) acc[err.field] = []
    acc[err.field].push(err.message)
    return acc
  }, {})
  
  return errorResponse(
    messages[0], // First error as main message
    'VALIDATION_ERROR',
    { fieldErrors, allErrors: errors },
    400
  )
}

/**
 * Validate request body against schema and return response if invalid
 * Usage: const validation = validateRequestBody(req, schema); if (validation) return validation;
 */
export function validateRequestBody<T = Record<string, unknown>>(
  body: unknown,
  schema: Schema,
  options?: { allowUnknownFields?: boolean; locale?: Locale }
): Response | null {
  const result = validateSchema<T>(body, schema, options)
  if (!result.success) {
    return validationErrorResponse(result.errors!)
  }
  return null
}

/**
 * Validate query parameters against schema
 */
export function validateQueryParams<T = Record<string, unknown>>(
  params: Record<string, string | undefined>,
  schema: Schema
): ValidationResult<T> {
  // Convert query params to proper types for validation
  const converted: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      // Try to parse numbers
      if (!Number.isNaN(Number(value)) && value !== '') {
        converted[key] = Number(value)
      } else if (value === 'true') {
        converted[key] = true
      } else if (value === 'false') {
        converted[key] = false
      } else {
        converted[key] = value
      }
    }
  }
  
  return validateSchema<T>(converted, schema)
}

/**
 * Common schema presets
 */
export const COMMON_SCHEMAS = {
  pagination: {
    page: { type: 'number', min: 1 },
    limit: { type: 'number', min: 1, max: 100 },
  },
  sorting: {
    sortBy: { type: 'string', maxLength: 50 },
    sortOrder: { type: 'string', enum: ['asc', 'desc'] },
  },
  search: {
    search: { type: 'string', maxLength: 200 },
  },
  id: {
    id: { type: 'uuid', required: true },
  },
} as const
