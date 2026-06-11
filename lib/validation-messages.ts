/**
 * Localized validation messages for form validation.
 * Default locale is 'az' (Azerbaijani) to match the app UI.
 */

type ValidationMessageFn = (...args: any[]) => string

export type LocaleMessages = {
  required: ValidationMessageFn
  invalidEmail: ValidationMessageFn
  invalidUrl: ValidationMessageFn
  invalidDate: ValidationMessageFn
  invalidUuid: ValidationMessageFn
  invalidNumber: ValidationMessageFn
  invalidBoolean: ValidationMessageFn
  invalidArray: ValidationMessageFn
  invalidObject: ValidationMessageFn
  invalidType: ValidationMessageFn
  tooShort: ValidationMessageFn
  tooLong: ValidationMessageFn
  tooSmall: ValidationMessageFn
  tooLarge: ValidationMessageFn
  tooFewItems: ValidationMessageFn
  tooManyItems: ValidationMessageFn
  invalidFormat: ValidationMessageFn
  invalidEnum: ValidationMessageFn
  unknownField: ValidationMessageFn
  invalidBody: ValidationMessageFn
}

export const validationMessages: Record<string, LocaleMessages> = {
  az: {
    required: (name: string) => `${name} tələb olunur`,
    invalidEmail: (name: string) => `${name} etibarlı e-poçt ünvanı olmalıdır`,
    invalidUrl: (name: string) => `${name} etibarlı URL olmalıdır`,
    invalidDate: (name: string) => `${name} etibarlı tarix olmalıdır`,
    invalidUuid: (name: string) => `${name} etibarlı UUID olmalıdır`,
    invalidNumber: (name: string) => `${name} rəqəm olmalıdır`,
    invalidBoolean: (name: string) => `${name} boolean olmalıdır`,
    invalidArray: (name: string) => `${name} massiv olmalıdır`,
    invalidObject: (name: string) => `${name} obyekt olmalıdır`,
    invalidType: (name: string) => `${name} string olmalıdır`,
    tooShort: (name: string, min: number) => `${name} ən azı ${min} simvol olmalıdır`,
    tooLong: (name: string, max: number) => `${name} ən çox ${max} simvol olmalıdır`,
    tooSmall: (name: string, min: number) => `${name} ən azı ${min} olmalıdır`,
    tooLarge: (name: string, max: number) => `${name} ən çox ${max} olmalıdır`,
    tooFewItems: (name: string, min: number) => `${name} ən azı ${min} element olmalıdır`,
    tooManyItems: (name: string, max: number) => `${name} ən çox ${max} element olmalıdır`,
    invalidFormat: (name: string) => `${name} formatı yanlışdır`,
    invalidEnum: (name: string, values: string[]) => `${name} aşağıdakılardan biri olmalıdır: ${values.join(', ')}`,
    unknownField: (name: string) => `Naməlum sahə: ${name}`,
    invalidBody: () => `Sorğu body JSON obyekti olmalıdır`,
  },
  en: {
    required: (name: string) => `${name} is required`,
    invalidEmail: (name: string) => `${name} must be a valid email address`,
    invalidUrl: (name: string) => `${name} must be a valid URL`,
    invalidDate: (name: string) => `${name} must be a valid date`,
    invalidUuid: (name: string) => `${name} must be a valid UUID`,
    invalidNumber: (name: string) => `${name} must be a number`,
    invalidBoolean: (name: string) => `${name} must be a boolean`,
    invalidArray: (name: string) => `${name} must be an array`,
    invalidObject: (name: string) => `${name} must be an object`,
    invalidType: (name: string) => `${name} must be a string`,
    tooShort: (name: string, min: number) => `${name} must be at least ${min} characters`,
    tooLong: (name: string, max: number) => `${name} must be at most ${max} characters`,
    tooSmall: (name: string, min: number) => `${name} must be at least ${min}`,
    tooLarge: (name: string, max: number) => `${name} must be at most ${max}`,
    tooFewItems: (name: string, min: number) => `${name} must have at least ${min} items`,
    tooManyItems: (name: string, max: number) => `${name} must have at most ${max} items`,
    invalidFormat: (name: string) => `${name} has invalid format`,
    invalidEnum: (name: string, values: string[]) => `${name} must be one of: ${values.join(', ')}`,
    unknownField: (name: string) => `Unknown field: ${name}`,
    invalidBody: () => `Request body must be a JSON object`,
  },
} as const

export type Locale = keyof typeof validationMessages
