# Quick Start: Cloudinary Setup

## 1. Install Dependencies

The Cloudinary package is already installed in your `package.json`.

## 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### How to Get Credentials:

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier available)
2. Go to Dashboard
3. Copy your credentials from the Account Details section
4. Paste them into your `.env` file

## 3. Test the Integration

### Test Profile Image Upload

```bash
# Create a test script
curl -X POST http://localhost:3000/api/profile/image \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -F "file=@test-image.jpg"
```

### Test Event Creation with Images

Use the frontend form or API client to create an event with images.

## 4. Verify in Cloudinary Dashboard

1. Log into Cloudinary
2. Go to Media Library
3. Check for folders:
   - `profiles/` - Profile images
   - `events/` - Event images
   - `blogs/` - Blog images
   - `general/` - General uploads

## 5. Image Storage Structure

```
Cloudinary Media Library
├── profiles/
│   ├── profile_userId1
│   ├── profile_userId2
│   └── ...
├── events/
│   ├── event_eventId1_0
│   ├── event_eventId1_1
│   └── ...
├── blogs/
│   └── blog_*
└── general/
    └── *
```

## Key Features Implemented

✅ **Profile Images**
- Upload/update profile pictures for users and NGOs
- Automatic face detection and cropping
- Multiple size variants (400x, 200x, 100x)

✅ **Event Images**
- Multiple images per event
- Primary image selection
- Add/delete images after event creation

✅ **Blog Images**
- Optimized for content delivery
- Automatic format conversion (WebP)

✅ **General Upload**
- Context-based optimization
- Automatic compression
- Responsive variants

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | General image upload |
| `/api/profile/image` | POST | Upload profile image |
| `/api/profile/image` | GET | Get profile image |
| `/api/profile/image` | DELETE | Delete profile image |
| `/api/events` | POST | Create event (with images) |
| `/api/events/[id]/images` | POST | Add images to event |
| `/api/events/[id]/images` | DELETE | Delete event images |
| `/api/events/[id]/images` | PATCH | Update image properties |

## Database Changes

All models updated to support Cloudinary:

- ✅ `User.ts` - Added `profileImage` field
- ✅ `NGO.ts` - Added `profileImage` field
- ✅ `Event.ts` - Added `images` array field
- ✅ `ImageBlob.ts` - Added Cloudinary metadata fields

## Next Steps

1. **Set up Cloudinary account** and add credentials to `.env`
2. **Test profile image upload** via frontend
3. **Create an event with images** to test event functionality
4. **Monitor usage** in Cloudinary dashboard

## Troubleshooting

### "Image upload service is not configured"
- Check that all environment variables are set correctly
- Restart your dev server after adding env variables

### Upload fails with 401
- Verify your API key and secret are correct
- Check if your Cloudinary account is active

### Images not displaying
- Check browser console for CORS errors
- Verify the image URL in response
- Check Cloudinary Media Library to confirm upload

## Resources

📖 Full documentation: See `CLOUDINARY_INTEGRATION.md`
🌐 Cloudinary Dashboard: https://cloudinary.com/console
📚 Cloudinary Docs: https://cloudinary.com/documentation

## Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB bandwidth per month
- Up to 10,000 images
- Basic transformations

Perfect for development and small to medium applications!
