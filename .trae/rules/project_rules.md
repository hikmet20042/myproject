# Project Development Rules

## Critical Data Model Rules

### Article Model Field Usage
- **User Reference**: `userId` (mongoose.Types.ObjectId)
- **Display Name**: `author` (String)
- **Anonymity Flag**: `anonymous` (Boolean)
- **Content**: Can be String or Object (from BlocknoteEditor)

### Story Model Field Usage
- **User Reference**: `author` (mongoose.Types.ObjectId)
- **Display Name**: `authorName` (String)
- **Anonymity Flag**: `isAnonymous` (Boolean)
- **Content**: Object (from BlocknoteEditor)

## Mandatory Type Conversion Rules

### ObjectId Comparisons
**ALWAYS** convert ObjectId to string before comparing with session.user.id:
```javascript
const userId = objectId?.toString() || objectId
if (userId !== session?.user?.id) {
  // Handle permission denial
}
```

### Permission Check Patterns

#### Article Permission Check
```javascript
const articleUserId = article.userId?.toString() || article.userId
if (articleUserId !== session?.user?.id && article.author !== session?.user?.name) {
  setError('You do not have permission to edit this article')
  return
}
```

#### Story Permission Check
```javascript
const storyAuthorId = story.author?.toString() || story.author
if (storyAuthorId !== session?.user?.id && story.authorName !== session?.user?.name) {
  setError('You do not have permission to edit this story')
  return
}
```

## API Route Field Mapping Rules

### Articles API Routes
- **Find/Update by**: `userId` field
- **Display with**: `author` field
- **Anonymity check**: `anonymous` field
- **HTTP Method**: `PUT` for updates

### Stories API Routes
- **Find/Update by**: `author` field (ObjectId)
- **Display with**: `authorName` field
- **Anonymity check**: `isAnonymous` field
- **HTTP Method**: `PATCH` for user updates, `PUT` for admin updates

## Content Validation Rules

### BlocknoteEditor Content Handling
```javascript
// Content can be string or object - handle both
let contentLength = 0;
if (typeof content === 'string') {
  contentLength = content.trim().length;
} else if (content && typeof content === 'object') {
  const contentStr = JSON.stringify(content);
  contentLength = contentStr.length;
}

if (!content || contentLength < 10) {
  return NextResponse.json({ error: 'Content is required.' }, { status: 400 });
}
```

## Form Field Population Rules

### Article Edit Form
```javascript
setTitle(article.title || '')
setAbstract(article.abstract || '')
setContent(article.content || '')
setAuthorName(article.author || '')  // Use 'author' field
setIsAnonymous(article.anonymous || false)  // Use 'anonymous' field
```

### Story Edit Form
```javascript
setTitle(story.title || '')
setAbstract(story.abstract || '')
setContent(story.content || '')
setAuthorName(story.authorName || '')  // Use 'authorName' field
setIsAnonymous(story.isAnonymous || false)  // Use 'isAnonymous' field
```

## Debugging Requirements

### Always Log Data Structure When Debugging
```javascript
  ('Request body:', JSON.stringify(body, null, 2));
console.log('Field type:', typeof field, 'Value:', field);
```

### Validation Error Logging
```javascript
if (validation_fails) {
  console.log('Validation failed:', { field, expectedType, actualType, value });
  return NextResponse.json({ error: 'Specific error message' }, { status: 400 });
}
```

## Common Mistakes to NEVER Repeat

1. **ObjectId vs String**: Never compare ObjectId directly with string - always convert
2. **Field Name Confusion**: 
   - Articles: `userId`, `author`, `anonymous`
   - Stories: `author`, `authorName`, `isAnonymous`
3. **Content Type Assumptions**: Always handle both string and object content
4. **Permission Check Fields**: Use correct field names for each model
5. **API Method Consistency**: Use correct HTTP methods for each entity

## Required Checks Before Any Database Operation

1. **Type Conversion**: Convert ObjectIds to strings for comparisons
2. **Field Validation**: Verify field names match the model schema
3. **Content Type**: Handle multiple content types from BlocknoteEditor
4. **Permission Verification**: Use correct field combinations for each model
5. **Error Logging**: Add debugging logs for validation failures

## BlocknoteEditor Specific Rules

### Component Props
- Use `initialJSON` prop, not `content`
- Handle both string and object content types
- Always validate content exists before processing

### Content Processing
```javascript
// For BlocknoteEditor content
if (typeof content === 'object') {
  // Handle JSON object from editor
} else if (typeof content === 'string') {
  // Handle string content
}
```

These rules MUST be followed to prevent recurring type mismatches and field mapping errors.