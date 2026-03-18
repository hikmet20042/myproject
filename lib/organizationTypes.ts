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
