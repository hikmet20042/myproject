import { FileText, Trash2 } from "lucide-react";
import { ReactNode } from "react";
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui';
import { useSession } from '@/lib/auth/client';
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState, ErrorState, EmptyState } from '@/components/shared'
import { useGlobalFeedback } from '@/lib/useGlobalFeedback'

interface Blog { _id: string;
  title: string;
  content: string;
  contentHtml?: string;
  abstract?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComment?: string;
  author?: string;
  isAnonymous?: boolean;
  createdAt: string;
  views?: number; }

interface BlogsProps { loadingTab: string | null;
  blogs: Blog[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  getStatusIcon: (status: string) => ReactNode;
  getStatusColor: (status: string) => string;
  setDeleteConfirm: (confirm: { type: 'blog', id: string, title: string } | null) => void; }

export default function Blogs({ loadingTab,
  blogs,
  isLoading = false,
  isError = false,
  onRetry,
  getStatusIcon,
  getStatusColor,
  setDeleteConfirm }: BlogsProps) { const { data: session } = useSession();
  const localePath = useLocalizedPath()
  const router = useRouter()
  const { showError } = useGlobalFeedback()

  return (
    <div className="bg-white shadow-md rounded-2xl border-2 border-blue-100 overflow-hidden">
      <div className="relative px-6 py-6 bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 border-b-2 border-blue-100">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5"></div>

        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{'Mənim Bloqlarım'}</h2>
        </div>
      </div>
      <div className="px-6 py-6">
        {isLoading || loadingTab === 'blogs' ? (
          <LoadingState fullPage={false} text={'Bloqlar yüklənir...'} />
        ) : isError ? (
          <ErrorState
            fullPage={false}
            title={'Bloqlar yüklənmədi'}
            message={'Mənim bloqlarım bölməsi yüklənərkən problem baş verdi.'}
            onRetry={onRetry}
          />
        ) : blogs.length === 0 ? (
          <EmptyState
            title={'Hələ bloq yoxdur'}
            message={'Bloq göndərərək başlayın.'}
            actionText={session?.user?.emailVerified ? 'Bloq Göndər' : undefined}
            onAction={session?.user?.emailVerified ? () => router.push(localePath('/submit/blog/step1')) : undefined}
          />
        ) : (
          <div className="space-y-4">
            {blogs.map((blog, idx) => (
              <div key={blog._id} className="group relative border-2 border-blue-100 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 hover:border-blue-300 hover:shadow-xl transition-all duration-300 animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-emerald-500/0 group-hover:from-blue-500/5 group-hover:to-emerald-500/5 rounded-2xl transition-all duration-300"></div>

                <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${getStatusColor(blog.status)}`}>
                        {getStatusIcon(blog.status)}
                        <span className="ml-1.5">{blog.status}</span>
                      </span>
                      {/* View Count Badge */}
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-700">
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        {blog.views || 0} {'baxış'}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{blog.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                      {'Göndərildi'} {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ''}
                    </p>
                    {blog.adminComment && (
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-50 border-l-4 border-amber-400 rounded-xl">
                        <p className="text-sm text-gray-700">
                          <strong className="text-amber-700">{'İdarəçi şərhi'}:</strong> {blog.adminComment}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {/* Allow editing for pending and rejected blogs */}
                      {blog.status === 'pending' && (
                        <button
                          onClick={() => {
                            router.push(localePath(`/edit/blog/${blog._id}/step1`)); }}
                          className="inline-flex items-center px-4 py-2.5 border border-amber-600 bg-amber-600 text-white shadow-sm text-sm font-semibold rounded-xl hover:bg-amber-700 hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-200"
                        >
                          {'Bloqu Redaktə Et'}
                        </button>
                      )}
                      {blog.status === 'rejected' && (
                        <button
                          onClick={async () => { try {
                              // Clear any existing blog edit data from localStorage
                              localStorage.removeItem('editBlogData');
                              localStorage.removeItem('blogStep1Data');
                              localStorage.removeItem('blogStep2Data');

                              // Fetch blog data from API with credentials
                              const response = await fetch(`/api/blogs/${blog._id}`, { method: 'GET',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json', }, });

                              if (response.ok) { const data = await response.json();
                                const blogData = data.blog;

                                if (blogData) { // Prepare blog data for localStorage
                                  const editData = { id: blog._id,
                                    title: blogData.title || '',
                                    isAnonymous: blogData.isAnonymous ?? blogData.is_anonymous ?? false,
                                    authorName: (blogData.isAnonymous ?? blogData.is_anonymous) ? 'Anonim' : (blogData.authorName || blogData.author_name || session?.user?.name || ''),
                                    content: blogData.content || null,
                                    contentHtml: blogData.contentHtml || blogData.content_html || '' };

                                  // Store blog data in localStorage for the edit page
                                  localStorage.setItem('editBlogData', JSON.stringify(editData));

                                  // Navigate to edit page
                                  router.push(localePath(`/edit/blog/${blog._id}/step1`)); } else { showError('Bloq məlumatı tapılmadı.'); } } else { console.error('Failed to fetch blog data:', response.statusText);
                                showError('Bloq məlumatlarını yükləmək alınmadı. Zəhmət olmasa yenidən cəhd edin.'); } } catch (error) { console.error('Error fetching blog data:', error);
                              showError('Bloq məlumatlarını yükləmək alınmadı. Zəhmət olmasa yenidən cəhd edin.'); } }}
                          className="inline-flex items-center px-4 py-2.5 border border-blue-600 bg-blue-600 text-white shadow-sm text-sm font-semibold rounded-xl hover:bg-blue-700 hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-200"
                        >
                          {'Redaktə et və yenidən göndər'}
                        </button>
                      )}
                      {blog.status === 'approved' && (
                        <span className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-600 bg-slate-100 rounded-xl border-2 border-blue-100">
                          {'Yayımlandı (Redaktə Olunmur)'}
                        </span>
                      )}
                      {/* Allow deletion for all user's blogs */}
                      <Button
                        onClick={() => setDeleteConfirm({ type: 'blog', id: blog._id, title: blog.title })}
                        variant="outline"
                        size="sm"
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-300"
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
  ) }
