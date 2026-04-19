export const VACANCY_TYPE_VALUES = [
  'volunteer',
  'full_time',
  'part_time',
  'intern',
] as const;

export type VacancyTypeValue = (typeof VACANCY_TYPE_VALUES)[number];

export const VACANCY_TYPE_LABELS: Record<VacancyTypeValue, string> = {
  volunteer: 'Konulluluk',
  full_time: 'Full-time',
  part_time: 'Part-time',
  intern: 'Intern',
};

export const VACANCY_APPLICATION_METHOD_VALUES = ['link', 'email', 'phone'] as const;
export type VacancyApplicationMethodValue = (typeof VACANCY_APPLICATION_METHOD_VALUES)[number];

export const VACANCY_APPLICATION_METHOD_LABELS: Record<VacancyApplicationMethodValue, string> = {
  link: 'Application Link',
  email: 'Email',
  phone: 'Nomre',
};

export const VACANCY_PAYMENT_MODE_VALUES = ['fixed', 'range'] as const;
export type VacancyPaymentModeValue = (typeof VACANCY_PAYMENT_MODE_VALUES)[number];

export const MONTH_OPTIONS = [
  { value: 1, label: 'Yanvar' },
  { value: 2, label: 'Fevral' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Aprel' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Iyun' },
  { value: 7, label: 'Iyul' },
  { value: 8, label: 'Avqust' },
  { value: 9, label: 'Sentyabr' },
  { value: 10, label: 'Oktyabr' },
  { value: 11, label: 'Noyabr' },
  { value: 12, label: 'Dekabr' },
];

export const getYearOptions = (count = 7) => {
  const current = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => current + i);
};

export const isInternOrVolunteer = (type?: string | null) => type === 'intern' || type === 'volunteer';
