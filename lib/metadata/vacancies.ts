import { Metadata } from 'next'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateSEOMetadata, generateJobPostingSchema, getLocationKeywords } from '@/lib/seo'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

const WORK_TYPE_LABELS: Record<string, string> = {
  full_time: 'Tam ştat',
  part_time: 'Yarım ştat',
  volunteer: 'Könüllü',
  intern: 'Təcrübə',
}

/**
 * Generate metadata for individual vacancy pages
 */
export async function generateVacancyMetadata(identifier: string): Promise<Metadata> {
  try {
    if (identifier.startsWith('seed-')) {
      return generateSEOMetadata({
        title: 'Vacancy | icma360',
        description: 'View vacancy details on icma360',
        noindex: true,
        canonical: `/resources/vacancies/${identifier}`,
      })
    }

    const supabase = createSupabaseAdminClient()
    const { data: resolved } = await resolveEntityBySlugOrId(supabase, 'vacancies', identifier, 'id,slug')
    const vacancyId = resolved?.id

    if (!vacancyId) {
      return generateSEOMetadata({
        title: 'Vacancy Not Found | icma360',
        description: 'The vacancy you are looking for could not be found.',
        noindex: true,
      })
    }

    const { data: vacancyRow, error } = await supabase
      .from('vacancies')
      .select('id, slug, title, description, type, city, address, application_deadline, is_paid, payment_mode, payment_amount, payment_min, payment_max, requirements, benefits, created_at, updated_at, created_by (id, name)')
      .eq('id', vacancyId)
      .single()

    if (error) {
      throw error
    }

    const vacancy: any = vacancyRow ? {
      _id: vacancyRow.id,
      slug: vacancyRow.slug,
      title: vacancyRow.title,
      description: vacancyRow.description,
      employmentType: WORK_TYPE_LABELS[vacancyRow.type] || vacancyRow.type,
      location: { city: vacancyRow.city, address: vacancyRow.address },
      applicationDeadline: vacancyRow.application_deadline,
      organization: (vacancyRow as any)?.created_by?.name || 'icma360',
      requirements: vacancyRow.requirements || [],
      benefits: vacancyRow.benefits || [],
      isPaid: vacancyRow.is_paid,
      paymentMode: vacancyRow.payment_mode,
      paymentAmount: vacancyRow.payment_amount,
      paymentMin: vacancyRow.payment_min,
      paymentMax: vacancyRow.payment_max,
      createdAt: vacancyRow.created_at,
      updatedAt: vacancyRow.updated_at,
    } : null

    if (!vacancy) {
      return generateSEOMetadata({
        title: 'Vacancy Not Found | icma360',
        description: 'The vacancy you are looking for could not be found.',
        noindex: true,
      })
    }

    const city = vacancy.location?.city || 'Azerbaijan'
    const deadline = vacancy.applicationDeadline
      ? new Date(vacancy.applicationDeadline).toLocaleDateString('az-AZ', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : ''

    const salaryText = vacancy.isPaid
      ? vacancy.paymentMode === 'fixed'
        ? `${vacancy.paymentAmount} AZN`
        : vacancy.paymentMode === 'range'
          ? `${vacancy.paymentMin} - ${vacancy.paymentMax} AZN`
          : ''
      : 'Ödənişsiz'

    return generateSEOMetadata({
      title: `${vacancy.title} - ${vacancy.organization} | ${city}da İş | icma360`,
      description: `${vacancy.title} vəzifəsi üçün ${vacancy.organization} tərəfindən ${city}, Azərbaycanda müraciət edin. ${vacancy.employmentType} iş imkanı. ${salaryText ? `Maaş: ${salaryText}.` : ''} ${deadline ? `Son tarix: ${deadline}.` : ''} icma360-da pulsuz müraciət.`,
      keywords: [
        vacancy.title,
        `${vacancy.title} Azərbaycan`,
        `${vacancy.title} ${city}`,
        `${vacancy.title} iş elanı`,
        vacancy.organization,
        `${vacancy.organization} vakansiya`,
        `${vacancy.employmentType} iş`,
        `${city}da iş`,
        `${city}da vakansiya`,
        'iş elanları',
        'Azərbaycanda iş',
        ...getLocationKeywords(city),
      ],
      canonical: `/resources/vacancies/${vacancy.slug || identifier}`,
      ogType: 'article',
      publishedTime: vacancy.createdAt,
      modifiedTime: vacancy.updatedAt,
      structuredData: generateJobPostingSchema(vacancy),
    })
  } catch (error) {
    console.error('Error generating vacancy metadata:', error)
    return generateSEOMetadata({
      title: 'Vacancy | icma360',
      description: 'View vacancy details on icma360',
    })
  }
}
