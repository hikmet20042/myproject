import { Metadata } from 'next'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateSEOMetadata, generateEventSchema, getLocationKeywords } from '@/lib/seo'
import { EVENT_TYPE_LABELS, type EventTypeValue } from '@/lib/events/eventConfig'
import { resolveEntityBySlugOrId } from '@/lib/identifier'

/**
 * Generate metadata for individual event pages
 */
export async function generateEventMetadata(identifier: string): Promise<Metadata> {
  try {
    const supabase = createSupabaseAdminClient()
    const { data: resolved } = await resolveEntityBySlugOrId(supabase, 'events', identifier, 'id,slug')
    const eventId = resolved?.id

    if (!eventId) {
      return generateSEOMetadata({
        title: 'Event Not Found | icma360',
        description: 'The event you are looking for could not be found.',
        noindex: true,
      })
    }

    const { data: eventRow, error } = await supabase
      .from('events')
      .select('id, slug, title, description, event_date, end_date, location, application_link, organization_name, image_url, created_at, updated_at, tags, event_type')
      .eq('id', eventId)
      .single()

    if (error) {
      throw error
    }

    const event = eventRow ? {
      _id: eventRow.id,
      title: eventRow.title,
      description: eventRow.description,
      eventDate: eventRow.event_date,
      endDate: eventRow.end_date,
      location: eventRow.location,
      applicationLink: eventRow.application_link,
      organizationName: eventRow.organization_name,
      organization: eventRow.organization_name,
      website: eventRow.application_link,
      image: eventRow.image_url,
      createdAt: eventRow.created_at,
      submittedAt: eventRow.created_at,
      updatedAt: eventRow.updated_at,
      tags: eventRow.tags || [],
      focusAreas: [],
      eventType: eventRow.event_type
    } : null
    
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
    
    const eventDate = new Date(event.eventDate).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const eventTypeName = EVENT_TYPE_LABELS[event.eventType as EventTypeValue] || 'Tədbir'

    return generateSEOMetadata({
      title: `${event.title} - ${eventTypeName} ${location}da | icma360`,
      description: `${event.title} - ${event.organizationName || event.organization} tərəfindən təşkil olunan ${eventTypeName}. Tarix: ${eventDate}. ${location}da keçirilir. Müraciət xarici link üzərindən aparılır.`,
      keywords: [
        event.title,
        `${eventTypeName} Azərbaycan`,
        `${location} tədbirləri`,
        `${location}da təlim`,
        event.organizationName || event.organization,
        `${eventTypeName} Azərbaycan`,
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
      canonical: `/resources/events/${eventRow.slug || identifier}`,
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
