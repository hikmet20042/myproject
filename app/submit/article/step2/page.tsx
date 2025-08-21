'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import BlocknoteEditor from '@/components/BlocknoteEditor'
import { ArrowLeft, Save, Send, Eye, EyeOff } from 'lucide-react'
import { BlockNoteEditor } from '@blocknote/core'



export default function Step2Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get draft ID from localStorage instead of URL parameters
  const [draftId, setDraftId] = useState<string | null>(null);
  
  const [content, setContent] = useState<any>(null); // BlockNote JSON
  const [characterCount, setCharacterCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<BlockNoteEditor | null>(null)

  // Cleanup function to clear localStorage when leaving the article submission flow
  const cleanupLocalStorage = () => {
    localStorage.removeItem('draftArticle')
    localStorage.removeItem('currentDraftId')
    localStorage.removeItem('currentEditId')
  }

  // Step 1 fields - initialize with empty values, will be populated from localStorage
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [tags, setTags] = useState('');
  const [references, setReferences] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cleanup localStorage when component unmounts (user navigates away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only cleanup if not navigating within the article flow
      const preserveData = sessionStorage.getItem('preserveArticleData')
      if (!preserveData) {
        cleanupLocalStorage()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save current state before potentially leaving
        const currentData = {
          title,
          abstract,
          tags,
          references,
          isAnonymous,
          content,
          characterCount,
          lastEdited: new Date().toISOString()
        }
        localStorage.setItem('draftArticle', JSON.stringify(currentData))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // Clear the preserve flag when component unmounts
      sessionStorage.removeItem('preserveArticleData')
    }
  }, [title, abstract, tags, references, isAnonymous, content, characterCount])

  // Author name from session
  const [authorName, setAuthorName] = useState(session?.user?.name ?? '');

  // Inline draft saved message (not full page)
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  // Validation state
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Manual save state
  const [lastSavedData, setLastSavedData] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  useEffect(() => {
    if (draftSaved) {
      setShowDraftSaved(true);
      const timer = setTimeout(() => setShowDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [draftSaved]);

  // Load saved draft from database or localStorage when component mounts
  useEffect(() => {
    if (status === 'loading') return;

    const loadDraft = async () => {
      // First, check if we have a draft ID or edit ID in localStorage
      const storedDraftId = localStorage.getItem('currentDraftId');
      const storedEditId = localStorage.getItem('currentEditId');

      // Prioritize edit ID if available (editing existing article)
      if (storedEditId) {
        setDraftId(storedEditId);
      } else if (storedDraftId) {
        setDraftId(storedDraftId);
      }

      // Always check localStorage first (prioritize recent edits from step1)
      const savedDraft = localStorage.getItem('draftArticle');
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          // Load all data from localStorage
          if (parsedDraft.title) setTitle(parsedDraft.title);
          if (parsedDraft.abstract) setAbstract(parsedDraft.abstract);
          if (parsedDraft.tags) {
            setTags(Array.isArray(parsedDraft.tags) ? parsedDraft.tags.join(',') : parsedDraft.tags);
          }
          if (parsedDraft.references) {
            setReferences(Array.isArray(parsedDraft.references) ? parsedDraft.references.join('\n') : parsedDraft.references);
          }
          if (parsedDraft.isAnonymous !== undefined) setIsAnonymous(parsedDraft.isAnonymous);
          if (parsedDraft.content) {
            setContent(parsedDraft.content);
            // If characterCount is not saved, calculate it from content
            if (parsedDraft.characterCount) {
              setCharacterCount(parsedDraft.characterCount);
            } else {
              // Calculate character count from content
              calculateCharacterCountFromContent(parsedDraft.content);
            }
          }
          // Update author name based on anonymity setting
          setAuthorName(parsedDraft.isAnonymous ? '' : (session?.user?.name ?? ''));

          // Set lastSavedData for change detection
          setLastSavedData(parsedDraft)


          // If required fields are missing, do NOT redirect. Inline guidance will be shown in the UI.
          // This prevents bounce-back to Step 1 and unintended localStorage cleanup.

          return; // Exit early if localStorage has data
        } catch (error) {
          console.error('Error parsing saved draft:', error);
        }
      }

      // Only load from database if localStorage is empty and we have an ID
      if ((storedDraftId || storedEditId) && session) {
        setLoading(true);
        try {
          const isEditingArticle = !!storedEditId;
          const idToLoad = storedEditId || storedDraftId;
          const endpoint = isEditingArticle ? '/api/articles' : '/api/drafts';
          const response = await fetch(`${endpoint}?id=${idToLoad}`);
          if (response.ok) {
            const data = await response.json();
            const draft = isEditingArticle ? data.article : data.draft;

            if (draft) {
              setTitle(draft.title || '');
              setAbstract(draft.abstract || '');
              setTags(Array.isArray(draft.tags) ? draft.tags.join(',') : (draft.tags || ''));
              setReferences(Array.isArray(draft.references) ? draft.references.join('\n') : (draft.references || ''));
              setIsAnonymous(draft.anonymous || false);
              setContent(draft.content || null);
              setAuthorName(draft.anonymous ? '' : (session?.user?.name ?? ''));

              // Calculate character count from loaded content
              if (draft.content) {
                calculateCharacterCountFromContent(draft.content);
              }

              // If required fields are missing, do NOT redirect. Inline guidance will be shown in the UI.

              // Save to localStorage for consistency (character count will be updated after calculation)
              const draftData = {
                title: draft.title || '',
                abstract: draft.abstract || '',
                tags: Array.isArray(draft.tags) ? draft.tags : (draft.tags ? String(draft.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []),
                references: Array.isArray(draft.references) ? draft.references : (draft.references || ''),
                isAnonymous: draft.anonymous || false,
                content: draft.content || null,
                characterCount: 0, // Will be updated after character count calculation
                lastEdited: new Date().toISOString()
              }
              localStorage.setItem('draftArticle', JSON.stringify(draftData));

              // Set lastSavedData for change detection
              setLastSavedData(draftData)

              // Save the ID to localStorage for future auto-saves
              const urlParams = new URLSearchParams(window.location.search)
              const urlDraftId = urlParams.get('draft')
              const urlEditId = urlParams.get('edit')

              if (urlEditId) {
                // If editing an existing article, save the edit ID
                localStorage.setItem('currentEditId', urlEditId)
              } else if (urlDraftId) {
                // If working with a draft, save the draft ID
                localStorage.setItem('currentDraftId', urlDraftId)
                setDraftId(urlDraftId)
              }
            }
          }
        } catch (error) {
          console.error('Error loading draft from database:', error);
        } finally {
          setLoading(false);
        }
      } else if (!savedDraft) {
        // If no data in localStorage and no draft ID, stay on Step 2 and show the UI.
        // User can choose to go back via the Back button; do not force redirect.
      }
    };

    loadDraft();
  }, [session, status, router]); // Removed isAnonymous from dependencies

  // Cleanup localStorage when user navigates away from article submission flow
  useEffect(() => {
    // Set a flag that we're currently in the article submission flow
    sessionStorage.setItem('inArticleSubmissionFlow', 'true')
    // Clear the preserve flag when we successfully reach step2
    sessionStorage.removeItem('preserveArticleData')

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Note: Auto-save has been removed. Users should manually save their drafts.
      // We could add logic here to warn about unsaved changes if needed.
    }

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)

      const isNavigatingWithinFlow = sessionStorage.getItem('navigatingWithinArticleFlow') === 'true';

      // Do NOT clear localStorage on unmount; preserve draft data.
      // Only manage session flags.
      if (!isNavigatingWithinFlow) {
        sessionStorage.removeItem('inArticleSubmissionFlow');
      } else {
        // Reset the flag if we are navigating within the flow
        sessionStorage.removeItem('navigatingWithinArticleFlow');
      }
    }
  }, [])





  // Helper function to calculate character count from content
  const calculateCharacterCountFromContent = async (content: any) => {
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
  };

  // Helper function to update character count in localStorage
  const updateCharacterCountInLocalStorage = (count: number) => {
    const savedDraft = localStorage.getItem('draftArticle');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        parsedDraft.characterCount = count;
        localStorage.setItem('draftArticle', JSON.stringify(parsedDraft));
      } catch (error) {
        console.error('Error updating character count in localStorage:', error);
      }
    }
  };

  const handleEditorChange = (json: any, html: string, text: string) => {
    setContent(json)
    setCharacterCount(text.length)
  }

  const saveToLocalStorage = () => {
    const savedDraft = localStorage.getItem('draftArticle')
    const base = savedDraft ? JSON.parse(savedDraft) : {}
    localStorage.setItem('draftArticle', JSON.stringify({
      ...base,
      title,
      abstract,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      references,
      isAnonymous,
      content,
      characterCount,
      lastEdited: new Date().toISOString()
    }))
  }





  const handleBackClick = () => {
    // Save to localStorage when user clicks back button
    saveToLocalStorage()

    // Mark that we're navigating within the article flow - set this BEFORE navigation
    sessionStorage.setItem('navigatingWithinArticleFlow', 'true')
    // Also set a more persistent flag
    sessionStorage.setItem('preserveArticleData', 'true')

    // Small delay to ensure sessionStorage is set before navigation
    setTimeout(() => {
      router.push('/submit/article/step1')
    }, 10)
  }

  // Note: Removed cleanup useEffect as it was causing localStorage to be cleared inappropriately
  // localStorage will be cleared only on successful submission or when user explicitly navigates away


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

  const handleSaveDraft = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setIsSavingDraft(true);
    setError('');

    saveToLocalStorage();

    try {
      const existingDraftId = draftId || localStorage.getItem('currentDraftId');
      const existingEditId = localStorage.getItem('currentEditId');
      const isEditingArticle = !!existingEditId;
      const isUpdate = !!(existingDraftId || existingEditId);
      const idToUse = existingEditId || existingDraftId;

      const currentData = {
        title: title.trim() || 'Untitled Article',
        abstract: abstract.trim(),
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        references: references.trim(),
        isAnonymous: isAnonymous,
        content: content,
        characterCount: characterCount,
        lastEdited: new Date().toISOString(),
        ...(isUpdate && { id: idToUse })
      };

      // Use the correct API endpoint based on whether we're editing an article or a draft
      const endpoint = isEditingArticle ? '/api/articles' : '/api/drafts';
      const response = await fetch(endpoint, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      });

      if (response.ok) {
        const result = await response.json();
        if (!isUpdate && result.id) {
          if (isEditingArticle) {
            localStorage.setItem('currentEditId', result.id);
          } else {
            setDraftId(result.id);
            localStorage.setItem('currentDraftId', result.id);
          }
        }
        setDraftSaved(true);
        setLastSavedData(currentData);
        setLastSaved(new Date());
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setError('An error occurred while saving');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();

    // Show validation errors from now on
    setShowValidationErrors(true);

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
    setIsSubmittingArticle(true);
    setError('');
    try {
      // Determine if we're editing an existing article or working with a draft
      const isEditingArticle = localStorage.getItem('currentEditId') !== null;
      const idToUse = isEditingArticle ? localStorage.getItem('currentEditId') : draftId;
      
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: idToUse, // Use the appropriate ID based on context
          title,
          content, // Backend expects content
          abstract,
          category: searchParams.get('category') || 'other',
          author: authorName,
          isAnonymous: isAnonymous,
          tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          references: (references && typeof references === 'string') ? references.split('\n').filter(ref => ref.trim()) : [],
          status: 'pending',
        }),
      });
      if (response.ok) {
        // Clear localStorage draft and all IDs after successful submission
        localStorage.removeItem('draftArticle');
        localStorage.removeItem('currentDraftId');
        localStorage.removeItem('currentEditId');
        
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
      setIsSubmittingArticle(false);
    }
  };

  if (status === 'loading' || loading) {
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
                onClick={handleBackClick}
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

            {/* Show helpful message if some required fields are missing */}
            {(!title.trim() || !abstract.trim() || tags.length === 0) && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Some article details are missing
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        You can still write your article content below. You can go back to{' '}
                        <button
                          onClick={handleBackClick}
                          className="font-medium underline hover:text-blue-600"
                        >
                          Step 1
                        </button>
                        {' '}anytime to complete the missing information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">
                  {title.trim() || <span className="text-gray-400 italic">No title provided</span>}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Author</label>
                <p className="mt-1 text-sm text-gray-900">
                  {isAnonymous ? 'Anonymous' : session?.user?.name}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Abstract</label>
                <p className="mt-1 text-sm text-gray-900">
                  {abstract.trim() || <span className="text-gray-400 italic">No abstract provided</span>}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {tags && Array.isArray(tags) && tags.length > 0 ? (
                    tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        {tag.label || tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No tags provided</span>
                  )}
                </div>
              </div>
              {references && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">References</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {references && typeof references === 'string' ? (
                      references.split('\n').map((ref, index) => (
                        <p key={index} className="mb-1">{ref.trim()}</p>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No references provided</p>
                    )}
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
                    <div dangerouslySetInnerHTML={{ __html: editorRef.current?.domElement?.innerHTML || '' }} />
                  </div>
                ) : (
                <BlocknoteEditor
                  key={title || 'empty'}
                  initialJSON={content}
                  onChange={(json, html, text) => {
                    handleEditorChange(json, html, text);
                    // Get the editor instance from the DOM for preview
                    const editorElement = document.querySelector('.bn-container');
                    if (editorElement) {
                      editorRef.current = {
                        domElement: editorElement as HTMLElement
                      } as BlockNoteEditor;
                    }
                  }}
                  context="article"
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

          {/* Manual save reminder */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm">
              <span className="inline-flex items-center text-amber-600">
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Remember to save your draft manually before leaving this page
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={
                isSavingDraft ||
                (
                  (typeof content === 'string' && (!content || !content.trim())) ||
                  (typeof content !== 'string' && (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}'))
                )
              }
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmittingArticle ||
                (showValidationErrors && (
                  (typeof content === 'string' && (!content || !content.trim())) ||
                  (typeof content !== 'string' && (!content || !JSON.stringify(content).trim() || JSON.stringify(content).trim() === '{}')) ||
                  characterCount < 500
                ))
              }
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmittingArticle ? 'Submitting...' : 'Submit Article'}
            </button>
          </div>

          {/* Guidelines */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Article Guidelines</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Share research, analysis, or academic insights about social justice and equality</li>
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


