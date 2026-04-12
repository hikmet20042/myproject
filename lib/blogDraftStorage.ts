export const getSubmitDraftKey = (userId?: string) =>
  userId ? `draftBlog:${userId}` : 'draftBlog'

export const getEditDraftKey = (userId?: string, blogId?: string) => {
  if (userId && blogId) return `editBlogData:${userId}:${blogId}`
  if (blogId) return `editBlogData:${blogId}`
  return 'editBlogData'
}

export const safeParseJson = <T>(raw: string | null): T | null => {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export const readLocalDraft = <T>(key: string): T | null => {
  return safeParseJson<T>(localStorage.getItem(key))
}

export const writeLocalDraft = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const removeLocalDraft = (key: string) => {
  localStorage.removeItem(key)
}
