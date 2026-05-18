# IndexNow Integration Guide

## Overview

IndexNow is a protocol that allows websites to instantly notify search engines (Bing, Yandex, Naver, etc.) when content is added, updated, or deleted. This ensures your new content gets indexed immediately rather than waiting for the next crawl.

## What's Implemented

✅ **Automatic Submission**: New blogs, vacancies, and events are automatically submitted to IndexNow when approved
✅ **API Endpoints**: 
  - `/api/indexnow/key` - Serves the verification key
  - `/indexnow-key.txt` - Key file location for search engines
  - `/api/indexnow/submit` - Manual submission endpoint (admin only)
✅ **Helper Functions**: Reusable functions in `lib/indexnow.ts`
✅ **Setup Script**: `npm run indexnow:setup` generates and configures API key

## Setup Instructions

### 1. Generate API Key

```bash
npm run indexnow:setup
```

This will:
- Generate a secure random API key
- Add it to your `.env.local` file
- Display next steps

### 2. Register with Bing Webmaster Tools

1. Go to https://www.bing.com/indexnow/getstarted
2. Sign up for Bing Webmaster Tools
3. Add your website: `https://icma360.org`
4. Verify ownership (you'll need the key file at `/indexnow-key.txt`)

### 3. Verify Setup

After deployment, verify the key file is accessible:

```
https://icma360.org/indexnow-key.txt
```

This should return your API key as plain text.

### 4. Test Manual Submission

```bash
curl -X POST https://icma360.org/api/indexnow/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "urls": ["/blogs/test-blog", "/resources/vacancies/test-vacancy"],
    "type": "create"
  }'
```

## How It Works

### Automatic Submission Flow

1. **Content Created**: User submits blog/vacancy/event
2. **Admin Approval**: Content status changes to "approved"
3. **IndexNow Triggered**: System automatically submits URL to IndexNow API
4. **Search Engines Notified**: Bing, Yandex, and partners receive the update
5. **Content Indexed**: Search engines crawl and index the new content

### Supported Content Types

- ✅ Blogs: `/blogs/{slug}`
- ✅ Vacancies: `/resources/vacancies/{slug}`
- ✅ Events: `/resources/events/{slug}`
- ✅ Organizations: `/o/{slug}` (via helper function)

## API Reference

### Helper Functions (`lib/indexnow.ts`)

```typescript
// Submit single URL
submitToIndexNow(urls: string[], type: 'create' | 'update' | 'delete')

// Content-specific helpers
submitBlogToIndexNow(slug: string)
submitVacancyToIndexNow(slug: string)
submitEventToIndexNow(slug: string)
submitOrganizationToIndexNow(slug: string)

// Utility
generateFullUrl(path: string) // Converts /path to https://icma360.org/path
```

### API Endpoints

#### GET `/api/indexnow/key`
Returns the API key for verification.

**Response**: Plain text API key

#### POST `/api/indexnow/submit`
Manually submit URLs to IndexNow (admin only).

**Request Body**:
```json
{
  "urls": ["/path1", "/path2"],
  "type": "create" | "update" | "delete"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully submitted 2 URLs to IndexNow"
}
```

## Environment Variables

```env
# Required
INDEXNOW_API_KEY=your_generated_key_here

# Already configured
NEXT_PUBLIC_APP_URL=https://icma360.org
```

## Supported Search Engines

- ✅ Bing
- ✅ Yandex
- ✅ Naver
- ✅ Seznam
- ✅ Yep (by Ahrefs)
- ✅ Microsoft Start

## Monitoring & Debugging

### Check Logs

IndexNow submissions are logged to the console:

```
Successfully submitted 1 URLs to IndexNow
```

Or on error:

```
IndexNow submission failed: 400 Bad Request
```

### Common Issues

1. **"IndexNow not configured"**
   - Missing `INDEXNOW_API_KEY` in environment variables
   - Run `npm run indexnow:setup`

2. **Key file not accessible**
   - Ensure `/indexnow-key.txt` route is deployed
   - Check that the URL returns the API key

3. **Submission fails**
   - Verify API key matches the one in `/indexnow-key.txt`
   - Check that URLs are valid and accessible
   - Ensure site is registered with Bing Webmaster Tools

## Best Practices

1. **Submit only approved content**: Already implemented - only submits when status is "approved"
2. **Use fire-and-forget**: Using `void` to not block the response
3. **Batch submissions**: For bulk updates, use the manual endpoint with multiple URLs
4. **Monitor success rate**: Check logs for submission failures
5. **Keep key secure**: Never commit `.env.local` to version control

## Testing Locally

IndexNow works with localhost for testing:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
INDEXNOW_API_KEY=test_key_1234567890abcdef
```

Note: Search engines won't actually crawl localhost, but you can verify the API calls work.

## Next Steps

1. ✅ Run setup script
2. ✅ Register with Bing Webmaster Tools
3. ✅ Deploy to production
4. ✅ Verify key file is accessible
5. ✅ Monitor logs for successful submissions
6. 📊 Track indexing speed in Bing Webmaster Tools

## Resources

- [IndexNow Official Documentation](https://www.indexnow.org/)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [IndexNow GitHub](https://github.com/indexnow/indexnow)

---

**Last Updated**: 2026-05-18
**Status**: Production-ready
