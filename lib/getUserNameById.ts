// Fetches user info by id from the API
export async function getUserNameById(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/users/${userId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user?.name || null;
  } catch {
    return null;
  }
}
