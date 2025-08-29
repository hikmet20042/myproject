import { FileText, Trash2 } from "lucide-react";
import { ReactNode } from "react";
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';

interface Story {
  _id: string;
  title: string;
  content: string;
  contentHtml?: string;
  tags: string[];
  abstract?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  author?: string;
  isAnonymous?: boolean;
  createdAt: string;
}

interface StoriesProps {
  loadingTab: string | null;
  stories: Story[];
  isUnverified: boolean;
  getStatusIcon: (status: string) => ReactNode;
  getStatusColor: (status: string) => string;
  setDeleteConfirm: (confirm: { type: 'article' | 'story' | 'draft', id: string, title: string } | null) => void;
}

export default function Stories({
  loadingTab,
  stories,
  isUnverified,
  getStatusIcon,
  getStatusColor,
  setDeleteConfirm
}: StoriesProps) {
  const { data: session, status } = useSession();

    return(
         <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">My Stories</h2>
              </div>
              <div className="px-6 py-4">
                {loadingTab === 'stories' ? (
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
                ) : stories.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No stories yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start by submitting a story.
                    </p>
                    <div className="mt-6">
                      {isUnverified ? (
                        <Button
                          type="button"
                          disabled
                          variant="secondary"
                          className="cursor-not-allowed"
                          tabIndex={-1}
                          aria-disabled="true"
                        >
                          Submit a Story
                        </Button>
                      ) : (
                        <a 
                          href="/submit/story"
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors duration-200"
                        >
                          Submit a Story
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stories.map((story) => (
                      <div key={story._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
                                {getStatusIcon(story.status)}
                                <span className="ml-1 capitalize">{story.status}</span>
                              </span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{story.title}</h3>
                            <p className="text-sm text-gray-500">
                              Submitted on {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : ''}
                            </p>
                            {story.adminComment && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <strong>Admin Comment:</strong> {story.adminComment}
                                </p>
                              </div>
                            )}
                            <div className="mt-2 flex space-x-2">
                              {/* Allow editing for pending and rejected stories */}
                              {story.status === 'pending' && (
                                <button
                                  onClick={() => {
                                    // Check if user is authenticated
                                    if (!session || status !== 'authenticated') {
                                      alert('Please log in to edit stories.');
                                      return;
                                    }
                                    
                                    // Navigate directly to edit page
                                    window.location.href = `/edit/story/${story._id}/step1`;
                                  }}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                  Edit Story
                                </button>
                              )}
                              {story.status === 'rejected' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      // Check if user is authenticated
                                      if (!session || status !== 'authenticated') {
                                        alert('Please log in to edit stories.');
                                        return;
                                      }
                                      
                                      // Clear any existing story edit data from localStorage
                                      localStorage.removeItem('editStoryData');
                                      localStorage.removeItem('draftStory');
                                      localStorage.removeItem('currentStoryDraftId');
                                      localStorage.removeItem('currentStoryEditId');
                                      localStorage.removeItem('storyStep1Data');
                                      localStorage.removeItem('storyStep2Data');
                                      
                                      // Fetch story data from API with credentials
                                      const response = await fetch(`/api/stories?id=${story._id}`, {
                                        method: 'GET',
                                        credentials: 'include',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                      });
                                      
                                      if (response.ok) {
                                        const data = await response.json();
                                        const storyData = data.story;
                                        
                                        if (storyData) {
                                          // Prepare story data for localStorage
                                          const editData = {
                                            title: storyData.title || '',
                                            tags: storyData.tags || [],
                                            isAnonymous: storyData.isAnonymous || false,
                                            authorName: storyData.isAnonymous ? 'Anonymous' : (storyData.authorName || session.user.name || ''),
                                            content: storyData.content || null,
                                            contentHtml: storyData.contentHtml || '',
                                            characterCount: 0,
                                            editId: story._id
                                          };
                                          
                                          // Store story data in localStorage for the edit page
                                          localStorage.setItem('editStoryData', JSON.stringify(editData));
                                          localStorage.setItem('currentStoryEditId', story._id);
                                          
                                          // Navigate to edit page
                                          window.location.href = `/edit/story/${story._id}/step1`;
                                        } else {
                                          alert('Story data not found.');
                                        }
                                      } else {
                                        console.error('Failed to fetch story data:', response.statusText);
                                        alert('Failed to load story data. Please try again.');
                                      }
                                    } catch (error) {
                                      console.error('Error fetching story data:', error);
                                      alert('Failed to load story data. Please try again.');
                                    }
                                  }}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Edit & Resubmit
                                </button>
                              )}
                              {story.status === 'approved' && (
                                <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-md">
                                  Published (Cannot Edit)
                                </span>
                              )}
                              {/* Allow deletion for all user's stories */}
                              <Button
                                onClick={() => setDeleteConfirm({ type: 'story', id: story._id, title: story.title })}
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