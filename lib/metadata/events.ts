import { Metadata } from 'next'
import connectToDatabase from '@/lib/mongoose'
import Event from '@/lib/models/Event'
import { generateSEOMetadata, generateEventSchema, getLocationKeywords } from '@/lib/seo'

/**
 * Generate metadata for individual event pages
 */
export async function generateEventMetadata(id: string): Promise<Metadata> {
  try {
    await connectToDatabase()
    const event = await Event.findById(id).lean() as any
    
    if (!event) {
      return generateSEOMetadata({
        title: 'Event Not Found | icma360',
        description: 'The event you are looking for could not be found.',
        noindex: true,
      })
    }

    const location = event.location?.type === 'online' 
      ? 'Online' 
      : event.location?.city || 'Azerbaijan'
    
    const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const eventTypeMap: { [key: string]: string } = {
      workshop: 'Workshop',
      training: 'Training Program',
      conference: 'Conference',
      webinar: 'Webinar',
      networking: 'Networking Event',
      seminar: 'Seminar',
      other: 'Event'
    }

    const eventTypeName = eventTypeMap[event.eventType] || 'Event'

    return generateSEOMetadata({
      title: `${event.title} - ${eventTypeName} ${location}da | icma360`,
      description: `${event.title} - ${event.organizationName || event.organization} tərəfindən təşkil olunan ${eventTypeName}. Tarix: ${eventDate}. ${location}da keçirilir. icma360-da pulsuz qeydiyyat.`,
      keywords: [
        event.title,
        `${eventTypeName} Azərbaycan`,
        `${location} tədbirləri`,
        `${location}da təlim`,
        event.organizationName || event.organization,
        `${event.eventType} Azərbaycan`,
        'təlim proqramları',
        'vorkşop',
        'konfrans',
        'seminar',
        'tədbir',
        'gənclik tədbirləri',
        ...getLocationKeywords(location !== 'Online' ? location : undefined),
        ...(event.tags || []),
        ...(event.focusAreas || []),
        'peşəkar inkişaf Azərbaycan',
        'təlim imkanları Azərbaycan',
        'networking Azərbaycan',
      ],
      canonical: `/resources/events/${id}`,
      ogType: 'article',
      publishedTime: event.createdAt || event.submittedAt,
      modifiedTime: event.updatedAt,
      structuredData: generateEventSchema(event),
    })
  } catch (error) {
    console.error('Error generating event metadata:', error)
    return generateSEOMetadata({
      title: 'Event | icma360',
      description: 'View event details on icma360',
    })
  }
}
