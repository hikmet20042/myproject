import { Metadata } from 'next'
import { generateSEOMetadata, getLocationKeywords } from '@/lib/seo'
import VacanciesClient from './VacanciesClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "Vakansiyalar | icma360 — İş, Könüllülük, Təcrübə və Tam/Yarım Ştat İmkanları",
    description: "Azərbaycanda ən son iş elanları, könüllülük, təcrübə və tam/yarım ştat vakansiyalar. Karyerana başlamaq üçün ən yaxşı fürsətləri tap.",
    keywords: [
      'vakansiyalar Azərbaycan',
      'iş elanları Bakı',
      'könüllülük imkanları',
      'təcrübə proqramları',
      'tam ştat iş',
      'yarım ştat iş',
      'gənclər üçün iş',
      'yeni vakansiyalar',
      ...getLocationKeywords('Bakı'),
    ],
    canonical: '/resources/vacancies',
    ogType: 'website',
    locale: 'az_AZ',
  })
}

export default function VacanciesPage() {
  return <VacanciesClient />
}
