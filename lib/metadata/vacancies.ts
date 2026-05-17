import { Metadata } from 'next'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateSEOMetadata, generateJobPostingSchema, getLocationKeywords } from '@/lib/seo'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

/**
 * Generate metadata for individual vacancy pages
 */
export async function generateVacancyMetadata(identifier: string): Promise<Metadata> {
  try {
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
      .select('id, slug, title, description, work_type, type, location, application_deadline, organization, tags, focus_areas, created_at, submitted_at, updated_at, compensation')
      .eq('id', vacancyId)
      .single()

    if (error) {
      throw error
    }

    const compensation = vacancyRow?.compensation || {}
    const salary = compensation.amount ?? compensation.salary ?? compensation.min ?? compensation.max

    const vacancy: any = vacancyRow ? {
      _id: vacancyRow.id,
      title: vacancyRow.title,
      description: vacancyRow.description,
      employmentType: vacancyRow.work_type || vacancyRow.type,
      location: vacancyRow.location,
      applicationDeadline: vacancyRow.application_deadline,
      organization: vacancyRow.organization,
      tags: vacancyRow.tags || [],
      focusAreas: vacancyRow.focus_areas || [],
      createdAt: vacancyRow.created_at,
      submittedAt: vacancyRow.submitted_at,
      updatedAt: vacancyRow.updated_at,
      compensation,
      salary
    } : null
    
    if (!vacancy) {
      return generateSEOMetadata({
        title: 'Vacancy Not Found | icma360',
        description: 'The vacancy you are looking for could not be found.',
        noindex: true,
      })
    }

    const city = vacancy.location?.city || 'Azerbaijan'
    const deadline = new Date(vacancy.applicationDeadline).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return generateSEOMetadata({
      title: `${vacancy.title} - ${vacancy.organization} | ${city}da İş | icma360`,
      description: `${vacancy.title} vəzifəsi üçün ${vacancy.organization} şirkətində ${city}, Azərbaycanda müraciət edin. ${vacancy.employmentType} iş imkanı. Son tarix: ${deadline}. icma360-da pulsuz müraciət.`,
      keywords: [
        vacancy.title,
        `${vacancy.title} Azərbaycan`,
        `${vacancy.title} ${city}`,
        `${vacancy.title} iş elanı`,
        vacancy.organization,
        `${vacancy.organization} vakansiya`,
        `${vacancy.organization} işə qəbul`,
        `${vacancy.employmentType} iş`,
        `${city}da iş`,
        `${city}da vakansiya`,
        'iş elanları',
        'Azərbaycanda iş',
        ...getLocationKeywords(city),
        ...(vacancy.tags || []),
        ...(vacancy.focusAreas || []),
      ],
      canonical: `/resources/vacancies/${vacancyRow.slug || identifier}`,
      ogType: 'article',
      publishedTime: vacancy.createdAt || vacancy.submittedAt,
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
