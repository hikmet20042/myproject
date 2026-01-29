import { Metadata } from 'next'
import connectToDatabase from '@/lib/mongoose'
import Vacancy from '@/lib/models/Vacancy'
import { generateSEOMetadata, generateJobPostingSchema, getLocationKeywords } from '@/lib/seo'

/**
 * Generate metadata for individual vacancy pages
 */
export async function generateVacancyMetadata(id: string): Promise<Metadata> {
  try {
    await connectToDatabase()
    const vacancy = await Vacancy.findById(id).lean() as any
    
    if (!vacancy) {
      return generateSEOMetadata({
        title: 'Vacancy Not Found | icma360',
        description: 'The vacancy you are looking for could not be found.',
        noindex: true,
      })
    }

    const city = vacancy.location?.city || 'Azerbaijan'
    const deadline = new Date(vacancy.applicationDeadline).toLocaleDateString('en-US', {
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
      canonical: `/resources/vacancies/${id}`,
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
