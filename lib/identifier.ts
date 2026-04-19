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
    if (byId.data) {
      return byId
    }

    if (table === 'organization_profiles') {
      const byAccountId = await supabase
        .from(table)
        .select(selectFields)
        .eq('account_id', trimmed)
        .maybeSingle()

      if (byAccountId.data) {
        return byAccountId
      }
    }
  }

  if (table === 'organization_profiles') {
    const byHandle = await supabase
      .from(table)
      .select(selectFields)
      .eq('url_handle', trimmed)
      .maybeSingle()

    if (byHandle.data) {
      return byHandle
    }
  }

  return supabase
    .from(table)
    .select(selectFields)
    .eq('slug', trimmed)
    .maybeSingle()
}
