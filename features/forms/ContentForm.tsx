'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Select, TextArea } from '@/components/ui'
import { useFormState } from '@/features/forms/useFormState'
import type { ContentFormSchema, SchemaField } from '@/features/forms/schema/types'

type ContentFormProps<T extends Record<string, any>> = {
  schema: ContentFormSchema<T>
  initialData?: Partial<T>
  onSubmit: (data: T) => Promise<void> | void
  onChange?: (data: T) => void
  showSubmitButton?: boolean
  submitLabel?: string
  className?: string
  asForm?: boolean
}

const buildInitialStateFromSchema = <T extends Record<string, any>>(
  schema: ContentFormSchema<T>,
  initialData?: Partial<T>,
) => {
  const base = schema.fields.reduce((acc, field) => {
    ;(acc as Record<string, any>)[field.name] = ''
    return acc
  }, {} as T)
  return { ...base, ...(initialData || {}) } as T
}

const getFieldLabel = (label: string) => label.replace(/\*/g, '').trim()

const getFieldValidationError = <T extends Record<string, any>>(
  field: SchemaField<T>,
  value: unknown,
) => {
  const label = getFieldLabel(field.ui.label)
  const rules = field.rules

  if (rules?.required) {
    if (typeof value === 'string' && !value.trim()) {
      return `${label} tələb olunur`
    }
    if (value === null || value === undefined) {
      return `${label} tələb olunur`
    }
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    if (rules?.minLength !== undefined && trimmedValue.length < rules.minLength) {
      return `${label} ən azı ${rules.minLength} simvol olmalıdır`
    }
    if (rules?.maxLength !== undefined && trimmedValue.length > rules.maxLength) {
      return `${label} ən çox ${rules.maxLength} simvol olmalıdır`
    }
    if (rules?.pattern) {
      const regex = typeof rules.pattern === 'string' ? new RegExp(rules.pattern) : rules.pattern
      if (trimmedValue.length > 0 && !regex.test(trimmedValue)) {
        return `${label} yanlış formatdadır`
      }
    }
  }

  return null
}

const validateBySchema = <T extends Record<string, any>>(
  schema: ContentFormSchema<T>,
  state: T,
) => {
  const errors: Partial<Record<keyof T & string, string>> = {}
  for (const field of schema.fields) {
    const fieldError = getFieldValidationError(field, state[field.name])
    if (fieldError) {
      errors[field.name] = fieldError
    }
  }
  return errors
}

const mergeFieldClassName = (
  baseClassName: string | undefined,
  hasError: boolean,
) => {
  const errorClassName = hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
    : ''
  return [baseClassName, errorClassName].filter(Boolean).join(' ')
}

const renderField = <T extends Record<string, any>>(
  field: SchemaField<T>,
  value: any,
  hasError: boolean,
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void,
  handleFieldBlur: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void,
) => {
  const inputClassName = mergeFieldClassName(field.ui.inputClassName, hasError)

  if (field.type === 'textarea') {
    return (
      <TextArea
        id={field.name}
        name={field.name}
        value={value || ''}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        placeholder={field.ui.placeholder}
        rows={field.ui.rows || 4}
        className={inputClassName}
        required={field.rules?.required}
        minLength={field.rules?.minLength}
        maxLength={field.rules?.maxLength}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <Select
        id={field.name}
        name={field.name}
        value={value || ''}
        onChange={handleInputChange}
        onBlur={handleFieldBlur}
        options={field.options || []}
        placeholder={field.ui.placeholder}
        className={inputClassName}
        required={field.rules?.required}
      />
    )
  }

  return (
    <Input
      id={field.name}
      name={field.name}
      value={value || ''}
      onChange={handleInputChange}
      onBlur={handleFieldBlur}
      placeholder={field.ui.placeholder}
      className={inputClassName}
      type={field.type === 'email' || field.type === 'number' || field.type === 'date' ? field.type : 'text'}
      required={field.rules?.required}
      minLength={field.rules?.minLength}
      maxLength={field.rules?.maxLength}
    />
  )
}

export default function ContentForm<T extends Record<string, any>>({
  schema,
  initialData,
  onSubmit,
  onChange,
  showSubmitButton = true,
  submitLabel = 'Göndər',
  className,
  asForm = true,
}: ContentFormProps<T>) {
  const initialState = useMemo(
    () => buildInitialStateFromSchema(schema, initialData),
    [initialData, schema],
  )
  const { formState, setFormState, handleInputChange } = useFormState<T>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof T & string, string>>>({})
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof T & string, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setFormState(initialState)
    setFieldErrors({})
    setTouchedFields({})
    setSubmitted(false)
  }, [initialState, setFormState])

  useEffect(() => {
    if (!onChange) return
    onChange(formState)
  }, [formState, onChange])

  const handleFieldBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const fieldName = e.target.name as keyof T & string
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }))
    const schemaField = schema.fields.find((field) => field.name === fieldName)
    if (!schemaField) return
    const nextError = getFieldValidationError(schemaField, formState[fieldName])
    setFieldErrors((prev) => ({ ...prev, [fieldName]: nextError || '' }))
  }

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    handleInputChange(e)
    const fieldName = e.target.name as keyof T & string
    const schemaField = schema.fields.find((field) => field.name === fieldName)
    if (schemaField?.type === 'select') {
      setTouchedFields((prev) => ({ ...prev, [fieldName]: true }))
    }
    const shouldValidate = submitted || touchedFields[fieldName] || schemaField?.type === 'select'
    if (!shouldValidate) {
      return
    }
    if (!schemaField) return
    const nextError = getFieldValidationError(schemaField, e.target.value)
    setFieldErrors((prev) => ({ ...prev, [fieldName]: nextError || '' }))
  }

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSubmitted(true)
    setTouchedFields(
      schema.fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {} as Partial<Record<keyof T & string, boolean>>),
    )
    const validationErrors = validateBySchema(schema, formState)
    const hasErrors = Object.values(validationErrors).some(Boolean)
    if (hasErrors) {
      setFieldErrors(validationErrors)
      return
    }
    setFieldErrors({})
    setSubmitting(true)
    try {
      await onSubmit(formState)
    } finally {
      setSubmitting(false)
    }
  }

  const fieldsContent = (
    <div>
      <div className={className || 'space-y-4'}>
        {schema.fields.map((field) => (
          <div key={field.name} className={field.ui.containerClassName || 'space-y-2'}>
            <label htmlFor={field.name} className="block text-lg font-semibold text-gray-800">
              {field.ui.label}
            </label>
            {field.ui.helperText && (
              <p className="text-sm text-gray-600 mb-3">{field.ui.helperText}</p>
            )}
            {renderField(
              field,
              formState[field.name],
              Boolean(fieldErrors[field.name] && (touchedFields[field.name] || submitted)),
              handleFieldChange,
              handleFieldBlur,
            )}
            {fieldErrors[field.name] && (touchedFields[field.name] || submitted) && (
              <p className="text-sm text-red-600">{fieldErrors[field.name]}</p>
            )}
          </div>
        ))}
        {showSubmitButton && (
          <div className="flex justify-end">
            <Button
              type={asForm ? 'submit' : 'button'}
              variant="primary"
              disabled={submitting}
              onClick={!asForm ? () => void submit() : undefined}
            >
              {submitting ? 'Göndərilir...' : submitLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  if (!asForm) {
    return fieldsContent
  }

  return <form onSubmit={submit}>{fieldsContent}</form>
}
