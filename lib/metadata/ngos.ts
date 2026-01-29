import { Metadata } from 'next'
import connectToDatabase from '@/lib/mongoose'
import NGO from '@/lib/models/NGO'
import { generateSEOMetadata, generateNGOSchema, getLocationKeywords } from '@/lib/seo'

/**
 * Generate metadata for individual NGO pages
 */
export async function generateNGOMetadata(id: string): Promise<Metadata> {
  try {
    await connectToDatabase()
    const ngo = await NGO.findById(id).lean() as any
    
    if (!ngo) {
      return generateSEOMetadata({
        title: 'Organization Not Found | icma360',
        description: 'The organization you are looking for could not be found.',
        noindex: true,
      })
    }

    const city = ngo.location?.city || 'Azerbaijan'
    const focusAreasText = ngo.focusAreas?.slice(0, 3).join(', ') || 'community development'

    return generateSEOMetadata({
      title: `${ngo.organizationName} - ${city}da QHT | Əməkdaş Təşkilatlar | icma360`,
      description: `${ngo.organizationName} haqqında məlumat - ${city}da ${focusAreasText} sahəsində fəaliyyət göstərən etibarlı QHT. İmkanları tapın, əlaqə qurun və əməkdaşlıq edin. icma360-ın təsdiqlənmiş tərəfdaş şəbəkəsinin hissəsi.`,
      keywords: [
        ngo.organizationName,
        `${ngo.organizationName} Azərbaycan`,
        `QHT ${city}`,
        'QHT Azərbaycan',
        'qeyri-hökumət təşkilatları Azərbaycan',
        'ictimai təşkilatlar',
        `${city}da QHT`,
        ...(ngo.focusAreas || []),
        ...getLocationKeywords(city),
        'könüllülük imkanları',
        'QHT vakansiyaları Azərbaycan',
        'sosial təsir Azərbaycan',
        'icma təşkilatları',
        'QHT siyahısı',
        'təşkilat kataloqu',
      ],
      canonical: `/resources/ngos/${id}`,
      ogType: 'profile',
      publishedTime: ngo.createdAt,
      modifiedTime: ngo.updatedAt,
      structuredData: generateNGOSchema(ngo),
    })
  } catch (error) {
    console.error('Error generating NGO metadata:', error)
    return generateSEOMetadata({
      title: 'Organization | icma360',
      description: 'View organization details on icma360',
    })
  }
}
