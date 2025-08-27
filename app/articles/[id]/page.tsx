'use client'

import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

// Custom CSS styles for professional BlocknoteReadOnly editor
const articleStyles = `
  .article-content {
    line-height: 1.8;
    color: #2d3748;
  }
  
  /* Professional styling for BlocknoteReadOnly editor */
    .bn-editor {
      border: none !important;
      box-shadow: none !important;
      background: #F9FAFB !important;
      padding: 0 !important;
    }
    
    .bn-editor .ProseMirror {
      padding: 0 !important;
      border: none !important;
      outline: none !important;
      line-height: 1.8 !important;
      color: #2d3748 !important;
      background: #F9FAFB !important;
    }
    
    /* Remove any editor-specific backgrounds */
    .bn-editor .ProseMirror-focused {
      background: #F9FAFB !important;
    }
    
    .bn-editor .bn-block-group {
      background: #F9FAFB !important;
    }
    
    .bn-editor .bn-block {
      background: #F9FAFB !important;
    }
  
  .bn-editor .ProseMirror p {
    margin-bottom: 1.5rem !important;
    text-align: justify !important;
    text-indent: 1.5rem !important;
    line-height: 1.8 !important;
  }
  
  .bn-editor .ProseMirror h1, 
  .bn-editor .ProseMirror h2, 
  .bn-editor .ProseMirror h3, 
  .bn-editor .ProseMirror h4, 
  .bn-editor .ProseMirror h5, 
  .bn-editor .ProseMirror h6 {
    font-weight: 600 !important;
    margin-top: 2rem !important;
    margin-bottom: 1rem !important;
    color: #1a202c !important;
    text-indent: 0 !important;
  }
  
  .bn-editor .ProseMirror h2 {
    font-size: 1.5rem !important;
    border-bottom: 2px solid #e2e8f0 !important;
    padding-bottom: 0.5rem !important;
  }
  
  .bn-editor .ProseMirror h3 {
    font-size: 1.25rem !important;
  }
  
  .bn-editor .ProseMirror blockquote {
    border-left: 4px solid #3182ce !important;
    padding-left: 1rem !important;
    margin: 1.5rem 0 !important;
    font-style: italic !important;
    background-color: #f7fafc !important;
    padding: 1rem !important;
    text-indent: 0 !important;
  }
  
  
  .bn-editor .ProseMirror ul, 
  .bn-editor .ProseMirror ol {
    margin: 1rem 0 !important;
    padding-left: 2rem !important;
  }
  
  .bn-editor .ProseMirror li {
    margin-bottom: 0.5rem !important;
    text-indent: 0 !important;
  }
  
  .bn-editor .ProseMirror code {
    background-color: #f1f5f9 !important;
    padding: 0.25rem 0.5rem !important;
    border-radius: 0.25rem !important;
    font-family: 'Monaco', 'Menlo', monospace !important;
    font-size: 0.875rem !important;
  }
  
  .bn-editor .ProseMirror pre {
    background-color: #1a202c !important;
    color: #e2e8f0 !important;
    padding: 1rem !important;
    border-radius: 0.5rem !important;
    overflow-x: auto !important;
    margin: 1.5rem 0 !important;
  }
  
  .bn-editor .ProseMirror img {
    max-width: 100% !important;
    height: auto !important;
    margin: 1.5rem auto !important;
    display: block !important;
    border-radius: 0.5rem !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
  }
  
  .bn-editor .ProseMirror table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 1.5rem 0 !important;
  }
  
  .bn-editor .ProseMirror th, 
  .bn-editor .ProseMirror td {
    border: 1px solid #e2e8f0 !important;
    padding: 0.75rem !important;
    text-align: left !important;
  }
  
  .bn-editor .ProseMirror th {
    background-color: #f7fafc !important;
    font-weight: 600 !important;
  }
  
  /* Hide editor toolbar and controls */
  .bn-toolbar, .bn-side-menu, .bn-slash-menu {
    display: none !important;
  }
`

type Article = {
  id: number | string
  title: string
  authorName: string
  authorId?: string
  submittedAt?: string
  date?: string
  tags?: string[]
  status?: string
  abstract?: string
  references?: string[]
  content?: string
  contentHtml?: string
  contentBlocksJson?: any
}

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  // Always use the full string id for MongoDB ObjectId compatibility
  const targetId = params.id;

  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/articles?id=${encodeURIComponent(targetId)}`);
        if (res.ok) {
          const data = await res.json();
          let found = null;
          if (Array.isArray(data.results)) {
            found = data.results.find((a: any) => String(a._id) === String(targetId) || String(a.id) === String(targetId));
          } else if (data.article) {
            found = data.article;
          }
          if (found) {
            // Map MongoDB JSON to Article type for UI
            let authorName = '';
            let authorId = '';
            
            // Handle populated userId field (when author data is populated)
            if (found.userId && typeof found.userId === 'object' && found.userId.name) {
              authorName = found.userId.name;
              authorId = found.userId._id?.toString() || '';
            } 
            // Handle direct userId field (ObjectId string)
            else if (found.userId && typeof found.userId === 'string') {
              authorId = found.userId;
              authorName = found.authorName || 'User'; // Use stored authorName or fallback
            }
            // Fallback to authorName field if no userId
            else {
              authorName = found.authorName || 'Anonymous';
              authorId = ''; // No valid user ID available
            }
            
            setArticle({
              id: found._id?.toString() || found.id?.toString() || '',
              title: found.title,
              authorName,
              authorId,
              submittedAt: found.publishedAt ? new Date(found.publishedAt).toISOString() : undefined,
              date: found.date ? new Date(found.date).toISOString() : undefined,
              tags: Array.isArray(found.tags) ? found.tags : [],
              status: found.status,
              abstract: found.abstract || '',
              references: Array.isArray(found.references) ? found.references : [],
              content: typeof found.content === 'string' ? found.content : '',
              contentHtml: found.contentHtml || '',
              contentBlocksJson: found.content && typeof found.content === 'object' ? found.content : undefined,
            });
            return;
          }
        }
        // fallback: not found
        if (mounted) setArticle(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false };
  }, [targetId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-gray-600">Loading article…</div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="section-padding py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2">Article not found</h1>
          <p className="text-gray-600 mb-4">The article you were looking for doesn’t exist or was removed.</p>
          <Link href="/articles">
                  <Button variant="primary">
                    Back to Articles
                  </Button>
                </Link>
        </div>
      </div>
    )
  }

  const publishedDate = article.submittedAt || article.date;
  const safeHtml = article.contentHtml ? DOMPurify.sanitize(article.contentHtml) : '';
  // Support MongoDB articles: show abstract and content from both string and object
  const showAbstract = article.abstract && typeof article.abstract === 'string' && article.abstract.trim().length > 0;
  const showBlockContent = article.contentBlocksJson || (article.content && typeof article.content === 'object');
  const showStringContent = article.content && typeof article.content === 'string' && article.content.trim().length > 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: articleStyles }} />
      <article className="section-padding py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link href="/articles" className="text-primary hover:underline text-sm">← Back to Articles</Link>
          </div>
          
          {/* Article Header */}
          <header className="mb-10 pb-6 border-b border-gray-200">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {publishedDate && (
                <time className="font-medium">
                  {new Date(publishedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </time>
              )}
              {article.authorName && (
                <div className="flex items-center">
                  <span className="mr-1">by</span>
                  {article.authorId && article.authorId.trim() !== '' ? (
                    <Link href={`/profile/${article.authorId}`} className="text-primary hover:underline font-medium">
                      {article.authorName}
                    </Link>
                  ) : (
                    <span className="font-medium">{article.authorName}</span>
                  )}
                </div>
              )}
            </div>
          </header>

          {showAbstract && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Abstract</h2>
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-primary">
                <p className="text-gray-800 leading-relaxed text-justify text-lg">
                  {article.abstract}
                </p>
              </div>
            </section>
          )}

          {Array.isArray(article.tags) && article.tags.length > 0 && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((t, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          <main className="mt-10">
            <div className="article-content text-lg">
              {showBlockContent ? (
                <BlocknoteReadOnly initialJSON={article.contentBlocksJson || article.content} />
              ) : showStringContent ? (
                <div className="whitespace-pre-wrap">{article.content}</div>
              ) : safeHtml ? (
                <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
              ) : (
                <p className="text-gray-400 italic text-center py-8">No content available.</p>
              )}
            </div>
          </main>

          {Array.isArray(article.references) && article.references.length > 0 && (
            <section className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">References</h3>
              <ol className="space-y-3">
                {article.references.map((r, i) => (
                  <li key={i} className="text-gray-700 leading-relaxed">
                    <span className="font-medium text-gray-900">[{i + 1}]</span> {r}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </article>
    </>
  )
}


