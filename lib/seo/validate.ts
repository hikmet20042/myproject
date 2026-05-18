/**
 * Schema.org structured data validation utilities
 * Validates JSON-LD structured data against common Schema.org types
 */

export interface SchemaValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface SchemaValidationResult {
  valid: boolean
  errors: SchemaValidationError[]
  warnings: SchemaValidationError[]
}

const requiredFields: Record<string, string[]> = {
  Article: ['headline', 'datePublished'],
  JobPosting: ['title', 'description', 'datePosted', 'hiringOrganization'],
  Event: ['name', 'startDate', 'location'],
  Organization: ['name', 'url'],
  FAQPage: ['mainEntity'],
  BreadcrumbList: ['itemListElement'],
  ItemList: ['itemListElement'],
  Course: ['name', 'description', 'provider'],
  VideoObject: ['name', 'description', 'thumbnailUrl', 'uploadDate'],
  HowTo: ['name', 'step'],
  QAPage: ['mainEntity'],
}

const urlFields: string[] = ['url', '@id', 'item']
const dateFields: string[] = ['datePublished', 'dateModified', 'datePosted', 'validThrough', 'startDate', 'endDate']

function isValidUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    new URL(value.startsWith('http') ? value : `https://${value}`)
    return true
  } catch {
    return false
  }
}

function isValidDate(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

function validateFields(data: Record<string, unknown>, type: string): SchemaValidationError[] {
  const errors: SchemaValidationError[] = []
  const required = requiredFields[type] || []

  for (const field of required) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      errors.push({
        field,
        message: `Required field "${field}" is missing for ${type}`,
        severity: 'error',
      })
    }
  }

  return errors
}

function validateUrls(data: Record<string, unknown>): SchemaValidationError[] {
  const errors: SchemaValidationError[] = []

  for (const field of urlFields) {
    const value = data[field]
    if (value && !isValidUrl(value)) {
      errors.push({
        field,
        message: `Field "${field}" should be a valid URL`,
        severity: 'warning',
      })
    }
  }

  return errors
}

function validateDates(data: Record<string, unknown>): SchemaValidationError[] {
  const errors: SchemaValidationError[] = []

  for (const field of dateFields) {
    const value = data[field]
    if (value && !isValidDate(value)) {
      errors.push({
        field,
        message: `Field "${field}" should be a valid ISO 8601 date`,
        severity: 'warning',
      })
    }
  }

  return errors
}

/**
 * Validate a single structured data object
 */
export function validateSchemaData(data: unknown): SchemaValidationResult {
  const errors: SchemaValidationError[] = []
  const warnings: SchemaValidationError[] = []

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: [{ field: '@root', message: 'Schema data must be a non-null object', severity: 'error' }],
      warnings: [],
    }
  }

  const obj = data as Record<string, unknown>
  const type = obj['@type'] as string

  if (!type) {
    return {
      valid: false,
      errors: [{ field: '@type', message: 'Missing @type field', severity: 'error' }],
      warnings: [],
    }
  }

  if (obj['@context'] !== 'https://schema.org') {
    warnings.push({
      field: '@context',
      message: '@context should be "https://schema.org"',
      severity: 'warning',
    })
  }

  errors.push(...validateFields(obj, type))
  warnings.push(...validateUrls(obj))
  warnings.push(...validateDates(obj))

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate JSON-LD string
 */
export function validateJsonLd(jsonString: string): SchemaValidationResult {
  try {
    const parsed = JSON.parse(jsonString)
    return validateSchemaData(parsed)
  } catch (e) {
    return {
      valid: false,
      errors: [{ field: '@root', message: `Invalid JSON: ${(e as Error).message}`, severity: 'error' }],
      warnings: [],
    }
  }
}

/**
 * Validate multiple schema objects (for @graph)
 */
export function validateSchemaGraph(data: unknown): SchemaValidationResult {
  const allErrors: SchemaValidationError[] = []
  const allWarnings: SchemaValidationError[] = []

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const result = validateSchemaData(item)
      const prefix = `[${index}]`
      allErrors.push(...result.errors.map(e => ({ ...e, field: `${prefix} ${e.field}` })))
      allWarnings.push(...result.warnings.map(w => ({ ...w, field: `${prefix} ${w.field}` })))
    })
  } else if (data && typeof data === 'object' && '@graph' in data) {
    const graph = (data as Record<string, unknown>)['@graph']
    if (Array.isArray(graph)) {
      return validateSchemaGraph(graph)
    }
  } else {
    return validateSchemaData(data)
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}

/**
 * Log validation results (useful for development)
 */
export function logSchemaValidation(label: string, data: unknown): void {
  if (process.env.NODE_ENV !== 'development') return

  const result = validateSchemaGraph(data)

  if (result.valid && result.warnings.length === 0) {
    console.log(`[SEO] ✅ ${label}: Schema valid`)
  } else {
    if (result.errors.length > 0) {
      console.error(`[SEO] ❌ ${label}: ${result.errors.length} error(s)`, result.errors)
    }
    if (result.warnings.length > 0) {
      console.warn(`[SEO] ⚠️ ${label}: ${result.warnings.length} warning(s)`, result.warnings)
    }
  }
}
