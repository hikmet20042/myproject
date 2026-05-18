import { Metadata } from 'next'
import { generateSEOMetadata, getLocationKeywords } from '@/lib/seo'
import EventsClient from './EventsClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "Tədbirlər | icma360 — Təlim, Vörkşop, Konfrans və Gənclik Tədbirləri",
    description: "Azərbaycanda keçirilən təlim, vörkşop, konfrans və gənclik tədbirlərini kəşf edin. Öyrənmək, şəbəkələşmək və inkişaf etmək üçün fürsətlər.",
    keywords: [
      'tədbirlər Azərbaycan',
      'təlim proqramları Bakı',
      'vörkşop Azərbaycan',
      'konfrans Bakı',
      'gənclik tədbirləri',
      'networking tədbirləri',
      'peşəkar inkişaf tədbirləri',
      'onlayn təlim Azərbaycan',
      ...getLocationKeywords('Bakı'),
    ],
    canonical: '/resources/events',
    ogType: 'website',
    locale: 'az_AZ',
  })
}

export default function EventsPage() {
  return <EventsClient />
}
