export const ORGANIZATION_TYPE_VALUES = [
  'ngo',
  'student_club',
  'community',
  'startup',
  'training_center',
  'university_group',
  'other'
] as const;

export type OrganizationType = typeof ORGANIZATION_TYPE_VALUES[number];

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  ngo: 'Qeyri-hökumət təşkilatı (QHT)',
  student_club: 'Tələbə klubu',
  community: 'İcma qrupu',
  startup: 'Startap',
  training_center: 'Təlim mərkəzi',
  university_group: 'Universitet qrupu',
  other: 'Digər'
};

export const isOrganizationType = (value: string): value is OrganizationType =>
  ORGANIZATION_TYPE_VALUES.includes(value as OrganizationType);

export const FOCUS_AREA_VALUES = [
  "human_rights",
  "women_rights",
  "children_rights",
  "education",
  "healthcare",
  "environment",
  "poverty_alleviation",
  "legal_aid",
  "community_development",
  "youth_development",
  "elderly_care",
  "disability_rights",
  "lgbtq_rights",
  "mental_health",
  "other",
] as const;

export type FocusArea = (typeof FOCUS_AREA_VALUES)[number];

export const FOCUS_AREA_LABELS_AZ: Record<FocusArea, string> = {
  human_rights: "İnsan Hüquqları",
  women_rights: "Qadın Hüquqları",
  children_rights: "Uşaq Hüquqları",
  education: "Təhsil",
  healthcare: "Səhiyyə",
  environment: "Ətraf Mühit",
  poverty_alleviation: "Yoxsulluğun Azaldılması",
  legal_aid: "Hüquqi Yardım",
  community_development: "İcma İnkişafı",
  youth_development: "Gənclər İnkişafı",
  elderly_care: "Yaşlılara Dəstək",
  disability_rights: "Əlillik Hüquqları",
  lgbtq_rights: "LGBTQ+ Hüquqları",
  mental_health: "Mental Sağlamlıq",
  other: "Digər",
};

const LEGACY_FOCUS_AREA_MAP: Record<string, FocusArea> = {
  "human rights": "human_rights",
  "women rights": "women_rights",
  "children rights": "children_rights",
  education: "education",
  healthcare: "healthcare",
  environment: "environment",
  "poverty alleviation": "poverty_alleviation",
  "legal aid": "legal_aid",
  "community development": "community_development",
  "youth development": "youth_development",
  "elderly care": "elderly_care",
  "disability rights": "disability_rights",
  "lgbtq+ rights": "lgbtq_rights",
  "mental health": "mental_health",
  other: "other",
};

export const isFocusArea = (value: string): value is FocusArea =>
  FOCUS_AREA_VALUES.includes(value as FocusArea);

export const normalizeFocusArea = (value: unknown): FocusArea | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isFocusArea(trimmed)) return trimmed;

  const normalizedKey = trimmed.toLowerCase();
  return LEGACY_FOCUS_AREA_MAP[normalizedKey] || null;
};

export const normalizeFocusAreas = (input: unknown): FocusArea[] => {
  if (!Array.isArray(input)) return [];
  const normalized = input
    .map((value) => normalizeFocusArea(value))
    .filter((value): value is FocusArea => Boolean(value));
  return Array.from(new Set(normalized));
};
