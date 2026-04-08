=== FILE: media-upload-system.md ===

# Media & Upload Handling — Deep Current State

## 1. Feature Summary
The media/upload system is implemented as a mixed model combining:
- Cloudinary-backed image hosting for newly uploaded media through API upload endpoints.
- Supabase Postgres metadata persistence in the image_blobs table for uploaded image records.
- Direct URL-based media fields in feature tables (events.image_url, events.images, materials.image_url, vacancies.image_url, blogs.featured_image, user_profiles.avatar, organization_profiles.profile_image).
- API-based binary retrieval path through /api/images/[id] when image_blobs.data is populated.

Current runtime behavior uses multiple upload entry points:
- Generic upload endpoint: POST /api/upload.
- Profile image endpoint family: GET/POST/DELETE /api/profile/image.
- Event image management endpoint family: POST/DELETE/PATCH /api/events/[id]/images.
- Event create endpoint with optional multipart image upload: POST /api/events (multipart/form-data variant).

Current client upload surfaces include:
- Shared ImageUpload UI component that posts to /api/upload with context values.
- BlocknoteEditor upload hook posting embedded editor images to /api/upload.
- Profile edit file input in components/Profile/Profile.tsx posting avatar images to /api/upload with context=profile.

Cloudinary is configured in lib/services/cloudinaryService.ts using:
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

The generic uploader and profile uploader explicitly block operation when Cloudinary is not configured.

The image_blobs table serves as the canonical metadata ledger for uploaded images and supports:
- ownership (uploaded_by)
- descriptive metadata (description, alt, tags)
- media metadata (mimetype/content_type, width, height, size)
- analytics fields (usage_count, last_accessed)
- storage metadata JSON (Cloudinary URL/public ID info)
- optional binary data payload (data bytea)

## 2. All User Capabilities
Current capabilities present in code are:

- Upload images through generic uploader:
  - Endpoint: POST /api/upload.
  - Auth required.
  - Context-aware Cloudinary folder/transform behavior.

- Upload profile images through dedicated profile endpoint:
  - Endpoint: POST /api/profile/image.
  - Auth required.
  - Handles regular users and approved organizations differently.
  - Replaces prior Cloudinary profile image reference before saving new one.

- Delete profile images:
  - Endpoint: DELETE /api/profile/image.
  - Auth required.
  - Deletes Cloudinary image when publicId exists.
  - Clears profile image fields in DB.

- Fetch current profile image metadata:
  - Endpoint: GET /api/profile/image.
  - Auth required.
  - Returns hasImage, url, publicId, thumbnailUrl when available.

- Upload event images during event creation:
  - Endpoint: POST /api/events.
  - When request is multipart/form-data with images[] + eventData JSON, server uploads images to Cloudinary after creating event row.

- Upload additional images for an existing event:
  - Endpoint: POST /api/events/[id]/images.
  - Auth required, approved organization required, ownership required.
  - Uploads one or more images and appends to events.images.

- Delete specific event images from an event:
  - Endpoint: DELETE /api/events/[id]/images.
  - Auth required, approved organization required, ownership required.
  - Deletes target Cloudinary images by publicIds array.
  - Rewrites events.images and events.image_url primary pointer.

- Update event image properties (including primary selection):
  - Endpoint: PATCH /api/events/[id]/images.
  - Auth required, approved organization required, ownership required.
  - Updates image object in events.images by publicId.
  - Supports updates payload such as isPrimary.

- Upload embedded rich-text media in blog editor:
  - BlocknoteEditor uploadFile posts file to /api/upload with context="blog".
  - Returns uploaded URL into editor content.

- Upload material images in admin material form:
  - ImageUpload component posts file to /api/upload with context="material".
  - Returned URL is stored as material imageUrl and sent to materials APIs.

- Upload profile avatar from profile form:
  - components/Profile/Profile.tsx file input posts file to /api/upload with context="profile".
  - Returned URL is stored in formData.avatar and later persisted via profile update API.

- List user-owned uploaded images metadata:
  - Endpoint: GET /api/images with pagination + optional mimetype filter.
  - Auth required.

- Delete user-owned image_blobs rows:
  - Endpoint: DELETE /api/images?id=<uuid>.
  - Auth required.
  - Ownership enforced by uploaded_by.

- Retrieve image content by image_blobs ID:
  - Endpoint: GET /api/images/[id].
  - Public endpoint in current implementation (no auth gate).
  - Serves bytea binary if present, otherwise redirects to Cloudinary URL from metadata.cloudinaryUrl.

- Retrieve metadata headers for image by ID:
  - Endpoint: HEAD /api/images/[id].

- Admin image cleanup operations:
  - Endpoint: GET /api/admin/cleanup-images for cleanup estimation.
  - Endpoint: POST /api/admin/cleanup-images for deleting old unused image_blobs rows.

## 3. Detailed Flows

### Generic Upload Flow
Route: POST /api/upload

1. Auth check via getServerSession; rejects with 401 if no session user ID.
2. Cloudinary readiness check via cloudinaryService.isConfigured(); returns 503 if not configured.
3. Parses multipart formData with keys:
   - file
   - description
   - alt
   - tags (comma-separated)
   - context (default general)
4. Validates file presence; returns 400 if absent.
5. Validates file type and size using cloudinaryService.validateImageFile(file, 10).
   - Allowed MIME: image/jpeg, image/jpg, image/png, image/gif, image/webp.
   - Max size default: 10 MB.
6. Reads file bytes into Buffer.
7. Parses tags string into tag array.
8. Extracts dimensions with getImageDimensions:
   - Primary method: sharp(...).metadata().
   - Fallback parser for JPEG/PNG headers when sharp metadata extraction fails.
9. Dispatches upload behavior by context:
   - profile: cloudinaryService.uploadProfileImage(buffer, userId)
   - blog/article: cloudinaryService.uploadBlogImage(buffer, filename)
   - event: cloudinaryService.uploadImage(buffer, { folder: 'events', tags: ['event', ...tagArray] })
   - material: cloudinaryService.uploadMaterialImage(buffer)
   - default/general: cloudinaryService.uploadImage(buffer, { folder: 'general', tags: tagArray })
10. On Cloudinary upload failure returns 500.
11. Inserts metadata row into image_blobs with:
   - data: null (for Cloudinary-hosted path)
   - uploaded_by: current user ID
   - size from Cloudinary bytes fallback to file.size
   - width/height from Cloudinary fallback to extracted dimensions
   - is_compressed: false
   - original_size: original file size
   - metadata JSON including context, storage='cloudinary', cloudinaryUrl, cloudinaryPublicId, format
12. Returns JSON payload including:
   - id, filename, originalName
   - mimetype, size
   - url (Cloudinary secureUrl)
   - publicId
   - width, height
   - description, alt, tags
   - uploadedAt
   - isCompressed, originalSize
   - storage='cloudinary'
   - thumbnailUrl (generated from publicId when available)
   - metadata

Internal helper functions also defined in this route:
- compressImageIfNeeded (sharp-based compression pipeline with quality reduction and resize loops)
- optimizeImageForWeb (resize + webp conversion logic)
These helper functions are present in file and currently not called in active POST execution path.

### Profile Image Upload Flow
Primary dedicated route: POST /api/profile/image

1. Session auth required; 401 on missing auth.
2. Cloudinary config check via isConfigured; 503 if missing.
3. Reads formData file field.
4. Validates with cloudinaryService.validateImageFile(file, 5) (5 MB cap for this route).
5. Detects profile owner type from session:
   - Organization mode when accountType=organization and organizationStatus=approved.
   - Otherwise regular user mode.
6. Loads current profile record:
   - organization_profiles(account_id, profile_image) for organizations.
   - user_profiles(id, avatar, avatar_metadata) for regular users.
7. If current profile has a Cloudinary publicId:
   - organization: profile_image.publicId
   - user: avatar_metadata.publicId
   then attempts cloudinaryService.deleteImage(existingPublicId) before uploading replacement.
8. Uploads new image through cloudinaryService.uploadProfileImage(buffer, userId).
   - Uses folder profiles.
   - Uses deterministic public ID profile_<userId>.
   - Applies face-centered transformations and eager variants.
9. Persists new profile image reference:
   - organization_profiles.profile_image = { url, publicId }
   - or user_profiles.avatar = secureUrl, avatar_blob_id = null, avatar_metadata = { publicId }
10. Returns success payload with profileImage object, url, and thumbnailUrl.

Alternative profile upload path also exists:
- components/Profile/Profile.tsx uploads avatar through generic /api/upload with context=profile.
- The returned URL is saved into profile form data and persisted through profile update APIs.

### Event Image Upload Flow
There are two event upload paths.

Path A: Event creation with images via POST /api/events

1. Requires authenticated approved organization account.
2. Parses request:
   - multipart/form-data: expects eventData JSON string + images[] files
   - otherwise JSON body only
3. Validates event payload fields (title, description, category, eventDate, location, eventType).
4. Creates events row first with images initialized as [].
5. If image files are present:
   - each image validated with cloudinaryService.validateImageFile(file, 10)
   - each valid image uploaded via cloudinaryService.uploadEventImage(buffer, eventId, index)
   - uploaded image object shape: { url, publicId, alt, isPrimary }
   - first uploaded image set as isPrimary=true
6. Updates event row with:
   - images: uploaded image array
   - image_url: first uploaded image URL

Path B: Post-creation event image management via /api/events/[id]/images

POST /api/events/[id]/images:
1. Auth required + approved organization required.
2. Loads event by ID and checks owner by created_by or created_by_organization matching session user ID.
3. Reads formData images[] files.
4. For each file:
   - validates with max 10 MB
   - uploads via cloudinaryService.uploadEventImage(buffer, eventId, currentImageCount + i)
   - builds image object { url, publicId, alt, isPrimary }
5. Appends uploaded objects to existing events.images.
6. If event.image_url is empty, sets it to first new uploaded image URL.
7. Updates event row and returns uploadedImages + event image state.

### Media Deletion Flow

Flow A: Profile image deletion via DELETE /api/profile/image
1. Auth required.
2. Resolves user mode (approved organization vs regular user).
3. Loads current stored publicId.
4. Attempts Cloudinary deletion for existing publicId.
5. Clears DB image reference:
   - organization_profiles.profile_image = null
   - user_profiles.avatar = null, avatar_metadata = null
6. Returns success message.

Flow B: Event media deletion via DELETE /api/events/[id]/images
1. Auth + approved org + ownership checks.
2. Request body must include publicIds array.
3. Calls cloudinaryService.deleteImages(publicIds).
4. Filters event.images removing matching publicId values.
5. Recalculates primary image state:
   - if any images remain and none marked primary, first image gets isPrimary=true
   - image_url set to primary URL (or first URL fallback)
   - if no images remain image_url set null
6. Persists updated images/image_url and returns delete summary.

Flow C: User-owned image_blobs row deletion via DELETE /api/images?id=<id>
1. Auth required.
2. Deletes image_blobs row only where id and uploaded_by both match.
3. Returns deleted metadata summary.

Flow D: Admin cleanup deletion via POST /api/admin/cleanup-images
1. Admin-only role gate.
2. daysOld accepted from request body (1..365).
3. Deletes image_blobs rows where usage_count = 0 and uploaded_at older than cutoff.
4. Returns deletedCount and criteria.

### Media Update Flow (e.g. primary image selection)

Flow A: Event image update via PATCH /api/events/[id]/images
1. Auth + approved org + ownership checks.
2. Body requires publicId and updates object.
3. Locates target image object in events.images by publicId.
4. If updates.isPrimary is true:
   - clears isPrimary on all images first.
   - applies updates to target image.
   - sets event.image_url to target image URL.
5. Writes updated events.images and image_url.
6. Returns updated event image state.

Flow B: Profile image replacement via POST /api/profile/image
- Existing image reference is removed (Cloudinary delete attempt), then replaced with new URL/publicId fields.

Flow C: Generic profile avatar update via profile APIs
- /api/users/profile and /api/profile parse avatar values including /api/images/<id> blob URLs and map avatar_blob_id when applicable.

## 4. Full Code Mapping

### API Routes
Core media routes:
- app/api/upload/route.ts
  - Generic uploader (Cloudinary + image_blobs metadata insert).
- app/api/profile/image/route.ts
  - Dedicated profile image CRUD with Cloudinary lifecycle.
- app/api/images/route.ts
  - Authenticated list/delete for user-owned image_blobs records.
- app/api/images/[id]/route.ts
  - Binary/redirect retrieval endpoint and HEAD metadata response.
- app/api/events/[id]/images/route.ts
  - Event image add/delete/update (primary toggling).

Additional media-relevant routes:
- app/api/events/route.ts
  - Supports multipart event creation with images[] uploads to Cloudinary.
- app/api/events/[id]/route.ts
  - Updates image_url field during event updates.
- app/api/blogs/route.ts
  - Persists media and featured image references; validates blob ownership for content references.
- app/api/users/profile/route.ts
  - Maps avatar URLs and avatar_blob_id from /api/images/<id> values.
- app/api/profile/route.ts
  - Returns user/organization profile image fields.
- app/api/organization/profile/route.ts
  - Returns and updates organization profile including profile_image field.
- app/api/profile/organization/route.ts
  - Organization profile update route (non-upload) for profile data.
- app/api/materials/route.ts and app/api/materials/[id]/route.ts
  - Store image_url in materials records from uploaded URL values.
- app/api/vacancies/route.ts and app/api/vacancies/[id]/route.ts
  - Store/update image_url (URL field usage).
- app/api/admin/cleanup-images/route.ts
  - Admin cleanup and size/count stats for image_blobs.

### Services / Utils
- lib/services/cloudinaryService.ts
  - Cloudinary client configuration.
  - uploadImage generic method.
  - uploadProfileImage, uploadEventImage, uploadBlogImage, uploadMaterialImage specialized wrappers.
  - deleteImage and deleteImages.
  - URL helper generation for transformations/responsive/thumbnail.
  - File validation helper for type and max size.
  - publicId extraction from URL helper.

- lib/utils/imageUtils.ts
  - URL/blob ID conversion helpers for /api/images references.
  - Content image scanning for BlockNote content trees.
  - Blob ownership validation against image_blobs.uploaded_by.
  - Cleanup helper (usage_count + uploaded_at age).
  - Metadata retrieval helper for blob IDs.

- lib/services/imageProcessingService.ts
  - Advanced sharp-based processing pipeline and variant generation.
  - saveImageVariants persists binary variants into image_blobs.data.

- lib/utils/imageMigration.ts
  - File-system to image_blobs migration utilities for legacy avatar/featured_image fields.

- lib/services/imgbbService.ts
  - ImgBB upload utility class exists in codebase; defines upload and context-selection helpers.

### Components (if any)
- components/shared/ImageUpload.tsx
  - Reusable upload widget.
  - Client-side checks: image type and max size.
  - Posts selected file + context to /api/upload.
  - Handles preview, loading state, error rendering, remove/reset.

- components/BlocknoteEditor.tsx
  - Uses BlockNote uploadFile hook.
  - Posts file + context to /api/upload.
  - On failure falls back to FileReader data URL.

- components/Profile/Profile.tsx
  - Inline file input for avatar upload.
  - Sends file + alt + description + context=profile to /api/upload.
  - Stores returned URL in form state.

- app/admin/page.tsx
  - Uses ImageUpload for materials form with context=material.

- app/submit/blog/step2/page.tsx and app/edit/blog/[id]/step2/page.tsx
  - Use BlocknoteEditor with context=blog for inline media uploads.

## 5. Data Flow & Storage

Storage locations currently present:
- Cloudinary:
  - Primary store for new uploads done via /api/upload, /api/profile/image, and event upload paths.
  - Public URLs and public IDs returned and reused.
- Supabase Postgres image_blobs table:
  - Stores metadata for generic uploads.
  - May store binary data in data bytea for blob-based records and migration/processing flows.
- Feature tables with media references:
  - user_profiles.avatar, user_profiles.avatar_blob_id, user_profiles.avatar_metadata
  - organization_profiles.profile_image (jsonb)
  - blogs.featured_image, blogs.featured_image_blob_id, blogs.media
  - events.image_url, events.images (jsonb array of objects)
  - materials.image_url
  - vacancies.image_url

image_blobs metadata pattern in generic upload:
- filename/original_name/mimetype/content_type
- size, width, height
- uploaded_by, uploaded_at
- description/alt/tags
- is_compressed/original_size
- metadata JSON with context + Cloudinary details:
  - storage: cloudinary
  - cloudinaryUrl
  - cloudinaryPublicId
  - format

URL handling patterns:
- Generic upload returns direct Cloudinary secure URL as url.
- Blob retrieval URL format remains /api/images/<id>.
- /api/images/[id] retrieval behavior:
  - if data bytea exists: streams binary with caching headers.
  - if no data and metadata.cloudinaryUrl exists: 302 redirect to Cloudinary URL.

Usage tracking behavior:
- GET /api/images/[id] increments usage_count and last_accessed asynchronously after row lookup.
- Admin cleanup and utility cleanup rely on usage_count and uploaded_at age.

Cache-related media response behavior:
- /api/images/[id] sets Cache-Control public,max-age=31536000,immutable and ETag built from id + uploaded/created timestamp.
- HEAD endpoint exposes content headers for same resource identity.

## 6. Interaction With Other Systems

Profile system interaction:
- Profile form upload uses /api/upload context=profile and persists returned URL through profile APIs.
- Dedicated profile image API family manages profile replacement/deletion and Cloudinary publicId lifecycle.
- User profile APIs map avatar blob URLs (/api/images/<id>) to avatar_blob_id when supplied.
- Organization profile stores profile_image JSON object containing URL/publicId when set by profile image route.

Blog system interaction:
- Blog editor media upload uses BlocknoteEditor -> /api/upload context=blog.
- Blog create/update APIs process content/media references via imageUtils helpers.
- validateContentImages enforces ownership for blob URL references in content.
- featured_image and featured_image_blob_id fields persist featured media references.

Events system interaction:
- Event creation supports multipart image upload directly in /api/events.
- Event image lifecycle endpoint /api/events/[id]/images handles add/delete/update(primary).
- events table carries both image_url (primary) and images (collection objects with url/publicId/isPrimary/alt).
- Event update route also supports direct imageUrl assignment from payload.

Materials system interaction:
- Admin material form uses shared ImageUpload component with context=material.
- Returned upload URL stored into materials.image_url via /api/materials and /api/materials/[id].

Vacancies system interaction:
- Vacancies API stores and updates vacancies.image_url from payload URL values.
- Current vacancy create/update flow uses URL field persistence path.

Admin system interaction:
- Admin cleanup endpoint provides image_blobs cleanup estimation and deletion actions.
- Admin material management UI uses shared ImageUpload, thereby using generic upload route.

## 7. Role Behavior

Regular authenticated user:
- Can call /api/upload and upload images within validation limits.
- Can upload profile avatar through profile form (generic upload path) and persist in user profile.
- Can list and delete own image_blobs records via /api/images GET/DELETE (ownership enforced).
- Can retrieve any /api/images/[id] resource currently exposed by ID endpoint.

Approved organization account:
- Can create events and upload event images on creation (multipart /api/events).
- Can manage images of own events only via /api/events/[id]/images (upload/delete/update).
- Can upload/update/delete organization profile image through /api/profile/image with organization-specific storage field.

Admin user:
- Can run /api/admin/cleanup-images GET/POST for storage cleanup operations.
- Can manage materials and therefore set image_url values, including uploads via shared UI.
- Admin event moderation routes include image fields in mapped event payloads but do not directly execute upload operations.

Ownership and authorization checks present:
- /api/upload requires authenticated session.
- /api/events/[id]/images enforces approved organization + owner constraint.
- /api/images GET/DELETE enforces user ownership on image_blobs by uploaded_by.
- /api/profile/image enforces authenticated user and profile existence.
- /api/admin/cleanup-images enforces session.user.role === admin.

## 8. Edge Behaviors (Observed)

File type and size validation:
- Central validation in cloudinaryService.validateImageFile.
- Allowed formats restricted to jpeg/jpg/png/gif/webp.
- Generic/event paths typically use 10 MB max.
- Dedicated profile image path uses 5 MB max.
- Shared ImageUpload client also validates startsWith(image/) and maxSize prop locally.

Upload failure behavior:
- Generic upload returns 500 with error text when Cloudinary upload fails.
- Generic upload returns 500 if image_blobs metadata insert fails after successful upload.
- Event create upload loop skips invalid files and continues with remaining files.
- Event post-create upload path collects per-image errors and still returns successful response with partial results when at least one upload succeeds.

Duplicate naming behavior:
- Profile upload uses deterministic public ID profile_<userId> with overwrite=true.
- Event upload uses public ID pattern event_<eventId>_<index> with overwrite=true.
- Blog upload may use public ID blog_<filenameBase> when filename provided.
- Material upload may use material_<materialId> when materialId supplied.

Deletion effects:
- Event image delete recomputes primary image and image_url fallback.
- Profile image delete clears DB references even when Cloudinary deletion throws.
- /api/images DELETE removes metadata row only (user-owned row deletion behavior).

Retrieval behavior for mixed storage:
- /api/images/[id] returns binary bytes when data column exists.
- If no bytes and metadata.cloudinaryUrl exists, endpoint redirects to Cloudinary URL.
- If neither is available, returns 404 Image data not available.

Header and caching behavior:
- ETag generated from image ID and uploaded/created timestamp.
- Conditional request handling supports 304 on matching If-None-Match.

Cleanup behavior:
- Admin cleanup and utility cleanup only target rows with usage_count=0 older than configured threshold.
- GET cleanup status reports counts and aggregate size estimates in MB.

Context-based branch behavior in /api/upload:
- profile, blog/article, event, material, and default/general contexts map to different upload functions/folders/tags.

## 9. Notes for AI Understanding

Current architectural patterns:
- Hybrid media model:
  - Cloudinary as runtime host for newly uploaded images.
  - image_blobs as metadata and optional binary blob registry.
- Context-driven uploader routing:
  - One generic endpoint branches by context to specialized Cloudinary upload methods.
- Feature-specific image ownership logic:
  - Event image endpoint includes strict owner checks at event level.
  - Blob validation helpers verify content image ownership at blog content level.

Shared vs feature-specific logic:
- Shared logic:
  - cloudinaryService (validation/upload/delete/url builders).
  - generic /api/upload route for broad image intake.
  - image_blobs schema and helper utilities.
  - shared ImageUpload component and BlocknoteEditor upload hook.
- Feature-specific logic:
  - /api/profile/image handles profile replacement lifecycle and table-specific field writes.
  - /api/events/[id]/images manages image collections and primary image semantics.
  - /api/events POST multipart path handles initial event image population.
  - Blogs/media utilities handle blob ID extraction and ownership validation in structured content.

Data model patterns used in media references:
- Flat URL fields for single-image use cases (image_url, avatar).
- JSON object for profile image with URL/publicId in organization profile.
- JSON array of image objects for event galleries with per-image flags (isPrimary).
- Parallel URL + blob_id fields where legacy and blob reference support coexist (avatar + avatar_blob_id, featured_image + featured_image_blob_id).

Current endpoint behavior characteristics useful for downstream AI:
- Generic uploader inserts image_blobs record even for Cloudinary-hosted images with data=null.
- Image retrieval endpoint is storage-mode aware (binary stream vs Cloudinary redirect).
- Event media update/delete operations maintain primary-image consistency by rewriting isPrimary/image_url state.
- Profile image endpoint performs old-image deletion attempt before writing new reference.
