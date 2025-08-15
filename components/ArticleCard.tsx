'use client'

interface ResearchArticle {
  id: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  status: string;
  type: 'research-article';
  references?: string[];
  abstract?: string;
}

interface ArticleCardProps {
  article: ResearchArticle;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
  <article className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
      {/* Research Badge */}
      <div className="absolute top-4 left-4 z-10">
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Research
        </span>
      </div>



      <div className="p-6 pt-12">
        {/* Date */}
  <div className="flex items-center text-xs text-gray-500 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(article.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>

        {/* Title */}
  <h3 className="text-lg font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors duration-200 line-clamp-2">
          <a href={`/articles/${article.id}`} className="block">
            {article.title}
          </a>
        </h3>

        {/* Abstract/Content Preview */}
  <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {article.abstract || article.excerpt}
        </p>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 3).map((tag, tagIdx) => (
              <span key={tagIdx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">
                +{article.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Research Indicators */}
  <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
          {article.references && article.references.length > 0 && (
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {article.references.length} references
            </div>
          )}
          {article.abstract && (
            <div className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Abstract available
            </div>
          )}
        </div>

        {/* Read More Button */}
        <div className="flex items-center justify-between">
          <a 
            href={`/articles/${article.id}`} 
            className="inline-flex items-center text-sm font-medium text-primary hover:text-red-800 transition-colors duration-200"
          >
            Read Research
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          
          {/* Author */}
          <span className="text-xs text-gray-500">
            by {article.author}
          </span>
        </div>
      </div>
    </article>
  )
}
