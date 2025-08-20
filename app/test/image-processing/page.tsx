'use client'

import { useState } from 'react'
import { Upload, Play, CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react'

export default function ImageProcessingTestPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  const runTests = async (testType: 'functionality' | 'performance' | 'all') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/test/image-processing?type=${testType}`)
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Test failed:', error)
      setTestResults({ error: 'Test failed', details: error })
    } finally {
      setLoading(false)
    }
  }

  const testUploadedFile = async (file: File) => {
    setUploadLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/test/image-processing', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      setUploadResults(data)
    } catch (error) {
      console.error('Upload test failed:', error)
      setUploadResults({ error: 'Upload test failed', details: error })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      testUploadedFile(file)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ImageIcon className="mr-3 h-8 w-8 text-blue-600" />
              Image Processing Test Suite
            </h1>
            <p className="mt-2 text-gray-600">
              Test the Sharp-powered image processing functionality including compression, optimization, and variant generation.
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Automated Tests */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Automated Tests</h2>
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => runTests('functionality')}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {loading ? 'Running...' : 'Test Functionality'}
                </button>
                
                <button
                  onClick={() => runTests('performance')}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {loading ? 'Running...' : 'Test Performance'}
                </button>
                
                <button
                  onClick={() => runTests('all')}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {loading ? 'Running...' : 'Run All Tests'}
                </button>
              </div>

              {testResults && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {testResults.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className="font-medium">
                      Test Results ({testResults.testType})
                    </span>
                  </div>
                  <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-96">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* File Upload Test */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Test</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload an image to test processing
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleFileUpload}
                        disabled={uploadLoading}
                      />
                      <span className="mt-1 block text-sm text-gray-500">
                        PNG, JPG, GIF, WebP up to 10MB
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {uploadLoading && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Processing uploaded image...
                  </div>
                </div>
              )}

              {uploadResults && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {uploadResults.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className="font-medium">Upload Test Results</span>
                  </div>

                  {uploadResults.success && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-gray-900">File Info</h4>
                        <p className="text-sm text-gray-600">
                          {uploadResults.file.name}<br/>
                          {formatBytes(uploadResults.file.originalSize)}<br/>
                          {uploadResults.file.mimetype}
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-gray-900">Processing</h4>
                        <p className="text-sm text-gray-600">
                          Time: {uploadResults.processing.timeMs}ms<br/>
                          Throughput: {uploadResults.processing.throughputMBps} MB/s<br/>
                          Steps: {uploadResults.optimization.processingSteps.join(', ')}
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-gray-900">Optimization</h4>
                        <p className="text-sm text-gray-600">
                          Original: {formatBytes(uploadResults.optimization.originalSize)}<br/>
                          Processed: {formatBytes(uploadResults.optimization.processedSize)}<br/>
                          Compression: {uploadResults.optimization.compressionRatio}
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-gray-900">Variants</h4>
                        <p className="text-sm text-gray-600">
                          Original: {uploadResults.variants.original.dimensions}<br/>
                          {uploadResults.variants.thumbnail && `Thumbnail: ${uploadResults.variants.thumbnail.dimensions}`}<br/>
                          {uploadResults.variants.medium && `Medium: ${uploadResults.variants.medium.dimensions}`}
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-gray-900">Metadata</h4>
                        <p className="text-sm text-gray-600">
                          Animated: {uploadResults.metadata.isAnimated ? 'Yes' : 'No'}<br/>
                          Rotated: {uploadResults.metadata.wasRotated ? 'Yes' : 'No'}<br/>
                          Format: {uploadResults.metadata.extracted.format}
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-medium text-gray-900">EXIF Stripping</h4>
                        <p className="text-sm text-gray-600">
                          Original: {formatBytes(uploadResults.exifStripping.originalSize)}<br/>
                          Stripped: {formatBytes(uploadResults.exifStripping.strippedSize)}<br/>
                          Reduction: {formatBytes(uploadResults.exifStripping.sizeReduction)}
                        </p>
                      </div>
                    </div>
                  )}

                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium text-gray-900">
                      View Full Results
                    </summary>
                    <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-96 mt-2">
                      {JSON.stringify(uploadResults, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>

            {/* Feature Overview */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Implemented Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900">✅ Image Compression</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Automatic compression with quality optimization using Sharp
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900">✅ Format Conversion</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Convert to WebP for better compression and browser support
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900">✅ Dimension Detection</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Extract width, height, and other metadata using Sharp
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900">✅ Auto-Rotation</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Automatically rotate images based on EXIF orientation
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900">✅ Variant Generation</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Generate thumbnails, medium sizes, and responsive variants
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900">✅ EXIF Processing</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Extract metadata and strip EXIF data for privacy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
