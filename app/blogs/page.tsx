import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import BlogsClient from './BlogsClient'

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: "İcma Bloqları | icma360 — Gənclərin Hekayələri, Təcrübələri və Təlimləri",
    description: "Azərbaycan gənclərinin real təcrübələri, təlimləri, uğur hekayələri və faydalı məqalələri. İcma üzvlərimizin bölüşdüyü dəyərli yazıları oxuyun.",
    keywords: [
      'təcrübə',
      'təlim',
      'icma bloqları',
      'gənclərin hekayələri',
      'uğur hekayələri Azərbaycan',
      'gənclik təcrübələri',
      'bloq yazıları Azərbaycan',
      'gənclər üçün məqalələr',
      'karyera hekayələri',
      'şəxsi inkişaf hekayələri',
    ],
    canonical: '/blogs',
    ogType: 'website',
    locale: 'az_AZ',
  })
}

export default function BlogsPage() {
  return <BlogsClient />
}
