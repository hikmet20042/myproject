export type SchemaFieldType = 'text' | 'textarea' | 'select' | 'email' | 'number' | 'date'

export type SchemaOption = {
  value: string
  label: string
}

export type SchemaFieldRules = {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp | string
}

export type SchemaFieldUi = {
  label: string
  placeholder?: string
  helperText?: string
  containerClassName?: string
  inputClassName?: string
  rows?: number
}

export type SchemaField<T extends Record<string, any>> = {
  name: keyof T & string
  type: SchemaFieldType
  rules?: SchemaFieldRules
  ui: SchemaFieldUi
  options?: SchemaOption[]
}

export type ContentFormSchema<T extends Record<string, any>> = {
  id: string
  fields: Array<SchemaField<T>>
}
