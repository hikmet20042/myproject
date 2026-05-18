import crypto from 'crypto';

const INDEXNOW_KEY_FILE = 'indexnow-key.txt';
const INDEXNOW_API_ENDPOINT = 'https://api.indexnow.org/indexnow';

export interface IndexNowConfig {
  apiKey: string;
  siteUrl: string;
}

export interface IndexNowSubmission {
  url: string;
  type: 'create' | 'update' | 'delete';
}

export function generateIndexNowKey(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function getIndexNowConfig(): IndexNowConfig | null {
  const apiKey = process.env.INDEXNOW_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org';

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    siteUrl,
  };
}

export async function submitToIndexNow(
  urls: string[],
  type: 'create' | 'update' | 'delete' = 'update'
): Promise<{ success: boolean; error?: string }> {
  const config = getIndexNowConfig();

  if (!config) {
    console.warn('IndexNow not configured: missing INDEXNOW_API_KEY environment variable');
    return { success: false, error: 'IndexNow not configured' };
  }

  try {
    const response = await fetch(INDEXNOW_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: new URL(config.siteUrl).hostname,
        key: config.apiKey,
        keyLocation: `${config.siteUrl}/${INDEXNOW_KEY_FILE}`,
        urlList: urls,
        type,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IndexNow submission failed:', errorText);
      return {
        success: false,
        error: `IndexNow API error: ${response.status} ${errorText}`,
      };
    }

    console.log(`Successfully submitted ${urls.length} URLs to IndexNow`);
    return { success: true };
  } catch (error) {
    console.error('IndexNow submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function generateFullUrl(path: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://icma360.org';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteUrl}${cleanPath}`;
}

export async function submitBlogToIndexNow(slug: string): Promise<{ success: boolean; error?: string }> {
  const url = generateFullUrl(`/blogs/${slug}`);
  return submitToIndexNow([url], 'create');
}

export async function submitVacancyToIndexNow(slug: string): Promise<{ success: boolean; error?: string }> {
  const url = generateFullUrl(`/resources/vacancies/${slug}`);
  return submitToIndexNow([url], 'create');
}

export async function submitEventToIndexNow(slug: string): Promise<{ success: boolean; error?: string }> {
  const url = generateFullUrl(`/resources/events/${slug}`);
  return submitToIndexNow([url], 'create');
}

export async function submitOrganizationToIndexNow(slug: string): Promise<{ success: boolean; error?: string }> {
  const url = generateFullUrl(`/o/${slug}`);
  return submitToIndexNow([url], 'create');
}
