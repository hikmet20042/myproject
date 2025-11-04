# Cloudinary Image CDN Integration Guide

This document provides comprehensive information about the Cloudinary integration for image storage and delivery in the application.

## Overview

The application now uses **Cloudinary** as the primary CDN for storing and serving images. This replaces the previous blob storage and ImgBB solutions.

### Benefits of Cloudinary Integration

- **Automatic Optimization**: Images are automatically optimized for web delivery
- **Responsive Images**: Generate multiple sizes on-the-fly
- **Transformations**: Apply filters, crops, and effects via URL parameters
- **CDN Delivery**: Fast global content delivery
- **Storage Management**: Centralized image storage with easy deletion
- **Profile Images**: Optimized avatar storage with face detection
- **Event Images**: Support for multiple images per event

## Setup & Configuration

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Get Cloudinary Credentials

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → Account Settings
3. Copy your Cloud Name, API Key, and API Secret
4. Add them to your `.env` file

## API Endpoints

### General Image Upload

**Endpoint**: `POST /api/upload`

Upload any type of image with automatic optimization based on context.

**Request**: `multipart/form-data`

```typescript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('context', 'event'); // 'profile', 'blog', 'event', 'general'
formData.append('description', 'Image description');
formData.append('alt', 'Alt text for accessibility');
formData.append('tags', 'tag1,tag2,tag3');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

**Response**:
```json
{
  "id": "ObjectId",
  "url": "https://res.cloudinary.com/...",
  "publicId": "folder/image_id",
  "thumbnailUrl": "https://res.cloudinary.com/.../w_300/...",
  "width": 1920,
  "height": 1080,
  "size": 524288,
  "storage": "cloudinary"
}
```

### Profile Image Management

#### Upload Profile Image

**Endpoint**: `POST /api/profile/image`

**Request**: `multipart/form-data`

```typescript
const formData = new FormData();
formData.append('file', profileImage);

const response = await fetch('/api/profile/image', {
  method: 'POST',
  body: formData,
});
```

**Features**:
- Automatic face detection and centering
- Multiple size variants (400x400, 200x200, 100x100)
- Replaces existing profile image
- Works for both regular users and NGOs

#### Get Profile Image

**Endpoint**: `GET /api/profile/image`

```typescript
const response = await fetch('/api/profile/image');
const data = await response.json();
// Returns: { hasImage, url, publicId, thumbnailUrl }
```

#### Delete Profile Image

**Endpoint**: `DELETE /api/profile/image`

```typescript
await fetch('/api/profile/image', { method: 'DELETE' });
```

### Event Image Management

#### Create Event with Images

**Endpoint**: `POST /api/events`

**Request**: `multipart/form-data`

```typescript
const formData = new FormData();

// Add event data as JSON
formData.append('eventData', JSON.stringify({
  title: 'Event Title',
  description: 'Event Description',
  category: 'Workshop',
  eventType: 'workshop',
  eventDate: '2025-12-01',
  location: {
    type: 'physical',
    address: '123 Main St',
    city: 'City',
    country: 'Country'
  }
}));

// Add multiple images
formData.append('images', imageFile1);
formData.append('images', imageFile2);
formData.append('images', imageFile3);

const response = await fetch('/api/events', {
  method: 'POST',
  body: formData,
});
```

#### Add Images to Existing Event

**Endpoint**: `POST /api/events/[id]/images`

```typescript
const formData = new FormData();
formData.append('images', imageFile1);
formData.append('images', imageFile2);

const response = await fetch(`/api/events/${eventId}/images`, {
  method: 'POST',
  body: formData,
});
```

#### Delete Event Images

**Endpoint**: `DELETE /api/events/[id]/images`

```typescript
await fetch(`/api/events/${eventId}/images`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    publicIds: ['events/event_123_0', 'events/event_123_1']
  })
});
```

#### Set Primary Event Image

**Endpoint**: `PATCH /api/events/[id]/images`

```typescript
await fetch(`/api/events/${eventId}/images`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    publicId: 'events/event_123_1',
    updates: {
      isPrimary: true,
      alt: 'Updated alt text'
    }
  })
});
```

## Database Schema Changes

### User Model

```typescript
interface IUser {
  // ... existing fields
  profileImage?: {
    url: string
    publicId: string
  }
}
```

### NGO Model

```typescript
interface INGO {
  // ... existing fields
  profileImage?: {
    url: string
    publicId: string
  }
}
```

### Event Model

```typescript
interface IEvent {
  // ... existing fields
  imageUrl?: string // Legacy field for backward compatibility
  images?: Array<{
    url: string
    publicId: string
    alt?: string
    isPrimary?: boolean
  }>
}
```

### ImageBlob Model

```typescript
interface IImageBlob {
  // ... existing fields
  metadata?: {
    storage?: 'blob' | 'imgbb' | 'cloudinary'
    cloudinaryUrl?: string
    cloudinaryPublicId?: string
    // ... other fields
  }
}
```

## Frontend Integration Examples

### Upload Profile Picture Component

```tsx
'use client';

import { useState } from 'react';

export function ProfileImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/profile/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setImageUrl(data.url);
        alert('Profile image updated!');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {imageUrl && <img src={imageUrl} alt="Profile" />}
    </div>
  );
}
```

### Event Creation with Images

```tsx
'use client';

import { useState } from 'react';

export function EventForm() {
  const [images, setImages] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    
    // Add event data
    formData.append('eventData', JSON.stringify({
      title: 'My Event',
      description: 'Event description',
      // ... other event fields
    }));

    // Add images
    images.forEach(image => {
      formData.append('images', image);
    });

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert('Event created successfully!');
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Event fields */}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setImages(Array.from(e.target.files || []))}
      />
      <button type="submit">Create Event</button>
    </form>
  );
}
```

## Cloudinary Service API

The `cloudinaryService` provides utility functions for image operations:

```typescript
import cloudinaryService from '@/lib/services/cloudinaryService';

// Upload image
const result = await cloudinaryService.uploadImage(buffer, {
  folder: 'custom-folder',
  quality: 'auto:good',
  tags: ['tag1', 'tag2']
});

// Upload profile image (with face detection)
const profileResult = await cloudinaryService.uploadProfileImage(buffer, userId);

// Upload event image
const eventResult = await cloudinaryService.uploadEventImage(buffer, eventId, index);

// Delete image
await cloudinaryService.deleteImage(publicId);

// Delete multiple images
await cloudinaryService.deleteImages([publicId1, publicId2]);

// Generate thumbnail URL
const thumbnailUrl = cloudinaryService.getThumbnailUrl(publicId, 200);

// Generate responsive URL
const responsiveUrl = cloudinaryService.getResponsiveUrl(publicId, 800);

// Validate image file
const validation = cloudinaryService.validateImageFile(file, 10); // 10MB max
```

## Image Transformations

Cloudinary URLs support on-the-fly transformations:

### Basic Transformations

```javascript
// Original URL
https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{publicId}.jpg

// Resize to 300x300
https://res.cloudinary.com/{cloud_name}/image/upload/w_300,h_300,c_fill/{publicId}.jpg

// Auto-optimize quality
https://res.cloudinary.com/{cloud_name}/image/upload/q_auto,f_auto/{publicId}.jpg

// Rounded corners
https://res.cloudinary.com/{cloud_name}/image/upload/r_20/{publicId}.jpg

// Grayscale effect
https://res.cloudinary.com/{cloud_name}/image/upload/e_grayscale/{publicId}.jpg
```

### Advanced Example

```typescript
const transformedUrl = cloudinaryService.getTransformedUrl(publicId, {
  width: 600,
  height: 400,
  crop: 'fill',
  gravity: 'face',
  quality: 'auto:good',
  fetch_format: 'auto',
  effect: 'sharpen:100'
});
```

## Best Practices

### 1. Image Size Limits

- **Profile Images**: 5MB maximum
- **Event/Blog Images**: 10MB maximum
- Images are automatically optimized during upload

### 2. Context-Based Upload

Always specify the correct context when uploading:

- `profile`: For user/NGO profile pictures
- `event`: For event images
- `blog`: For blog post images
- `general`: For other images

### 3. Alt Text

Always provide descriptive alt text for accessibility:

```typescript
formData.append('alt', 'Women participating in human rights workshop');
```

### 4. Cleanup

When deleting events or users, ensure associated images are also deleted:

```typescript
// Delete user profile image
if (user.profileImage?.publicId) {
  await cloudinaryService.deleteImage(user.profileImage.publicId);
}

// Delete event images
if (event.images?.length) {
  const publicIds = event.images.map(img => img.publicId);
  await cloudinaryService.deleteImages(publicIds);
}
```

### 5. Error Handling

Always handle upload errors gracefully:

```typescript
const result = await cloudinaryService.uploadImage(buffer, options);

if (!result.success) {
  console.error('Upload failed:', result.error);
  return res.status(500).json({ error: result.error });
}
```

## Migration from Old System

### For Existing Images

Existing images stored in blob storage or ImgBB will continue to work. The system checks the `storage` field in `ImageBlob` model to determine how to handle images.

### Gradual Migration

1. New uploads automatically use Cloudinary
2. Old images remain accessible via their original URLs
3. When users update their profile images, old images can be migrated

## Troubleshooting

### Issue: "Image upload service is not configured"

**Solution**: Ensure all Cloudinary environment variables are set:
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Issue: Upload fails with 401 error

**Solution**: Check your Cloudinary API credentials are correct.

### Issue: Images not displaying

**Solution**: 
1. Check if the image URL is valid
2. Verify CORS settings in Cloudinary dashboard
3. Check browser console for errors

### Issue: Slow upload times

**Solution**:
1. Resize images on client-side before upload
2. Use image compression
3. Consider implementing upload progress indicators

## Security Considerations

1. **Authentication**: All upload endpoints require authentication
2. **Authorization**: Users can only manage their own images
3. **Validation**: File type and size validation on server-side
4. **Signed URLs**: Cloudinary uses signed requests for security
5. **Public IDs**: Generated systematically to prevent enumeration

## Performance Optimization

1. **Lazy Loading**: Use lazy loading for images
2. **Responsive Images**: Use different sizes for different viewports
3. **WebP Format**: Cloudinary automatically serves WebP when supported
4. **CDN Caching**: Images are cached globally via CDN
5. **Progressive JPEGs**: Use progressive loading for better UX

## Support & Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [Upload API](https://cloudinary.com/documentation/image_upload_api_reference)

## Changelog

### Version 1.0.0 (Current)

- ✅ Cloudinary service implementation
- ✅ Profile image upload/delete functionality
- ✅ Event multi-image support
- ✅ Blog image optimization
- ✅ Database schema updates
- ✅ Automatic image optimization
- ✅ Face detection for profile images
- ✅ Image transformation utilities
