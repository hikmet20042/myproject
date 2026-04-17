export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const isUuid = (value: string): boolean => UUID_REGEX.test(value)

export async function resolveEntityBySlugOrId(
  supabase: any,
  table: string,
  identifier: string,
  selectFields: string = 'id,slug'
) {
  const trimmed = String(identifier || '').trim()
  if (!trimmed) return { data: null, error: null }

  if (isUuid(trimmed)) {
    const byId = await supabase
      .from(table)
      .select(selectFields)
      .eq('id', trimmed)
      .maybeSingle()
    if (byId.data || byId.error) {
      return byId
    }
  }

  return supabase
    .from(table)
    .select(selectFields)
    .eq('slug', trimmed)
    .maybeSingle()
}
