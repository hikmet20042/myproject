import { FileText, Trash2 } from "lucide-react";
import { ReactNode } from "react";
import { useRouter } from 'next/navigation'
import { Button, ButtonLink } from '@/components/ui';
import { useSession } from '@/lib/auth/client';
import { useLocalizedPath } from '@/lib/useLocalizedPath'

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
  getStatusIcon: (status: string) => ReactNode;
  getStatusColor: (status: string) => string;
  setDeleteConfirm: (confirm: { type: 'blog', id: string, title: string } | null) => void; }

export default function Blogs({ loadingTab,
  blogs,
  getStatusIcon,
  getStatusColor,
  setDeleteConfirm }: BlogsProps) { const { data: session, status } = useSession();
  const localePath = useLocalizedPath()
  const router = useRouter()

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
        {loadingTab === 'blogs' ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-2 border-blue-100 rounded-xl p-6 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-6 bg-slate-300 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-slate-300 rounded-lg w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-emerald-600 rounded-2xl blur opacity-25"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{'Hələ bloq yoxdur'}</h3>
            <p className="text-base text-gray-600 mb-8">
              {'Bloq göndərərək başlayın.'}
            </p>
            <div>
              {!session?.user?.emailVerified ? (
                <Button
                  type="button"
                  disabled
                  variant="secondary"
                  className="cursor-not-allowed w-full sm:w-auto"
                  tabIndex={-1}
                  aria-disabled="true"
                >
                  {'Bloq Göndər'}
                </Button>
              ) : (
                <ButtonLink
                  href={localePath('/submit/blog/step1')}
                  variant="primary"
                  size="md"
                  icon={FileText}
                  iconPosition="left"
                  shadow="lg"
                  hoverEffect="scale"
                  className="w-full sm:w-auto"
                >
                  {'Bloq Göndər'}
                </ButtonLink>
              )}
            </div>
          </div>
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
                          onClick={() => { // Check if user is authenticated
                            if (!session || status !== 'authenticated') { alert('Bloqları redaktə etmək üçün daxil olun.');
                              return; }

                            // Navigate directly to edit page
                            router.push(localePath(`/edit/blog/${blog._id}/step1`)); }}
                          className="inline-flex items-center px-4 py-2.5 border border-amber-600 bg-amber-600 text-white shadow-sm text-sm font-semibold rounded-xl hover:bg-amber-700 hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-200"
                        >
                          {'Bloqu Redaktə Et'}
                        </button>
                      )}
                      {blog.status === 'rejected' && (
                        <button
                          onClick={async () => { try { // Check if user is authenticated
                              if (!session || status !== 'authenticated') { alert('Bloqları redaktə etmək üçün daxil olun.');
                                return; }

                              // Clear any existing blog edit data from localStorage
                              localStorage.removeItem('editBlogData');
                              localStorage.removeItem('currentBlogEditId');
                              localStorage.removeItem('blogStep1Data');
                              localStorage.removeItem('blogStep2Data');

                              // Fetch blog data from API with credentials
                              const response = await fetch(`/api/blogs?id=${blog._id}`, { method: 'GET',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json', }, });

                              if (response.ok) { const data = await response.json();
                                const blogData = data.story;

                                if (blogData) { // Prepare blog data for localStorage
                                  const editData = { title: blogData.title || '',
                                    isAnonymous: blogData.isAnonymous || false,
                                    authorName: blogData.isAnonymous ? 'Anonim' : (blogData.authorName || session?.user?.name || ''),
                                    content: blogData.content || null,
                                    contentHtml: blogData.contentHtml || '',
                                    characterCount: 0,
                                    editId: blog._id };

                                  // Store blog data in localStorage for the edit page
                                  localStorage.setItem('editBlogData', JSON.stringify(editData));
                                  localStorage.setItem('currentBlogEditId', blog._id);

                                  // Navigate to edit page
                                  router.push(localePath(`/edit/blog/${blog._id}/step1`)); } else { alert('Bloq məlumatı tapılmadı.'); } } else { console.error('Failed to fetch blog data:', response.statusText);
                                alert('Bloq məlumatlarını yükləmək alınmadı. Zəhmət olmasa yenidən cəhd edin.'); } } catch (error) { console.error('Error fetching blog data:', error);
                              alert('Bloq məlumatlarını yükləmək alınmadı. Zəhmət olmasa yenidən cəhd edin.'); } }}
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
