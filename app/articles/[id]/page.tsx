'use client'

import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import dynamic from 'next/dynamic'
const BlocknoteReadOnly = dynamic(() => import('@/components/BlocknoteReadOnly'), { ssr: false })
import Link from 'next/link'

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
            if (typeof found.author === 'object' && found.author) {
              authorName = found.author.name || '';
              authorId = found.author._id?.toString() || '';
            } else if (typeof found.author === 'string') {
              authorId = found.author;
            }
            setArticle({
              id: found._id?.toString() || found.id?.toString() || '',
              title: found.title,
              authorName: authorName || authorId,
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
          <Link href="/articles" className="btn-primary inline-block">Back to Articles</Link>
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
    <article className="section-padding py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/articles" className="text-primary hover:underline">← Back to Articles</Link>
        </div>
  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{article.title}</h1>
        <div className="text-sm text-gray-500 mb-4">
          {publishedDate && (
            <span>{new Date(publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          )}
          {article.authorName && (
            <span className="ml-3">
              by {article.authorId ? (
                <Link href={`/profile/${article.authorId}`} className="text-primary hover:underline">{article.authorName || 'User'}</Link>
              ) : (
                article.authorName || 'User'
              )}
            </span>
          )}
        </div>

        {showAbstract && (
          <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
            <h2 className="font-semibold mb-2">Abstract</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{article.abstract}</p>
          </div>
        )}

        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((t, i) => (
              <span key={i} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">{t}</span>
            ))}
          </div>
        )}

  <div className="prose max-w-none">
          {showBlockContent ? (
            <BlocknoteReadOnly initialJSON={article.contentBlocksJson || article.content} />
          ) : showStringContent ? (
            <p className="whitespace-pre-wrap leading-7">{article.content}</p>
          ) : safeHtml ? (
            <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
          ) : (
            <p className="whitespace-pre-wrap leading-7 text-gray-400">No content available.</p>
          )}
        </div>

        {Array.isArray(article.references) && article.references.length > 0 && (
          <div className="mt-10">
            <h3 className="font-semibold mb-2">References</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm text-gray-700">
              {article.references.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}


