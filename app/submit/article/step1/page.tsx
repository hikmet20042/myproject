'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import Select from 'react-select'
import { ARTICLE_TAGS } from '@/lib/tagOptions'
import { useSession } from 'next-auth/react'
import { Save } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/Textarea'

interface DraftData {
  title: string
  abstract: string
  tags: string[]
  references: string
  isAnonymous: boolean
  content: any
  characterCount: number
  lastEdited: string
}

interface SelectOption {
  value: string
  label: string
}



export default function ArticleStep1() {
  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  // URL parameters
  const draftId = searchParams.get('draft')
  const editId = searchParams.get('edit')
  
  // State
  const [title, setTitle] = useState<string>('')
  const [abstract, setAbstract] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [references, setReferences] = useState<string>('')
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(Boolean(draftId || editId))
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false)
  const [showValidationErrors, setShowValidationErrors] = useState<boolean>(false)
  const [lastSavedData, setLastSavedData] = useState<DraftData | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)

  // Initialize localStorage for new articles
  const initializeNewArticle = useCallback((): void => {
    const initialData: DraftData = {
      title: '',
      abstract: '',
      tags: [],
      references: '',
      isAnonymous: false,
      content: null,
      characterCount: 0,
      lastEdited: new Date().toISOString()
    };
    localStorage.setItem('draftArticle', JSON.stringify(initialData));
    setLastSavedData(initialData);
  }, [setLastSavedData]);

  // Refs are now declared with the state variables







  // Cleanup function to clear localStorage when leaving the article submission flow
  const cleanupLocalStorage = useCallback((): void => {
    localStorage.removeItem('draftArticle');
    localStorage.removeItem('currentDraftId');
    localStorage.removeItem('currentEditId');
  }, []);

  // Single source of truth for saving to localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('draftArticle');
      const base = saved ? JSON.parse(saved) : {};
      
      const dataToSave: DraftData = {
        ...base,
        title: (title || '').trim(),
        abstract: (abstract || '').trim(),
        tags: [...(tags || [])],
        references: (references || '').trim(),
        isAnonymous: isAnonymous || false,
        content: base.content || null,
        characterCount: base.characterCount || 0,
        lastEdited: new Date().toISOString()
      };
      
      localStorage.setItem('draftArticle', JSON.stringify(dataToSave));
      
      // Save the appropriate ID to localStorage
      if (editId) {
        localStorage.setItem('currentEditId', editId);
      } else if (draftId) {
        localStorage.setItem('currentDraftId', draftId);
      }
      
      setLastSavedData(dataToSave);
      setLastSaved(new Date());
      
      return dataToSave;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return null;
    }
  }, [title, abstract, tags, references, isAnonymous, editId, draftId]);

  const loadDraft = useCallback(async (): Promise<void> => {
    const idToLoad = draftId || editId;

    // If we have an ID to load, we should show loading
    if (idToLoad) {
      setLoading(true);
    }

    // Always check localStorage first (prioritize recent edits)
    const savedDraft = localStorage.getItem('draftArticle');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft.title) setTitle(parsedDraft.title);
        if (parsedDraft.abstract) setAbstract(parsedDraft.abstract);
        if (parsedDraft.tags) setTags(parsedDraft.tags);
        setReferences(parsedDraft.references || '');
        if (parsedDraft.isAnonymous !== undefined) setIsAnonymous(parsedDraft.isAnonymous);

        // Make sure IDs are saved to localStorage if they exist in URL
        if (editId) {
          localStorage.setItem('currentEditId', editId);
        } else if (draftId) {
          localStorage.setItem('currentDraftId', draftId);
        }

        // Set lastSavedData for change detection
        setLastSavedData(parsedDraft);

        // If we loaded from localStorage and have an ID, we're done loading
        if (idToLoad) {
          setLoading(false);
        }
        return; // Exit early if localStorage has data
      } catch (error) {
        console.error('Error parsing saved draft:', error);
      }
    }

    // Only load from database if localStorage is empty and we have an ID in URL
    if (idToLoad && session) {
      try {
        // Use the correct API endpoint based on whether we're editing an article or a draft
        const isEditingArticle = !!editId;
        const endpoint = isEditingArticle ? '/api/articles' : '/api/drafts';
        const response = await fetch(`${endpoint}?id=${idToLoad}`);
        if (response.ok) {
          const data = await response.json();
          const draft = isEditingArticle ? data.article : data.draft;

          if (draft) {
            setTitle(draft.title || '');
            setAbstract(draft.abstract || '');
            setTags(draft.tags || []);
            setReferences(Array.isArray(draft.references) ? draft.references.join('\n') : draft.references || '');
            setIsAnonymous(draft.anonymous || false);

            // Save to localStorage for consistency
            const draftData = {
              title: draft.title || '',
              abstract: draft.abstract || '',
              tags: draft.tags || [],
              references: Array.isArray(draft.references) ? draft.references.join('\n') : draft.references || '',
              isAnonymous: draft.anonymous || false,
              content: draft.content || '',
              characterCount: 0,
              lastEdited: new Date().toISOString()
            };
            localStorage.setItem('draftArticle', JSON.stringify(draftData));

            // Set lastSavedData for change detection
            setLastSavedData(draftData);

            // Save the ID to localStorage - use the appropriate ID based on context
            if (editId) {
              // If editing an existing article, save the edit ID
              localStorage.setItem('currentEditId', editId);
            } else {
              // If working with a draft, save the draft ID
              localStorage.setItem('currentDraftId', draftId || '');

              // Update draft activity when viewed (only for drafts, not published articles)
              if (draftId && draft.status === 'draft') {
                try {
                  await fetch('/api/drafts/manage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'update_activity',
                      draftId: draftId
                    })
                  });
                } catch (error) {
                  console.error('Error updating draft activity:', error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading draft from database:', error);
      } finally {
        setLoading(false);
      }
    } else if (!idToLoad) {
      // If there's no ID to load, make sure loading is false
      setLoading(false);
    }
  }, [draftId, editId, session, setTitle, setAbstract, setTags, setReferences, setIsAnonymous, setLastSavedData, setLoading]);

  // This effect is no longer needed as we've moved its logic into loadDraftData
  // and are now properly handling the dependencies

  // Load draft data when component mounts or URL params change
  const loadDraftData = useCallback(async (): Promise<void> => {
    try {
      const idToLoad = editId || draftId || localStorage.getItem('currentEditId') || localStorage.getItem('currentDraftId');

      if (!idToLoad && !draftId && !editId) {
        // Check if we're coming from within the article flow (e.g., from step2)
        const isComingFromFlow = sessionStorage.getItem('navigatingWithinArticleFlow') === 'true' || 
                                sessionStorage.getItem('preserveArticleData') === 'true' ||
                                sessionStorage.getItem('inArticleSubmissionFlow') === 'true';
        
        // Only initialize new article if we're not coming from within the flow AND there's no existing data
        const existingData = localStorage.getItem('draftArticle');
        if (!isComingFromFlow && !existingData) {
          await initializeNewArticle();
        }
        return;
      }

      const savedDraft = localStorage.getItem('draftArticle');
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft);
          setTitle(parsedDraft.title || '');
          setAbstract(parsedDraft.abstract || '');
          setTags(parsedDraft.tags || []);
          setReferences(Array.isArray(parsedDraft.references) ? parsedDraft.references.join('\n') : parsedDraft.references || '');
          setIsAnonymous(parsedDraft.isAnonymous !== undefined ? parsedDraft.isAnonymous : false);
          if (parsedDraft.lastEdited) setLastSaved(new Date(parsedDraft.lastEdited));

          if (editId) localStorage.setItem('currentEditId', editId);
          else if (draftId) localStorage.setItem('currentDraftId', draftId);

          setLastSavedData(parsedDraft);
          return;
        } catch (error) {
          console.error('Error parsing saved draft:', error);
        }
      }

      if (idToLoad && status === 'authenticated') {
        try {
          // Use the correct API endpoint based on whether we're editing an article or a draft
          const isEditingArticle = !!editId;
          const endpoint = isEditingArticle ? '/api/articles' : '/api/drafts';
          const response = await fetch(`${endpoint}?id=${idToLoad}`);
          if (response.ok) {
            const data = await response.json();
            const draft = isEditingArticle ? data.article : data.draft;
            if (draft) {
              setTitle(draft.title || '');
              setAbstract(draft.abstract || '');
              setTags(draft.tags || []);
              setReferences(Array.isArray(draft.references) ? draft.references.join('\n') : draft.references || '');
              setIsAnonymous(draft.anonymous || false);

              const draftData = {
                title: draft.title || '',
                abstract: draft.abstract || '',
                tags: draft.tags || [],
                references: Array.isArray(draft.references) ? draft.references.join('\n') : draft.references || '',
                isAnonymous: draft.anonymous || false,
                content: draft.content || '',
                characterCount: 0,
                lastEdited: new Date().toISOString(),
              };
              localStorage.setItem('draftArticle', JSON.stringify(draftData));
              setLastSavedData(draftData);

              if (editId) localStorage.setItem('currentEditId', editId);
              else if (draftId) localStorage.setItem('currentDraftId', draftId);
            }
          }
        } catch (error) {
          console.error('Error loading data from database:', error);
        }
      }
    } catch (error) {
      console.error('Error in loadDraftData:', error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [draftId, editId, status, initializeNewArticle]);

  // Load data when component mounts or dependencies change
  useEffect(() => {
    if (status !== 'loading') {
      loadDraftData();
    }
  }, [status, loadDraftData, draftId, editId]);

  // Cleanup localStorage when user navigates away from article submission flow
  useEffect(() => {
    // Set a flag that we're currently in the article submission flow
    sessionStorage.setItem('inArticleSubmissionFlow', 'true')

    const handleBeforeUnload = () => {
      // Do not clear localStorage on unload; preserve work by default
      // Session flags will be managed separately on unmount
    }

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      const isNavigatingWithinFlow = sessionStorage.getItem('navigatingWithinArticleFlow') === 'true';

      if (!isNavigatingWithinFlow) {
        // Not navigating within the flow: keep draft data to prevent loss; only remove flow flag
        sessionStorage.removeItem('inArticleSubmissionFlow');
      } else {
        // If we are navigating within the flow (e.g., to step 2), we preserve the data
        // and reset the flag so it doesn't persist incorrectly.
        sessionStorage.removeItem('navigatingWithinArticleFlow');
      }
    };
  }, [])

  // Initialize localStorage for new articles
  useEffect(() => {
    // Only initialize if this is a new article (no draft or edit ID)
    if (!draftId && !editId && !localStorage.getItem('draftArticle')) {
      initializeNewArticle()
    }
  }, [draftId, editId])







  // Manual save draft function
  const handleSaveDraft = async () => {
    if (!session || status !== 'authenticated') {
      alert('Please log in to save drafts');
      return;
    }

    if (!(title || '').trim() && !(abstract || '').trim() && (tags || []).length === 0 && !(references || '').trim()) {
      alert('Please add some content before saving');
      return;
    }

    setIsSavingDraft(true);

    try {
      const existingDraftId = draftId || editId || localStorage.getItem('currentDraftId') || localStorage.getItem('currentEditId');
      const isUpdate = !!existingDraftId;

      // Get existing data from localStorage to include step2 content
      const existingData = localStorage.getItem('draftArticle')
      let step2Data = { content: null, characterCount: 0 }
      
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData)
          step2Data = {
            content: parsed.content || null,
            characterCount: parsed.characterCount || 0
          }
        } catch (error) {
          console.error('Error parsing localStorage data:', error)
        }
      }

      const currentData = {
        title: (title || '').trim() || 'Untitled Article',
        abstract: (abstract || '').trim(),
        tags: tags || [],
        references: (references || '').trim(),
        isAnonymous: isAnonymous || false, // API expects 'isAnonymous'
        content: step2Data.content,
        characterCount: step2Data.characterCount,
        ...(existingDraftId && { id: existingDraftId })
      };

      const response = await fetch('/api/drafts', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      });

      if (response.ok) {
        const result = await response.json();
        if (!isUpdate && result.id) {
          localStorage.setItem('currentDraftId', result.id);
        }
        
        setLastSaved(new Date());
        saveToLocalStorage();
        alert('Draft updated successfully!');
      } else {
        const data = await response.json();
        alert(`Failed to save draft: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('An error occurred while saving the draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };


  
  // Sync URL IDs to localStorage safely (not during render)
  useEffect(() => {
    if (editId) {
      localStorage.setItem('currentEditId', editId)
    } else if (draftId) {
      localStorage.setItem('currentDraftId', draftId)
    }
  }, [editId, draftId])

  const next = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedTitle = (title || '').trim()
    const trimmedAbstract = (abstract || '').trim()

    const errors: string[] = []

    if (!trimmedTitle) {
      errors.push('Title is required')
    } else if (trimmedTitle.length < 10) {
      errors.push('Title must be at least 10 characters long')
    } else if (trimmedTitle.length > 200) {
      errors.push('Title must be less than 200 characters')
    }

    if (!trimmedAbstract) {
      errors.push('Abstract is required')
    } else if (trimmedAbstract.length < 50) {
      errors.push('Abstract must be at least 50 characters long')
    } else if (trimmedAbstract.length > 1000) {
      errors.push('Abstract must be less than 1000 characters')
    }

    if (tags.length === 0) {
      errors.push('Please select at least one tag')
    } else if (tags.length > 5) {
      errors.push('Please select no more than 5 tags')
    }

    // Show validation errors if any
    if (errors.length > 0) {
      alert('Please fix the following issues:\n\n' + errors.join('\n'))
      return
    }

    // Save to localStorage when user clicks "Continue to writing"
    saveToLocalStorage()

    // Mark that we're navigating within the article flow - set this BEFORE navigation
    sessionStorage.setItem('navigatingWithinArticleFlow', 'true')
    // Also set a more persistent flag
    sessionStorage.setItem('preserveArticleData', 'true')

    // Small delay to ensure sessionStorage is set before navigation
    setTimeout(() => {
      router.push('/submit/article/step2')
    }, 10)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Draft</h3>
                <p className="text-sm text-gray-500">Please wait while we load your draft...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <form onSubmit={next} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Article Title *</label>
        <Input
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          required
          className={`w-full px-4 py-3 ${
            showValidationErrors && !(title || '').trim() ? 'border-red-300 bg-red-50' : ''
          }`}
          placeholder="Enter the title of your article..."
        />
        {showValidationErrors && !(title || '').trim() && (
          <p className="mt-1 text-sm text-red-600">Title is required</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Abstract *</label>
        <TextArea
          value={abstract}
          onChange={(e)=>setAbstract(e.target.value)}
          required
          rows={4}
          className={`w-full px-4 py-3 ${
            showValidationErrors && !(abstract || '').trim() ? 'border-red-300 bg-red-50' : ''
          }`}
          placeholder="Provide a concise summary..."
        />
        {showValidationErrors && !(abstract || '').trim() && (
          <p className="mt-1 text-sm text-red-600">Abstract is required</p>
        )}
        <p className="text-xs text-gray-500 mt-2">150-250 words recommended.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags *</label>
        <Select
          isMulti
          name="tags"
          options={ARTICLE_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))}
          value={ARTICLE_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) })).filter(opt => tags.includes(opt.value))}
          onChange={selected => setTags(selected ? selected.map((opt:any) => opt.value) : [])}
          classNamePrefix="react-select"
          placeholder="Select tags..."
          styles={{
            control: (base) => ({
              ...base,
              borderColor: showValidationErrors && tags.length === 0 ? '#fca5a5' : '#d1d5db',
              backgroundColor: showValidationErrors && tags.length === 0 ? '#fef2f2' : 'white',
            })
          }}
        />
        {showValidationErrors && tags.length === 0 && (
          <p className="mt-1 text-sm text-red-600">Please select at least one tag</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{tag}</span>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">References</label>
        <TextArea value={references} onChange={(e)=>setReferences(e.target.value)} rows={4} placeholder="One per line..." />
      </div>
      <div className="flex items-center gap-2">
        <Input
          id="anon"
          type="checkbox"
          checked={isAnonymous}
          onChange={(e)=>setIsAnonymous(e.target.checked)}
          className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 focus:ring-offset-0"
        />
        <label htmlFor="anon" className="text-sm text-gray-700 select-none cursor-pointer">
          Submit anonymously
        </label>
      </div>
      <div className="flex justify-between items-center">
        {/* Manual save warning */}
        <div className="text-sm text-amber-600">
          <span className="inline-flex items-center">
            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Remember to save your draft manually
          </span>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={
              isSavingDraft ||
              (!(title || '').trim() && !(abstract || '').trim() && (tags || []).length === 0 && !(references || '').trim())
            }
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="submit"
            disabled={showValidationErrors && (!(title || '').trim() || !(abstract || '').trim() || (tags || []).length === 0)}
            className={`inline-flex items-center px-6 py-3 rounded-md shadow-sm text-sm font-medium ${
              showValidationErrors && (!(title || '').trim() || !(abstract || '').trim() || (tags || []).length === 0)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            }`}
          >
            Continue to writing →
          </button>
        </div>
      </div>
    </form>
  )
}


