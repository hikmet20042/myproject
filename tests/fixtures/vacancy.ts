// ---------------------------------------------------------------------------
// Vacancy fixtures
// ---------------------------------------------------------------------------

export interface VacancyFixture {
  id: string
  slug: string
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'draft'
  applicationType: 'email' | 'phone' | 'link' | 'platform'
  email?: string
  phone?: string
  applicationLink?: string
  city: string
  views: number
  createdAt: string
  updatedAt: string
}

const baseVacancy: Omit<VacancyFixture, 'id' | 'slug' | 'title'> = {
  description: 'Test vacancy description.',
  status: 'approved',
  applicationType: 'email',
  email: 'apply@example.com',
  city: 'Bakı',
  views: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function makeVacancy(overrides: Partial<VacancyFixture> = {}): VacancyFixture {
  const id = overrides.id ?? 'vac-1'
  return {
    ...baseVacancy,
    ...overrides,
    id,
    slug: overrides.slug ?? `test-vacancy-${id}`,
    title: overrides.title ?? 'Test Vacancy',
  }
}

export function makeVacancyList(count: number, overrides: Partial<VacancyFixture> = {}): VacancyFixture[] {
  return Array.from({ length: count }, (_, i) =>
    makeVacancy({ ...overrides, id: `vac-${i + 1}`, slug: `test-vacancy-${i + 1}`, title: `Test Vacancy ${i + 1}` })
  )
}

// ---------------------------------------------------------------------------
// Admin list item shape — matches adminConfig.vacancies.mapResponse input
// ---------------------------------------------------------------------------

export interface AdminVacancyItem {
  _id: string
  id?: string
  title: string
  status: 'pending' | 'approved' | 'rejected'
  applicationType: 'email' | 'phone' | 'link' | 'platform'
  city: string
  organizationId?: string
  organizationName?: string
  createdAt?: string
  views?: number
}

export function makeAdminVacancy(overrides: Partial<AdminVacancyItem> = {}): AdminVacancyItem {
  const id = overrides._id ?? overrides.id ?? 'admin-vac-1'
  return {
    _id: id,
    id,
    title: overrides.title ?? 'Pending Vacancy',
    status: overrides.status ?? 'pending',
    applicationType: overrides.applicationType ?? 'email',
    city: overrides.city ?? 'Bakı',
    organizationId: overrides.organizationId,
    organizationName: overrides.organizationName,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    views: overrides.views ?? 0,
  }
}

export function makeAdminVacancyList(count: number, overrides: Partial<AdminVacancyItem> = {}): AdminVacancyItem[] {
  return Array.from({ length: count }, (_, i) =>
    makeAdminVacancy({ ...overrides, _id: `admin-vac-${i + 1}`, title: `Test Vacancy ${i + 1}` })
  )
}
