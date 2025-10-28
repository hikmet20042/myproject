'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import BlocknoteEditor from '@/components/BlocknoteEditor'
import { ArrowLeft, Send, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Step2Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

function Step2Page({ searchParams }: Step2Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const editId = urlSearchParams.get('edit');
  const [content, setContent] = useState<any>(null); // BlockNote JSON
  const [contentHtml, setContentHtml] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [title, setTitle] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [authorName, setAuthorName] = useState('');
  const [showAuthorNameInput, setShowAuthorNameInput] = useState(false);
  const [init, setInit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper function to update character count in localStorage
  const updateCharacterCountInLocalStorage = useCallback((count: number) => {
    const savedDraft = localStorage.getItem('draftBlog');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        parsedDraft.characterCount = count;
        localStorage.setItem('draftBlog', JSON.stringify(parsedDraft));
      } catch (error) {
        console.error('Error updating character count in localStorage:', error);
      }
    }
  }, []);

  // Helper function to calculate character count from content
  const calculateCharacterCountFromContent = useCallback(async (content: any) => {
    if (!content) {
      setCharacterCount(0);
      updateCharacterCountInLocalStorage(0);
      return;
    }

    try {
      // Create a temporary BlockNote editor to extract text from content
      const { BlockNoteEditor } = await import('@blocknote/core');
      const tempEditor = BlockNoteEditor.create();

      // Convert content to HTML then extract text
      const html = await tempEditor.blocksToFullHTML(content);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const text = tempDiv.textContent || tempDiv.innerText || '';
      const count = text.length;
      setCharacterCount(count);
      updateCharacterCountInLocalStorage(count);
    } catch (error) {
      console.error('Error calculating character count:', error);
      // Fallback: try to extract text from content structure
      let text = '';
      if (Array.isArray(content)) {
        content.forEach((block: any) => {
          if (block.content && Array.isArray(block.content)) {
            block.content.forEach((item: any) => {
              if (item.text) text += item.text;
            });
          }
        });
      }
      const count = text.length;
      setCharacterCount(count);
      updateCharacterCountInLocalStorage(count);
    }
  }, [updateCharacterCountInLocalStorage]);

  // Load functions - defined before useEffect hooks
  const loadBlogForEditing = useCallback(async (storyId: string) => {
    if (!session || status !== 'authenticated') return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/blogs?id=${storyId}`);
      if (response.ok) {
        const data = await response.json();
        const blog = data.blog;
        
        if (blog) {
          setTitle(blog.title || '');
          setTags(Array.isArray(blog.tags) ? blog.tags : []);
          setIsAnonymous(blog.authorName === 'Anonymous');
          setAuthorName(blog.authorName || session.user.name || '');
          
          // Set content
          if (blog.content) {
            const loadedContent = Array.isArray(blog.content) ? blog.content : (blog.content.blocks || []);
            setContent(loadedContent);
            calculateCharacterCountFromContent(loadedContent);
          }
          
          setContentHtml(blog.contentHtml || '');
          
          // Update localStorage
          const storyData = {
            title: blog.title || '',
            tags: Array.isArray(blog.tags) ? blog.tags.join(',') : '',
            isAnonymous: blog.authorName === 'Anonymous',
            authorName: blog.authorName || session.user.name || '',
            content: blog.content || null,
            contentHtml: blog.contentHtml || '',
            characterCount: 0,
            editId: storyId
          };
          localStorage.setItem('draftBlog', JSON.stringify(storyData));
        }
      }
    } catch (error) {
      console.error('Error loading blog for editing:', error);
    } finally {
      setLoading(false);
    }
  }, [session, status, calculateCharacterCountFromContent]);

  // Check if we're editing
  useEffect(() => {
    if (editId) {
      setIsEditing(true);
      loadBlogForEditing(editId);
    }
  }, [editId, loadBlogForEditing]);

  // On mount, get data from searchParams or localStorage

  useEffect(() => {
    // Skip if we're editing (data will be loaded by loadBlogForEditing)
    if (editId) {
      setInit(true);
      return;
    }
    
    let t = searchParams?.title || '';
    let tg: string[] = Array.isArray(searchParams?.tags) ? searchParams.tags : (typeof searchParams?.tags === 'string' ? searchParams.tags.split(',').filter(Boolean) : []);
    let anon = searchParams?.isAnonymous === 'true';
    let aName = '';
    let loadedContent = null;
    if ((!t || tg.length === 0 || typeof anon !== 'boolean') && typeof window !== 'undefined') {
      const saved = localStorage.getItem('draftBlog');
      if (saved) {
        try {
          const d = JSON.parse(saved);
          if (d.title) t = d.title;
          if (d.tags) tg = Array.isArray(d.tags) ? d.tags as string[] : (typeof d.tags === 'string' ? d.tags.split(',').filter(Boolean) : []);
          if (typeof d.isAnonymous === 'boolean') anon = d.isAnonymous;
          if (typeof d.authorName === 'string') aName = d.authorName;
          if (d.content) {
            loadedContent = Array.isArray(d.content) ? { blocks: d.content } : d.content;
          }
        } catch {}
      }
    }
    setTitle(typeof t === 'string' ? t : '');
    setTags(tg);
    setIsAnonymous(anon);
    setAuthorName(aName);
    if (loadedContent) {
      // Blocknote expects an array of blocks, not an object
      if (loadedContent && loadedContent.blocks && Array.isArray(loadedContent.blocks)) {
        setContent(loadedContent.blocks);
      } else if (Array.isArray(loadedContent)) {
        setContent(loadedContent);
      } else {
        setContent([]);
      }
      // Calculate character count from loaded content
      calculateCharacterCountFromContent(loadedContent.blocks || loadedContent);
    }
    setInit(true);
  }, [searchParams, editId, calculateCharacterCountFromContent]);
  // Show author name input if not anonymous and not logged in
  useEffect(() => {
    if (!isAnonymous) {
      if (status === 'loading') return;
      setShowAuthorNameInput(!session || !session.user);
    } else {
      setShowAuthorNameInput(false);
    }
  }, [isAnonymous, session, status]);

  useEffect(() => {
    if (!init || status === 'loading') return;
    if (!title) {
      router.push('/submit/blog/step1');
    }
  }, [init, title, router, status]);

  const handleEditorChange = (json: any, html: string, text: string) => {
    setContent(json)
    setContentHtml(html)
    const count = text.length
    setCharacterCount(count)
    updateCharacterCountInLocalStorage(count)
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

  const handleSubmit = async () => {
    // Robust content validation
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
    if (characterCount < 100) {
      setError('Your blog must be at least 100 characters long');
      return;
    }
    if (!isAnonymous && showAuthorNameInput && (!authorName || !authorName.trim())) {
      setError('Please enter your name or choose to submit anonymously');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'blog',
          title,
          content, // BlockNote JSON
          contentHtml,
          tags: Array.isArray(tags) ? tags : [],
          isAnonymous,
          authorName: !isAnonymous && showAuthorNameInput ? authorName : undefined,
          media: extractMedia(content)
        }),
      });
      if (response.ok) {
        // Clear localStorage after successful submission
        localStorage.removeItem('draftBlog');
        localStorage.removeItem('currentBlogEditId');
        
        setSuccess(true);
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit blog');
      }
    } catch (error) {
      console.error('Error submitting blog:', error);
      setError('An error occurred while submitting');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!init || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
          <h3 className="mt-4 text-lg font-medium text-gray-900">Blog Submitted Successfully!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Your blog has been submitted for review. You'll receive a notification once it's approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Write Your Blog</h1>
                <p className="mt-2 text-gray-600">
                  Share your personal experience or community blog
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  // Save current state to localStorage before going back
                  if (typeof window !== 'undefined') {
                    const saved = localStorage.getItem('draftBlog')
                    const base = saved ? JSON.parse(saved) : {}
                    const updatedDraft = {
                      ...base,
                      title,
                      tags,
                      isAnonymous,
                      authorName,
                      content,
                      contentHtml,
                      characterCount,
                      ...(editId && { editId })
                    }
                    localStorage.setItem('draftBlog', JSON.stringify(updatedDraft))
                  }
                  const backUrl = editId ? `/submit/blog/step1?edit=${editId}` : '/submit/blog/step1'
                  router.push(backUrl)
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            
            
          </div>

          {/* Blog Details */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Blog Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Author</label>
                {isAnonymous ? (
                  <p className="mt-1 text-sm text-gray-900">Anonymous</p>
                ) : showAuthorNameInput ? (
                  <Input
                    type="text"
                    className="mt-1 block w-full focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Your name"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{authorName || session?.user?.name || 'Community Member'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Blog Content</h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {characterCount} characters
                  </span>
                  <Button
                    onClick={() => setShowPreview(!showPreview)}
                    variant="secondary"
                    size="sm"
                  >
                    {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
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
                  context="blog"
                />
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (
                  (typeof content === 'string' && (!content || !content.trim())) ||
                  (typeof content !== 'string' && (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}'))
                ) ||
                characterCount < 100
              }
              variant="primary"
              loading={isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Blog'}
            </Button>
          </div>

          {/* Guidelines */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Blog Guidelines</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Share personal experiences, challenges, or victories related to social justice and equality</li>
              <li>• Be respectful and constructive in your narrative</li>
              <li>• Minimum 100 characters required</li>
              <li>• Your blog will be reviewed before publication</li>
              <li>• You can choose to remain anonymous</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Step2PageWrapper({ searchParams }: Step2Props) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="text-lg">Loading...</div></div>}>
      <Step2Page searchParams={searchParams} />
    </Suspense>
  )
}


