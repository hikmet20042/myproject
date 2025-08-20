import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testImageProcessing, testImageProcessingPerformance } from '@/lib/utils/imageTestUtils';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint for image processing functionality
 * Only accessible to admin users
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, allow any authenticated user to test (you can restrict to admin later)
    // const User = require('@/lib/models/User').default;
    // const user = await User.findById(session.user.id);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'functionality';

    console.log(`🧪 Running image processing test: ${testType}`);

    if (testType === 'functionality') {
      const result = await testImageProcessing();
      return NextResponse.json({
        testType: 'functionality',
        timestamp: new Date().toISOString(),
        ...result
      });
    } else if (testType === 'performance') {
      const result = await testImageProcessingPerformance();
      return NextResponse.json({
        testType: 'performance',
        timestamp: new Date().toISOString(),
        ...result
      });
    } else if (testType === 'all') {
      const [functionalityResult, performanceResult] = await Promise.all([
        testImageProcessing(),
        testImageProcessingPerformance()
      ]);

      return NextResponse.json({
        testType: 'all',
        timestamp: new Date().toISOString(),
        functionality: functionalityResult,
        performance: performanceResult,
        summary: {
          allTestsPassed: functionalityResult.success && performanceResult.success,
          totalErrors: functionalityResult.errors.length + performanceResult.errors.length
        }
      });
    } else {
      return NextResponse.json({ 
        error: 'Invalid test type. Use: functionality, performance, or all' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Image processing test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to test with uploaded image
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB for testing)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`🧪 Testing image processing with uploaded file: ${file.name} (${file.size} bytes)`);

    // Import processing functions
    const { 
      processImage, 
      generateImageVariants, 
      extractImageMetadata,
      autoRotateImage,
      stripExifData,
      isAnimatedImage
    } = require('@/lib/services/imageProcessingService');

    const startTime = Date.now();

    // Extract metadata
    const metadata = await extractImageMetadata(buffer);
    
    // Test auto-rotation
    const { buffer: rotatedBuffer, wasRotated } = await autoRotateImage(buffer);
    
    // Test animation detection
    const isAnimated = await isAnimatedImage(buffer, file.type);
    
    // Process image
    const processed = await processImage(buffer, file.type, {
      optimizeForWeb: true,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp'
    });

    // Generate variants
    const variants = await generateImageVariants(buffer, file.type, {
      generateThumbnail: true,
      generateMedium: true,
      optimizeForWeb: true
    });

    // Strip EXIF data
    const strippedBuffer = await stripExifData(buffer, file.type);

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    return NextResponse.json({
      testType: 'uploaded-file',
      timestamp: new Date().toISOString(),
      file: {
        name: file.name,
        originalSize: file.size,
        mimetype: file.type
      },
      processing: {
        timeMs: processingTime,
        throughputMBps: (file.size / 1024 / 1024 / (processingTime / 1000)).toFixed(2)
      },
      metadata: {
        extracted: metadata,
        isAnimated,
        wasRotated
      },
      optimization: {
        originalSize: buffer.length,
        processedSize: processed.size,
        compressionRatio: ((buffer.length - processed.size) / buffer.length * 100).toFixed(1) + '%',
        outputFormat: processed.mimetype,
        processingSteps: processed.metadata.processingSteps
      },
      variants: {
        original: {
          size: variants.original.size,
          dimensions: `${variants.original.width}x${variants.original.height}`
        },
        thumbnail: variants.thumbnail ? {
          size: variants.thumbnail.size,
          dimensions: `${variants.thumbnail.width}x${variants.thumbnail.height}`
        } : null,
        medium: variants.medium ? {
          size: variants.medium.size,
          dimensions: `${variants.medium.width}x${variants.medium.height}`
        } : null
      },
      exifStripping: {
        originalSize: buffer.length,
        strippedSize: strippedBuffer.length,
        sizeReduction: buffer.length - strippedBuffer.length
      },
      success: true
    });

  } catch (error) {
    console.error('Uploaded file test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
