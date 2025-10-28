import { FileText, Trash2 } from "lucide-react";
import { ReactNode } from "react";
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';

interface Blog {
  _id: string;
  title: string;
  content: string;
  contentHtml?: string;
  abstract?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  author?: string;
  isAnonymous?: boolean;
  createdAt: string;
}

interface BlogsProps {
  loadingTab: string | null;
  blogs: Blog[];
  getStatusIcon: (status: string) => ReactNode;
  getStatusColor: (status: string) => string;
  setDeleteConfirm: (confirm: { type: 'blog', id: string, title: string } | null) => void;
}

export default function Blogs({
  loadingTab,
  blogs,
  getStatusIcon,
  getStatusColor,
  setDeleteConfirm
}: BlogsProps) {
  const { data: session, status } = useSession();

    return(
         <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">My Blogs</h2>
              </div>
              <div className="px-6 py-4">
                {loadingTab === 'blogs' ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-6 bg-gray-200 rounded w-64"></div>
                            <div className="h-3 bg-gray-200 rounded w-48"></div>
                          </div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : blogs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No blogs yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start by submitting a blog.
                    </p>
                    <div className="mt-6">
                      {!session?.user?.emailVerified ? (
                        <Button
                          type="button"
                          disabled
                          variant="secondary"
                          className="cursor-not-allowed"
                          tabIndex={-1}
                          aria-disabled="true"
                        >
                          Submit a Blog
                        </Button>
                      ) : (
                        <a 
                          href="/submit/blog"
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors duration-200"
                        >
                          Submit a Blog
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {blogs.map((blog) => (
                      <div key={blog._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}>
                                {getStatusIcon(blog.status)}
                                <span className="ml-1 capitalize">{blog.status}</span>
                              </span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{blog.title}</h3>
                            <p className="text-sm text-gray-500">
                              Submitted on {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ''}
                            </p>
                            {blog.adminComment && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <strong>Admin Comment:</strong> {blog.adminComment}
                                </p>
                              </div>
                            )}
                            <div className="mt-2 flex space-x-2">
                              {/* Allow editing for pending and rejected blogs */}
                              {blog.status === 'pending' && (
                                <button
                                  onClick={() => {
                                    // Check if user is authenticated
                                    if (!session || status !== 'authenticated') {
                                      alert('Please log in to edit blogs.');
                                      return;
                                    }
                                    
                                    // Navigate directly to edit page
                                    window.location.href = `/edit/blog/${blog._id}/step1`;
                                  }}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                  Edit Blog
                                </button>
                              )}
                              {blog.status === 'rejected' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      // Check if user is authenticated
                                      if (!session || status !== 'authenticated') {
                                        alert('Please log in to edit blogs.');
                                        return;
                                      }
                                      
                                      // Clear any existing blog edit data from localStorage
                                      localStorage.removeItem('editBlogData');
                                      localStorage.removeItem('currentBlogEditId');
                                      localStorage.removeItem('blogStep1Data');
                                      localStorage.removeItem('blogStep2Data');
                                      
                                      // Fetch blog data from API with credentials
                                      const response = await fetch(`/api/blogs?id=${blog._id}`, {
                                        method: 'GET',
                                        credentials: 'include',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                      });
                                      
                                      if (response.ok) {
                                        const data = await response.json();
                                        const blogData = data.story;

                                        if (blogData) {
                                          // Prepare blog data for localStorage
                                          const editData = {
                                            title: blogData.title || '',
                                            isAnonymous: blogData.isAnonymous || false,
                                            authorName: blogData.isAnonymous ? 'Anonymous' : (blogData.authorName || session.user.name || ''),
                                            content: blogData.content || null,
                                            contentHtml: blogData.contentHtml || '',
                                            characterCount: 0,
                                            editId: blog._id
                                          };
                                          
                                          // Store blog data in localStorage for the edit page
                                          localStorage.setItem('editBlogData', JSON.stringify(editData));
                                          localStorage.setItem('currentBlogEditId', blog._id);
                                          
                                          // Navigate to edit page
                                          window.location.href = `/edit/blog/${blog._id}/step1`;
                                        } else {
                                          alert('Blog data not found.');
                                        }
                                        } else {
                                        console.error('Failed to fetch blog data:', response.statusText);
                                        alert('Failed to load blog data. Please try again.');
                                      }
                                      } catch (error) {
                                      console.error('Error fetching blog data:', error);
                                      alert('Failed to load blog data. Please try again.');
                                      }
                                  }}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Edit & Resubmit
                                </button>
                              )}
                              {blog.status === 'approved' && (
                                <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-md">
                                  Published (Cannot Edit)
                                </span>
                              )}
                              {/* Allow deletion for all user's blogs */}
                              <Button
                                onClick={() => setDeleteConfirm({ type: 'blog', id: blog._id, title: blog.title })}
                                variant="outline"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
              </div>
            </div>
    )
}