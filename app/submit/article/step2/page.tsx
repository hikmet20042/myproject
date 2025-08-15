'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import BlocknoteEditor from '@/components/BlocknoteEditor'
import { ArrowLeft, Save, Send, Eye, EyeOff } from 'lucide-react'

interface Step2Props {
  searchParams: { [key: string]: string | string[] | undefined }
}


export default function Step2Page({ searchParams }: Step2Props) {

  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState<any>(null); // BlockNote JSON
  const [contentHtml, setContentHtml] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  // Step 1 fields
  const [title, setTitle] = useState(searchParams.title as string || '');
  const [abstract, setAbstract] = useState(searchParams.abstract as string || '');
  const [tags, setTags] = useState(searchParams.tags as string || '');
  const [references, setReferences] = useState(searchParams.references as string || '');
  const [isAnonymous, setIsAnonymous] = useState(searchParams.isAnonymous === 'true');

  // Author name from step 1 or session
  const [authorName, setAuthorName] = useState(isAnonymous ? '' : (searchParams.author as string || (session?.user?.name ?? '')));

  // Inline draft saved message (not full page)
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  useEffect(() => {
    if (draftSaved) {
      setShowDraftSaved(true);
      const timer = setTimeout(() => setShowDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [draftSaved]);

  // Debug log for content passed to BlocknoteEditor
  useEffect(() => {
    if (content) {
      console.log('[BlocknoteEditor] initialJSON:', content);
    }
  }, [content]);

  // Load draft from localStorage for non-logged-in users
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !session.user) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('draftArticle');
        if (saved) {
          try {
            const d = JSON.parse(saved);
            if (d.title) setTitle(d.title);
            if (d.abstract) setAbstract(d.abstract);
            if (d.tags) setTags(Array.isArray(d.tags) ? d.tags.join(',') : d.tags);
            if (d.references) setReferences(Array.isArray(d.references) ? d.references.join('\n') : d.references);
            if (typeof d.isAnonymous === 'boolean') setIsAnonymous(d.isAnonymous);
            if (typeof d.authorName === 'string') setAuthorName(d.authorName);
            if (d.content) {
              let loadedContent = d.content;
              // Blocknote expects an array of blocks, not an object
              if (loadedContent && loadedContent.blocks && Array.isArray(loadedContent.blocks)) {
                setContent(loadedContent.blocks);
              } else if (Array.isArray(loadedContent)) {
                setContent(loadedContent);
              } else {
                setContent([]);
              }
            }
            if (d.contentHtml) setContentHtml(d.contentHtml);
            if (d.contentText) setCharacterCount(d.contentText.length);
          } catch (e) {
            console.error('[Draft Load] Failed to parse draftArticle from localStorage:', e);
          }
        }
      }
    }
  }, [session, status]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!title || !abstract) {
      router.push('/submit/article/step1');
    }
  }, [status, title, abstract, router]);

  const handleEditorChange = (json: any, html: string, text: string) => {
    setContent(json)
    setContentHtml(html)
    setCharacterCount(text.length)
  }


  // Extract media from BlockNote JSON (images, embeds)
  const extractMedia = (json: any): Array<{ type: string; url: string; alt?: string }> => {
    if (!json || !json.blocks) return [];
    const media: Array<{ type: string; url: string; alt?: string }> = [];
    for (const block of json.blocks) {
      if (block.type === 'image' && block.props?.url) {
        media.push({ type: 'image', url: block.props.url, alt: block.props.alt || '' });
      }
      if (block.type === 'embed' && block.props?.url) {
        media.push({ type: 'embed', url: block.props.url });
      }
    }
    return media;
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: contentHtml, // Save HTML for draft, backend expects string
          contentHtml,
          category: searchParams.category || 'other',
          author: authorName,
          anonymous: isAnonymous,
          tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        }),
      });
      if (response.ok) {
        setDraftSaved(true);
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    let isContentEmpty = false;
    if (typeof content === 'string') {
      isContentEmpty = !content.trim();
    } else if (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}') {
      isContentEmpty = true;
    }
    if (isContentEmpty) {
      setError('Please add some content before submitting');
      return;
    }
    if (characterCount < 500) {
      setError('Your article must be at least 500 characters long');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: contentHtml, // Backend expects string content
          contentHtml,
          category: searchParams.category || 'other',
          author: authorName,
          anonymous: isAnonymous,
          tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        }),
      });
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit article');
      }
    } catch (error) {
      console.error('Error submitting article:', error);
      setError('An error occurred while submitting');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Article Submitted Successfully!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Your article has been submitted for review. You'll receive a notification once it's approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Draft Saved Inline Message */}
          {showDraftSaved && (
            <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="mx-auto flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="ml-3 text-sm text-blue-800 font-medium">Draft Saved! You can continue editing your article.</span>
              </div>
              <button onClick={() => setShowDraftSaved(false)} className="ml-4 text-blue-600 hover:underline text-xs">Dismiss</button>
            </div>
          )}
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Write Your Article</h1>
                <p className="mt-2 text-gray-600">
                  Share your research, analysis, or academic insights
                </p>
              </div>
              <button
                onClick={() => router.push('/submit/article/step1')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            </div>
          </div>

          {/* Article Details */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Article Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Author</label>
                <p className="mt-1 text-sm text-gray-900">
                  {isAnonymous ? 'Anonymous' : session?.user?.name}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Abstract</label>
                <p className="mt-1 text-sm text-gray-900">{abstract}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {tags && tags.trim() ? (
                    tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        {tag.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No tags</span>
                  )}
                </div>
              </div>
              {references && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">References</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {references.split('\n').map((ref, index) => (
                      <p key={index} className="mb-1">{ref.trim()}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Article Content</h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {characterCount} characters
                  </span>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {showPreview ? (
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                </div>
              ) : (
                <BlocknoteEditor
                  key={title || 'empty'}
                  initialJSON={content}
                  onChange={handleEditorChange}
                />
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={handleSaveDraft}
              disabled={
                isSubmitting ||
                (
                  (typeof content === 'string' && (!content || !content.trim())) ||
                  (typeof content !== 'string' && (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}'))
                )
              }
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (
                  (typeof content === 'string' && (!content || !content.trim())) ||
                  (typeof content !== 'string' && (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}'))
                ) ||
                characterCount < 500
              }
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Article'}
            </button>
          </div>

          {/* Guidelines */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Article Guidelines</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Share research, analysis, or academic insights about gender equality</li>
              <li>• Include proper citations and references</li>
              <li>• Minimum 500 characters required</li>
              <li>• Your article will be reviewed before publication</li>
              <li>• You can choose to remain anonymous</li>
              <li>• Maintain academic standards and objectivity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}


