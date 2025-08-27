'use client'

interface CommunityStory {
  id: number;
  title: string;
  authorName: string;
  date: string;
  excerpt: string;
  content: any; // Can be string or BlockNote array
  tags: string[];
  status: string;
  type: 'community-story';
}

interface StoryCardProps {
  story: CommunityStory;
}

export default function StoryCard({ story }: StoryCardProps) {
  return (
  <article className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
      {/* Story Badge */}
      <div className="absolute top-4 left-4 z-10">
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Personal Story
        </span>
      </div>



      <div className="p-6 pt-12">
        {/* Date */}
  <div className="flex items-center text-xs text-gray-500 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(story.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>

        {/* Title */}
  <h3 className="text-lg font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors duration-200 line-clamp-2">
          <a href={`/stories/${story.id}`} className="block">
            {story.title}
          </a>
        </h3>

        {/* Content Preview */}
  <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {story.excerpt}
        </p>

        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {story.tags.slice(0, 3).map((tag, tagIdx) => (
              <span key={tagIdx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">
                {tag}
              </span>
            ))}
            {story.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">
                +{story.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Read More Button */}
        <div className="flex items-center justify-between">
          <a 
            href={`/stories/${story.id}`} 
            className="inline-flex items-center text-sm font-medium text-primary hover:text-red-800 transition-colors duration-200"
          >
            Read Story
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          
          {/* Author */}
          <span className="text-xs text-gray-500">
            by {story.authorName}
          </span>
        </div>
      </div>
    </article>
  )
}
