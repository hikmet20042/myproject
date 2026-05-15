export type GlobalSearchType = 'event' | 'vacancy' | 'blog' | 'organization'

export type GlobalSearchItem = {
  id: string
  type: GlobalSearchType
  title: string
  snippet: string
  href: string
  imageUrl: string | null
  date: string | null
  ownerLabel: string | null
  locationLabel: string | null
  score: number
}

export type GlobalSearchResponse = {
  items: GlobalSearchItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  totalsByType: Record<GlobalSearchType, number>
}
