'use client'

import { useState, useEffect, useCallback } from 'react'
import BlogCard from '../../components/BlogCard'
import { Button, ButtonLink, SearchBar } from '@/components/ui'
import { LoadingState } from '@/components/shared'
import { BookOpen, Sparkles, Search, RefreshCw, MessageSquare, Heart, ArrowRight, Users } from 'lucide-react'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

interface CommunityBlog { id: number;
  title: string;
  authorName: string;
  date: string;
  excerpt: string;
  content: any; // Can be string or BlockNote array
  status: string;
  type: 'community-blog'; }

const generateExcerpt = (content: any): string => { let textContent = '';
  
  if (typeof content === 'string') { textContent = content; } else if (Array.isArray(content)) { // Handle BlockNote content array
    textContent = content
      .map((block: any) => { if (block.content && Array.isArray(block.content)) { return block.content
            .map((item: any) => item.text || '')
            .join(''); }
        return ''; })
      .join(' ')
      .trim(); }
  
  const words = textContent.split(' ');
  if (words.length <= 30) { return textContent; }
  return words.slice(0, 30).join(' ') + '...'; }

export default function CommunityBlogs() {
  const localePath = useLocalizedPath();
  const [allBlogs, setAllBlogs] = useState<CommunityBlog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Load all blogs once
  const loadAllBlogs = useCallback(async () => { setLoading(true)
    try { const params = new URLSearchParams({ page: '1',
        limit: '100' });
      
      const response = await fetch(`/api/blogs?${params.toString()}`);
      if (response.ok) { const data = await response.json();
        // Map Supabase-backed blogs to CommunityBlog interface
        const publishedBlogs = (data.results || []).filter((blog: any) => blog.status === 'approved');
        setAllBlogs(publishedBlogs.map((blog: any) => ({ id: blog._id || blog.id,
          title: blog.title,
          authorName: blog.authorName,
          date: blog.createdAt || blog.submittedAt || blog.date || new Date().toISOString(),
          excerpt: blog.excerpt || generateExcerpt(blog.content),
          content: blog.content,
          status: blog.status,
          type: 'community-blog' }))); } else { setAllBlogs([]); } } catch (error) { console.error('Failed to load community blogs:', error);
      setAllBlogs([]); } finally { setLoading(false); } }, []);

  // Load all blogs on component mount
  useEffect(() => { loadAllBlogs(); }, [loadAllBlogs]);

  // Client-side filtering based on search only
  const handleSearch = (query: string) => { setSearchQuery(query); };

  const handleClearSearch = () => { setSearchQuery(''); };

  const filteredBlogs = allBlogs.filter(blog => { const matchesSearch = !searchQuery || 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof blog.content === 'string' && blog.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch; });

  if (loading) { return (
      <LoadingState 
        text={'Yüklənir'}
      />
    ) }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl" />

        <div className="section-padding relative z-10">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 mb-8">
              <Sparkles size={14} className="text-accent" />
              {'İcma Bloqları'}
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
              {'İcma Bloqları'}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-gray-600 leading-relaxed">
              {'İcma üzvlərimizin real təcrübələri, çətinlikləri və uğurları. Dəyişikliyə ilham verən və anlaşmanı genişləndirən həqiqi hekayələr.'}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <ButtonLink href={localePath('/submit')} variant="secondary" size="lg" hoverEffect="scale">
                {'Bloq Paylaş'}
              </ButtonLink>
              <ButtonLink href={localePath('/resources')} variant="outline" size="lg" hoverEffect="scale">
                {'Fürsətləri Kəşf Et'}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="section-padding">
          <div className="max-w-7xl mx-auto">
            {allBlogs.length > 0 && allBlogs.some(blog => blog.status === 'pending') && (
              <div className="mb-6">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 shadow-sm sm:px-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-blue-900 mb-1">{'Sənin Bloqların'}</h3>
                      <p className="text-xs sm:text-sm text-blue-800">{'Bunlar sənin göndərdiyin şəxsi bloqlardır. Onlar brauzeriə yerli olaraq saxlanılır.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{'İcma Bloqları'}</h2>
                  <p className="text-sm md:text-base text-gray-600 mt-1">{'İcmamızdan ilhamverici səsləri kəşf et'}</p>
                </div>

                <Button
                  onClick={() => loadAllBlogs()}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="group border border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold transition-colors w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      {'Yenilənir...'}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                      {'Bloqları Yenilə'}
                    </>
                  )}
                </Button>
              </div>

              <SearchBar
                onSearch={handleSearch}
                onClear={handleClearSearch}
                placeholder={'Başlıq, məzmun və ya xülasəyə görə axtarın...'}
                value={searchQuery}
                storageKey="blogs-search"
              />

              {searchQuery && (
                <div className="mt-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <span className="text-gray-700">
                    {`"${searchQuery}" üçün axtarış nəticəsi - ${filteredBlogs.length} ${filteredBlogs.length === 1 ? 'nəticə' : 'nəticə'} tapıldı`}
                  </span>
                </div>
              )}
            </div>

            {filteredBlogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white py-16 px-4 text-center shadow-sm">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-200 rounded-full blur-3xl opacity-20" />
                  <div className="relative w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    {searchQuery ? (
                      <Search className="w-10 h-10 text-blue-600" />
                    ) : (
                      <MessageSquare className="w-10 h-10 text-blue-600" />
                    )}
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{'Bloq tapılmadı'}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? `"${searchQuery}" üçün bloq tapılmadı.`
                    : 'Hal-hazırda heç bir icma bloqu yoxdur.' }
                </p>
                {searchQuery && (
                  <Button onClick={handleClearSearch} size="lg" className="font-semibold">
                    <ArrowRight className="w-5 h-5 mr-2" />
                    {'Bütün Bloqlara Bax'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-slate-50/60">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 md:p-12 text-center shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">{'Öz Bloqunu Paylaş'}</h3>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">{'Sənin şəxsi təcrübələrin vacibdir. Öz yolunu, çətinliklərini və uğurlarını paylaşaraq başqalarına ilham ver və icmamızda mənalı dəyişikliklər yarat.'}</p>

            <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
              {[
                { icon: Heart, text: 'Hekayəni Paylaş' },
                { icon: Users, text: 'Başqalarına İlham Ver' },
                { icon: Sparkles, text: 'Dəyişiklik Yarat' }
              ].map((item, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-slate-50 px-4 py-2">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <ButtonLink
                href={localePath('/submit/blog/step1')}
                variant="secondary"
                size="lg"
                icon={Sparkles}
                iconPosition="left"
                hoverEffect="scale"
              >
                {'Bloqunu Göndər'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  ) }
