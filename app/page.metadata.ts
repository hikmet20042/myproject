import { Metadata } from 'next'
import { generateSEOMetadata, azerbaijanKeywords } from '@/lib/seo'

export const homePageMetadata: Metadata = generateSEOMetadata({
  title: "Azərbaycanda Ən Yaxşı İmkanları Tapın 2024-2025 | İş Elanları, Təcrübə, Təlim və Tədbirlər | icma360",
  description: "Azərbaycanın aparıcı gənclik imkan platforması. 500+ iş elanı, təcrübə proqramı, könüllülük imkanı, təlim tədbirləri, təqaüd və QHT əməkdaşlığı tapın. 1000+ gənc peşəkar ilə birlikdə karyeranızı qurun. Pulsuz qeydiyyat!",
  keywords: [
    ...azerbaijanKeywords,
    // Specific 2024-2025 opportunities
    'Azərbaycanda iş elanları 2024',
    'Bakıda vakansiyalar 2024',
    'Azərbaycanda təcrübə 2024',
    'Azərbaycanda könüllülük imkanları',
    'Azərbaycan təqaüd proqramları 2024',
    'Azərbaycanda qrantlar',
    'Azərbaycanda təlim proqramları',
    'Azərbaycanda vorkşoplar',
    'Azərbaycanda konfranslar',
    'Azərbaycanda networking tədbirləri',
    'Azərbaycanda karyera yarmarkaları',
    
    // City-specific
    'Bakıda iş 2024',
    'Bakıda təcrübə proqramları',
    'Bakıda tədbirlər',
    'Bakıda təlim',
    'Sumqayıtda iş',
    'Gəncədə imkanlar',
    
    // Sector-specific (Azerbaijani)
    'İT sahəsində iş Azərbaycan',
    'QHT vakansiyaları Azərbaycan',
    'marketinq işləri Azərbaycan',
    'maliyyə işləri Azərbaycan',
    'təhsil sahəsində iş Azərbaycan',
    'səhiyyə işləri Azərbaycan',
    
    // Career level (Azerbaijani)
    'başlanğıc səviyyə iş Azərbaycan',
    'məzunlar üçün iş Azərbaycan',
    'tələbələr üçün imkanlar',
    'gənc peşəkarlar Azərbaycan',
    'yeni məzun işləri Azərbaycan',
    
    // Platform specific
    'icma360 platforma',
    'icma360 imkanlar',
    'ən yaxşı iş portalı Azərbaycan',
    'top imkan platforması Azərbaycan',
    'pulsuz iş elanları',
    'etibarlı iş saytı Azərbaycan',
  ],
  canonical: '/',
  ogImage: '/og-home.png',
  ogType: 'website',
})
