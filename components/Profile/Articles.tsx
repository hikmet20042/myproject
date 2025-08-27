import { FileText, Trash2 } from "lucide-react";
import { ReactNode } from "react";
import { Button } from '@/components/ui/Button';

interface Article {
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

interface ArticlesProps {
  loadingTab: string | null;
  articles: Article[];
  isUnverified: boolean;
  getStatusIcon: (status: string) => ReactNode;
  handleEditRejectedArticle: (articleId: string) => Promise<void>;
  getStatusColor: (status: string) => string;
  setDeleteConfirm: (confirm: { type: 'article' | 'story' | 'draft', id: string, title: string } | null) => void;
}

export default function Articles({
  loadingTab,
  articles,
  isUnverified,
  getStatusIcon,
  handleEditRejectedArticle,
  getStatusColor,
  setDeleteConfirm
}: ArticlesProps) {
    return (
        <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">My Submitted Articles</h2>
                <p className="text-sm text-gray-600 mt-1">Track the status of your submitted articles</p>
              </div>
              <div className="px-6 py-4">
                {loadingTab === 'articles' ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-6 bg-gray-200 rounded w-64"></div>
                            <div className="h-3 bg-gray-200 rounded w-48"></div>
                          </div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                articles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No submitted articles</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't submitted any articles for review yet. Start by creating and submitting your first article.
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
                          Submit an Article
                        </Button>
                      ) : (
                        <a 
                          href="/submit/article"
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors duration-200"
                        >
                          Submit an Article
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {articles.map((article) => (
                      <div key={article._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
                                {getStatusIcon(article.status)}
                                <span className="ml-1 capitalize">{article.status}</span>
                              </span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">{article.title}</h3>
                            <p className="text-sm text-gray-500">
                              Submitted on {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ''}
                            </p>
                            {article.adminComment && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <strong>Admin Comment:</strong> {article.adminComment}
                                </p>
                              </div>
                            )}
                            <div className="mt-2 flex space-x-2">
                              {/* Allow editing for pending and rejected articles */}
                              {article.status === 'pending' && (
                                <a
                                  href={`/edit/article/${article._id}`}
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                  Edit Article
                                </a>
                              )}
                              {article.status === 'rejected' && (
                                <Button
                                  onClick={() => handleEditRejectedArticle(article._id)}
                                  className="bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"
                                >
                                  Edit & Resubmit
                                </Button>
                              )}
                              {article.status === 'approved' && (
                                <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-md">
                                  Published (Cannot Edit)
                                </span>
                              )}
                              {/* Allow deletion for all user's articles */}
                              <Button
                                onClick={() => setDeleteConfirm({ type: 'article', id: article._id, title: article.title })}
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
                ))}
                
              </div>
            </div>
    )
}