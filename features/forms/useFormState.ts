import { useCallback, useState } from 'react'

type FormChangeEvent =
  React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>

type ArrayKeys<T> = {
  [K in keyof T]-?: T[K] extends Array<any> ? K : never
}[keyof T]

type ArrayItem<T, K extends ArrayKeys<T>> =
  T[K] extends Array<infer U> ? U : never

const setValueByPath = <T extends Record<string, any>>(
  source: T,
  path: string,
  value: unknown,
): T => {
  const keys = path.split('.')
  const root: Record<string, any> = { ...source }
  let currentSource: Record<string, any> = source
  let currentTarget: Record<string, any> = root

  keys.forEach((key, index) => {
    const isLeaf = index === keys.length - 1
    if (isLeaf) {
      currentTarget[key] = value
      return
    }

    const nextSourceValue = currentSource?.[key]
    const nextTargetValue =
      nextSourceValue && typeof nextSourceValue === 'object'
        ? Array.isArray(nextSourceValue)
          ? [...nextSourceValue]
          : { ...nextSourceValue }
        : {}

    currentTarget[key] = nextTargetValue
    currentSource = (nextSourceValue || {}) as Record<string, any>
    currentTarget = nextTargetValue as Record<string, any>
  })

  return root as T
}

export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [formState, setFormState] = useState<T>(initialState)

  const handleInputChange = useCallback((event: FormChangeEvent) => {
    const { name, value, type } = event.target
    const checked = (event.target as HTMLInputElement).checked
    const nextValue = type === 'checkbox' ? checked : value

    setFormState((prev) => setValueByPath(prev, name, nextValue))
  }, [])

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }, [])

  const setArrayItem = useCallback(
    <K extends ArrayKeys<T>>(field: K, index: number, value: ArrayItem<T, K>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: (prev[field] as Array<ArrayItem<T, K>>).map((item, itemIndex) =>
          itemIndex === index ? value : item,
        ),
      }))
    },
    [],
  )

  const addArrayItem = useCallback(
    <K extends ArrayKeys<T>>(field: K, value: ArrayItem<T, K>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: [...(prev[field] as Array<ArrayItem<T, K>>), value],
      }))
    },
    [],
  )

  const removeArrayItem = useCallback(
    <K extends ArrayKeys<T>>(field: K, index: number) => {
      setFormState((prev) => ({
        ...prev,
        [field]: (prev[field] as Array<ArrayItem<T, K>>).filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      }))
    },
    [],
  )

  return {
    formState,
    setFormState,
    handleInputChange,
    setFieldValue,
    setArrayItem,
    addArrayItem,
    removeArrayItem,
  }
}
