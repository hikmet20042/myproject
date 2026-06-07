// ---------------------------------------------------------------------------
// Blog fixtures — shape matches BlogItem from lib/api-types.ts
// ---------------------------------------------------------------------------

export interface BlogFixture {
  _id: string
  id: string
  slug: string
  title: string
  contentHtml: string
  authorName: string
  authorId: string
  authorUrlHandle: string
  status: 'pending' | 'approved' | 'rejected'
  views: number
  likes: number
  dislikes: number
  saves: number
  tags: string[]
  abstract: string
  createdAt: string
  updatedAt: string
  featuredImage?: string
}

const baseBlog: Omit<BlogFixture, '_id' | 'id' | 'slug' | 'title'> = {
  contentHtml: '<p>Lorem ipsum dolor sit amet.</p>',
  authorName: 'Test Author',
  authorId: 'test-author-id',
  authorUrlHandle: 'testauthor',
  status: 'approved',
  views: 0,
  likes: 0,
  dislikes: 0,
  saves: 0,
  tags: [],
  abstract: 'A test blog post.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function makeBlog(overrides: Partial<BlogFixture> = {}): BlogFixture {
  const id = overrides._id ?? overrides.id ?? 'blog-1'
  return {
    ...baseBlog,
    ...overrides,
    _id: id,
    id,
    slug: overrides.slug ?? `test-blog-${id}`,
    title: overrides.title ?? 'Test Blog',
  }
}

export function makeBlogList(count: number, overrides: Partial<BlogFixture> = {}): BlogFixture[] {
  return Array.from({ length: count }, (_, i) =>
    makeBlog({
      ...overrides,
      _id: `blog-${i + 1}`,
      id: `blog-${i + 1}`,
      slug: `test-blog-${i + 1}`,
      title: `Test Blog ${i + 1}`,
    })
  )
}

// ---------------------------------------------------------------------------
// Admin list item shape — matches adminConfig.blogs.mapResponse input
// (snake_case fields from /api/admin/blogs)
// ---------------------------------------------------------------------------

export interface AdminBlogItem {
  id: string
  title: string
  content_html: string
  abstract?: string
  status: 'pending' | 'approved' | 'rejected'
  admin_comment?: string | null
  author_id: string | { id?: string; name?: string; email?: string }
  is_anonymous: boolean
  created_at: string
  updated_at?: string
  reviewed_at?: string | null
  media?: Record<string, unknown>
}

export function makeAdminBlog(overrides: Partial<AdminBlogItem> = {}): AdminBlogItem {
  const id = overrides.id ?? 'admin-blog-1'
  return {
    id,
    title: overrides.title ?? 'Pending Blog',
    content_html: overrides.content_html ?? '<p>Content</p>',
    abstract: overrides.abstract,
    status: overrides.status ?? 'pending',
    admin_comment: overrides.admin_comment ?? null,
    author_id: overrides.author_id ?? 'test-author-id',
    is_anonymous: overrides.is_anonymous ?? false,
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at,
    reviewed_at: overrides.reviewed_at ?? null,
    media: overrides.media,
  }
}

export function makeAdminBlogList(count: number, overrides: Partial<AdminBlogItem> = {}): AdminBlogItem[] {
  return Array.from({ length: count }, (_, i) =>
    makeAdminBlog({ ...overrides, id: `admin-blog-${i + 1}`, title: `Test Blog ${i + 1}` })
  )
}
