interface BlogPost {
  id: number;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  status: string;
}

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <article className="card hover:shadow-xl transition-all duration-300">
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-xl font-bold text-primary line-clamp-2 flex-1">
            {post.title}
          </h2>
          {post.status === 'pending' && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2 whitespace-nowrap">
              Your Submission
            </span>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span className="font-medium">{post.author}</span>
          <span className="mx-2">•</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </div>
      
      <p className="text-gray-700 mb-4 line-clamp-3 leading-relaxed">
        {post.excerpt}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {post.tags.map((tag) => (
          <span 
            key={tag}
            className="inline-block bg-accent text-primary text-xs px-2 py-1 rounded-full font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>
      
      <button className="text-primary font-medium hover:text-buttonHover transition-colors duration-300 text-sm">
        Read Full Article →
      </button>
    </article>
  );
}
