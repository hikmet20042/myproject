import sharp from 'sharp';
import { 
  processImage, 
  generateImageVariants, 
  extractImageMetadata,
  autoRotateImage,
  stripExifData,
  isAnimatedImage,
  generateResponsiveImages,
  getOptimalFormat
} from '@/lib/services/imageProcessingService';

/**
 * Test utilities for image processing functionality
 */

/**
 * Create a test image buffer
 */
export async function createTestImage(
  width: number = 800, 
  height: number = 600, 
  format: 'jpeg' | 'png' | 'webp' = 'jpeg'
): Promise<Buffer> {
  try {
    let sharpInstance = sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    });

    // Add some content to make it a real image
    const textSvg = `
      <svg width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50%" y="50%" text-anchor="middle" font-size="24" fill="black">
          Test Image ${width}x${height}
        </text>
        <circle cx="100" cy="100" r="50" fill="red"/>
        <rect x="${width-150}" y="${height-100}" width="100" height="50" fill="blue"/>
      </svg>
    `;

    if (format === 'jpeg') {
      return await sharpInstance
        .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
        .jpeg({ quality: 90 })
        .toBuffer();
    } else if (format === 'png') {
      return await sharpInstance
        .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
        .png()
        .toBuffer();
    } else if (format === 'webp') {
      return await sharpInstance
        .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
        .webp({ quality: 90 })
        .toBuffer();
    }

    return await sharpInstance.jpeg().toBuffer();
  } catch (error) {
    console.error('Error creating test image:', error);
    throw error;
  }
}

/**
 * Test image processing pipeline
 */
export async function testImageProcessing(): Promise<{
  success: boolean;
  results: any;
  errors: string[];
}> {
  const results: any = {};
  const errors: string[] = [];

  try {
    console.log('🧪 Testing image processing pipeline...');

    // 1. Create test images
    console.log('📸 Creating test images...');
    const jpegBuffer = await createTestImage(1200, 800, 'jpeg');
    const pngBuffer = await createTestImage(800, 600, 'png');
    const webpBuffer = await createTestImage(600, 400, 'webp');

    results.testImages = {
      jpeg: { size: jpegBuffer.length, created: true },
      png: { size: pngBuffer.length, created: true },
      webp: { size: webpBuffer.length, created: true }
    };

    // 2. Test metadata extraction
    console.log('📊 Testing metadata extraction...');
    const jpegMetadata = await extractImageMetadata(jpegBuffer);
    results.metadataExtraction = {
      jpeg: jpegMetadata,
      hasWidth: !!jpegMetadata.width,
      hasHeight: !!jpegMetadata.height,
      hasFormat: !!jpegMetadata.format
    };

    // 3. Test image processing
    console.log('⚙️ Testing image processing...');
    const processedJpeg = await processImage(jpegBuffer, 'image/jpeg', {
      optimizeForWeb: true,
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 85,
      format: 'webp'
    });

    results.imageProcessing = {
      originalSize: jpegBuffer.length,
      processedSize: processedJpeg.size,
      compressionRatio: ((jpegBuffer.length - processedJpeg.size) / jpegBuffer.length * 100).toFixed(1) + '%',
      outputFormat: processedJpeg.mimetype,
      wasOptimized: processedJpeg.metadata.wasOptimized,
      wasCompressed: processedJpeg.metadata.wasCompressed,
      processingSteps: processedJpeg.metadata.processingSteps
    };

    // 4. Test variant generation
    console.log('🖼️ Testing variant generation...');
    const variants = await generateImageVariants(jpegBuffer, 'image/jpeg', {
      generateThumbnail: true,
      generateMedium: true,
      optimizeForWeb: true
    });

    results.variantGeneration = {
      hasOriginal: !!variants.original,
      hasThumbnail: !!variants.thumbnail,
      hasMedium: !!variants.medium,
      originalSize: variants.original.size,
      thumbnailSize: variants.thumbnail?.size,
      mediumSize: variants.medium?.size,
      thumbnailDimensions: variants.thumbnail ? 
        `${variants.thumbnail.width}x${variants.thumbnail.height}` : null,
      mediumDimensions: variants.medium ? 
        `${variants.medium.width}x${variants.medium.height}` : null
    };

    // 5. Test auto-rotation
    console.log('🔄 Testing auto-rotation...');
    const { buffer: rotatedBuffer, wasRotated } = await autoRotateImage(jpegBuffer);
    results.autoRotation = {
      wasRotated,
      originalSize: jpegBuffer.length,
      rotatedSize: rotatedBuffer.length
    };

    // 6. Test EXIF stripping
    console.log('🔒 Testing EXIF stripping...');
    const strippedBuffer = await stripExifData(jpegBuffer, 'image/jpeg');
    results.exifStripping = {
      originalSize: jpegBuffer.length,
      strippedSize: strippedBuffer.length,
      sizeReduction: jpegBuffer.length - strippedBuffer.length
    };

    // 7. Test animation detection
    console.log('🎬 Testing animation detection...');
    const isJpegAnimated = await isAnimatedImage(jpegBuffer, 'image/jpeg');
    const isPngAnimated = await isAnimatedImage(pngBuffer, 'image/png');
    results.animationDetection = {
      jpeg: isJpegAnimated,
      png: isPngAnimated
    };

    // 8. Test responsive image generation
    console.log('📱 Testing responsive image generation...');
    const responsiveImages = await generateResponsiveImages(jpegBuffer, 'image/jpeg', [320, 640, 768]);
    results.responsiveGeneration = {
      count: responsiveImages.length,
      sizes: responsiveImages.map(img => ({
        width: img.width,
        size: img.size
      }))
    };

    // 9. Test format detection
    console.log('🌐 Testing format detection...');
    const chromeFormat = getOptimalFormat('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    const safariFormat = getOptimalFormat('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15');
    results.formatDetection = {
      chrome: chromeFormat,
      safari: safariFormat
    };

    console.log('✅ All image processing tests completed successfully!');
    return { success: true, results, errors };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);
    console.error('❌ Image processing test failed:', errorMessage);
    return { success: false, results, errors };
  }
}

/**
 * Test image processing performance
 */
export async function testImageProcessingPerformance(): Promise<{
  success: boolean;
  performance: any;
  errors: string[];
}> {
  const performance: any = {};
  const errors: string[] = [];

  try {
    console.log('⚡ Testing image processing performance...');

    // Create a large test image
    const largeImage = await createTestImage(2400, 1600, 'jpeg');
    console.log(`📏 Created large test image: ${largeImage.length} bytes`);

    // Test processing time
    const startTime = Date.now();
    const processed = await processImage(largeImage, 'image/jpeg', {
      optimizeForWeb: true,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp'
    });
    const processingTime = Date.now() - startTime;

    performance.processing = {
      timeMs: processingTime,
      originalSize: largeImage.length,
      processedSize: processed.size,
      compressionRatio: ((largeImage.length - processed.size) / largeImage.length * 100).toFixed(1) + '%',
      throughputMBps: (largeImage.length / 1024 / 1024 / (processingTime / 1000)).toFixed(2)
    };

    // Test variant generation time
    const variantStartTime = Date.now();
    const variants = await generateImageVariants(largeImage, 'image/jpeg');
    const variantTime = Date.now() - variantStartTime;

    performance.variantGeneration = {
      timeMs: variantTime,
      variantsCreated: Object.keys(variants).length,
      totalOutputSize: Object.values(variants).reduce((sum, variant) => sum + variant.size, 0)
    };

    console.log('✅ Performance tests completed!');
    return { success: true, performance, errors };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);
    console.error('❌ Performance test failed:', errorMessage);
    return { success: false, performance, errors };
  }
}

/**
 * Run all image processing tests
 */
export async function runAllImageTests(): Promise<void> {
  console.log('🚀 Starting comprehensive image processing tests...\n');

  const functionalityTest = await testImageProcessing();
  console.log('\n📊 Functionality Test Results:', JSON.stringify(functionalityTest.results, null, 2));

  const performanceTest = await testImageProcessingPerformance();
  console.log('\n⚡ Performance Test Results:', JSON.stringify(performanceTest.performance, null, 2));

  if (functionalityTest.success && performanceTest.success) {
    console.log('\n🎉 All tests passed! Image processing system is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the error messages above.');
    console.log('Functionality errors:', functionalityTest.errors);
    console.log('Performance errors:', performanceTest.errors);
  }
}
