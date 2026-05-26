import { Metadata } from 'next'
import { generateSEOMetadata, getLocationKeywords } from '@/lib/seo'
import EventsClient from './EventsClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "Tədbirlər | icma360 — Təlimlər, Vörkşop, Konfrans, Pulsuz Tədbirlər və Gənclik Tədbirləri",
    description: "Azərbaycanda keçirilən təlimlər, pulsuz tədbirlər, vörkşop, konfrans və gənclik tədbirlərini kəşf edin. Təlimə qeydiyyat, öyrənmək, şəbəkələşmək və inkişaf etmək üçün fürsətlər.",
    keywords: [
      'təlim',
      'təlimlər',
      'təlimə qeydiyyat',
      'pulsuz tədbirlər',
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
