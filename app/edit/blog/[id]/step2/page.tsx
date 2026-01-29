'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import BlocknoteEditor from '@/components/BlocknoteEditor'
import { ArrowLeft, Send, Eye, EyeOff } from 'lucide-react'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingState, SuccessState } from '@/components/shared'
import { Button } from '@/components/ui'


export default function EditBlogStep2() {
  const { t } = useLanguage()

  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const blogId = params?.id as string;
  const [content, setContent] = useState<any>(null); // BlockNote JSON
  const [contentHtml, setContentHtml] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const localePath = useLocalizedPath()
  const [success, setSuccess] = useState(false);
  // Removed draft saving functionality - editing pending stories updates directly
  const [title, setTitle] = useState<string>('');

  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [authorName, setAuthorName] = useState('');
  const [showAuthorNameInput, setShowAuthorNameInput] = useState(false);
  const [init, setInit] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cleanup function to clear localStorage when leaving the blog editing flow
  const cleanupLocalStorage = () => {
    localStorage.removeItem('editBlogData')
    localStorage.removeItem('currentBlogEditId')
  }

  // Load blog data from localStorage only
  useEffect(() => {
    if (blogId && typeof window !== 'undefined') {
      const saved = localStorage.getItem('editBlogData');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.editId === blogId) {
            // Load from localStorage
            setTitle(data.title || '');

            setIsAnonymous(data.isAnonymous || false);
            setAuthorName(data.authorName || '');
            if (data.content) {
              setContent(data.content);
              calculateCharacterCountFromContent(data.content);
            }
            if (data.contentHtml) setContentHtml(data.contentHtml);
            
            // Clear the navigation flag after a small delay to ensure step1 cleanup runs first
            setTimeout(() => {
              sessionStorage.removeItem('navigatingWithinBlogFlow');
            }, 100);
          } else {
            setError(t('errors.blogDataNotFound'));
          }
        } catch (error) {
          console.error('Error parsing localStorage data:', error);
          setError(t('errors.failedToLoadBlogData'));
        }
      } else {
        setError(t('errors.blogDataNotFound'));
      }
    }
    setInit(true);
  }, [blogId]);

  // Save form field changes to localStorage (only after initial load)
  useEffect(() => {
    if (typeof window !== 'undefined' && blogId && init) {
      const saved = localStorage.getItem('editBlogData');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.editId === blogId) {
            const updatedData = {
              ...data,
              title,
              isAnonymous,
              authorName
            };
            localStorage.setItem('editBlogData', JSON.stringify(updatedData));
          }
        } catch (error) {
          console.error('Error updating localStorage:', error);
        }
      }
    }
  }, [title, isAnonymous, authorName, blogId, init]);

  // Cleanup localStorage when component unmounts (user navigates away)
  useEffect(() => {
    // Set a flag that we're currently in the blog editing flow
    sessionStorage.setItem('inBlogEditFlow', 'true')
    
    // Cleanup on component unmount
    return () => {
      const isNavigatingWithinFlow = sessionStorage.getItem('navigatingWithinBlogFlow') === 'true'
      
      if (!isNavigatingWithinFlow) {
        // Not navigating within the flow - cleanup localStorage
        cleanupLocalStorage()
        sessionStorage.removeItem('inBlogEditFlow')
      }
      // Flag is already removed after successful data loading
    }
  }, []);

  // Helper function to calculate character count from content
  const calculateCharacterCountFromContent = async (content: any) => {
    if (!content) {
      setCharacterCount(0);
      
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
    }
  };

  // Character count tracking without localStorage dependency
  // Note: localStorage loading is now handled in the main useEffect above

  // Show author name input if not anonymous and not logged in
  useEffect(() => {
    setShowAuthorNameInput(!isAnonymous && !session?.user?.name);
  }, [isAnonymous, session]);

  const handleEditorChange = (newContent: any, htmlContent: string) => {
    setContent(newContent);
    setContentHtml(htmlContent);
    calculateCharacterCountFromContent(newContent);
    
    // Save to localStorage for navigation between steps
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editBlogData');
      const base = saved ? JSON.parse(saved) : {};
      const updatedData = {
        ...base,
        content: newContent,
        contentHtml: htmlContent,
        editId: blogId
      };
      localStorage.setItem('editBlogData', JSON.stringify(updatedData));
    }
  };

  const extractMedia = (content: any) => {
    const media: string[] = [];
    if (Array.isArray(content)) {
      content.forEach((block: any) => {
        if (block.type === 'image' && block.props?.url) {
          media.push(block.props.url);
        }
      });
    }
    return media;
  };

  // Removed handleSaveDraft - editing pending stories updates directly without draft mechanism

  const handleSubmit = async () => {
    // Get latest data from localStorage
    let finalData = { title, isAnonymous, authorName, content, contentHtml };
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('editBlogData');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.editId === blogId) {
            finalData = {
              title: data.title || title,
              isAnonymous: data.isAnonymous !== undefined ? data.isAnonymous : isAnonymous,
              authorName: data.authorName || authorName,
              content: data.content || content,
              contentHtml: data.contentHtml || contentHtml
            };
          }
        } catch {}
      }
    }

    // Robust content validation
    let isContentEmpty = false;
    if (typeof finalData.content === 'string') {
      isContentEmpty = !finalData.content.trim();
    } else if (!finalData.content || !JSON.stringify(finalData.content).trim() || JSON.stringify(finalData.content).trim() === '{}') {
      isContentEmpty = true;
    }
    if (isContentEmpty) {
      setError(t('errors.pleaseAddContent'));
      return;
    }
    if (characterCount < 100) {
      setError(t('errors.blogMinLength'));
      return;
    }
    if (!finalData.isAnonymous && showAuthorNameInput && (!finalData.authorName || !finalData.authorName.trim())) {
      setError(t('errors.pleaseEnterNameOrAnonymous'));
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/blogs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: blogId,
          title: finalData.title,
          content: finalData.content, // BlockNote JSON
          contentHtml: finalData.contentHtml,
          isAnonymous: finalData.isAnonymous,
          authorName: finalData.isAnonymous ? 'Anonymous' : (finalData.authorName || session?.user?.name),
          status: 'pending',
          media: extractMedia(finalData.content)
        }),
      });
      if (response.ok) {
        // Clear localStorage after successful submission
        cleanupLocalStorage();
        sessionStorage.removeItem('inBlogEditFlow');
        setSuccess(true);
        setTimeout(() => {
          router.push(localePath("/profile"));
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || t('errors.failedToUpdateBlog'));
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      setError(t('errors.errorUpdating'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!init || status === 'loading') {
    return (
      <LoadingState 
        text={t('blog.loadingEditor') || 'Loading editor...'}
        gradientFrom="from-blue-50"
        gradientVia="via-indigo-50"
        gradientTo="to-purple-50"
        spinnerColor="border-blue-600"
      />
    );
  }

  if (success) {
    return (
      <SuccessState 
        title={t('blog.updated') || 'Blog Updated Successfully!'}
        message={t('blog.updatedMessage') || "Your blog has been updated and submitted for review. You'll receive a notification once it's approved."}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Removed draft saved message - not needed for direct blog editing */}
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Your Blog</h1>
                <p className="mt-2 text-gray-600">
                  Update your personal experience or community blog
                </p>
              </div>
              <Button
                variant="outline"
                icon={ArrowLeft}
                iconPosition="left"
                size="sm"
                onClick={() => {
                  // Save current state to localStorage before going back
                  if (typeof window !== 'undefined') {
                    const saved = localStorage.getItem('editBlogData');
                    const base = saved ? JSON.parse(saved) : {};
                    const updatedData = {
                      ...base,
                      title,
                      isAnonymous,
                      authorName,
                      content,
                      contentHtml,
                      editId: blogId
                    };
                    localStorage.setItem('editBlogData', JSON.stringify(updatedData));
                  }
                  // Set flag to preserve data during navigation within the flow
                  sessionStorage.setItem('navigatingWithinBlogFlow', 'true');
                  router.push(`/edit/blog/${blogId}/step1`);
                }}
              >
                Back
              </Button>
            </div>
            
            {/* Removed manual save warning - not needed for direct blog editing */}
          </div>

          {/* Blog Details */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Blog Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('labels.title')}</label>
                <p className="mt-1 text-sm text-gray-900">{title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t('author')}</label>
                {isAnonymous ? (
                  <p className="mt-1 text-sm text-gray-900">{t('titles.anonymous')}</p>
                ) : showAuthorNameInput ? (
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                    variant="outline"
                    size="sm"
                    icon={showPreview ? EyeOff : Eye}
                    iconPosition="left"
                    onClick={() => setShowPreview(!showPreview)}
                  >
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
          <div className="mt-8 flex justify-end">
            <Button
              variant="gradient-blue"
              icon={Send}
              iconPosition="left"
              loading={isSubmitting}
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (
                  (typeof content === 'string' && (!content || !content.trim())) ||
                  (typeof content !== 'string' && (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}'))
                ) ||
                characterCount < 100
              }
            >
              {isSubmitting ? 'Updating...' : 'Update Blog'}
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