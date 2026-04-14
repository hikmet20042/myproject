"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import dynamic from "next/dynamic";
import Image from "next/image";
const BlocknoteReadOnly = dynamic(
  () => import("@/components/BlocknoteReadOnly"),
  { ssr: false },
);
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import BlogReactionsContainer from "@/features/blogs/components/BlogReactionsContainer";
import {
  LoadingState,
  ErrorState,
} from "@/components/shared";
import {
  Calendar,
  User,
  Eye,
  Clock,
  ArrowLeft,
  Share2,
  BookmarkPlus,
  MessageSquare,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { useGlobalFeedback } from "@/hooks/useGlobalFeedback";
import { blogQueryKeys, fetchBlogById } from "@/lib/blogQueries";
import SaveItemButtonContainer from "@/components/containers/SaveItemButtonContainer";

// Helper function to validate UUID or ObjectId format
function isValidUserId(id: string): boolean {
  // MongoDB ObjectId (24 hex chars)
  if (/^[0-9a-fA-F]{24}$/.test(id)) return true;
  // UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) return true;
  return false;
}

// Calculate reading time
function calculateReadingTime(content: any): number {
  if (!content) return 1;
  let text = "";
  if (typeof content === "string") {
    text = content;
  } else if (typeof content === "object") {
    const extractText = (obj: any): string => {
      if (typeof obj === "string") return obj;
      if (Array.isArray(obj)) return obj.map(extractText).join(" ");
      if (obj && typeof obj === "object") {
        return Object.values(obj).map(extractText).join(" ");
      }
      return "";
    };
    text = extractText(content);
  }
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

type Blog = {
  id: string;
  _id?: string;
  slug: string;
  title: string;
  authorName: string;
  authorAvatar?: string;
  author?: string;
  authorUrlHandle?: string | null;
  isAnonymous?: boolean;
  submittedAt?: string;
  date?: string;
  status?: string;
  abstract?: string;
  content?: any;
  contentHtml?: string;
  contentBlocksJson?: any;
  likes?: number;
  dislikes?: number;
  views?: number;
};

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const localePath = useLocalizedPath();
  const { showError } = useGlobalFeedback();
  const [contentReady, setContentReady] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const targetSlug = useMemo(() => params.slug, [params.slug]);

  const blogQuery = useQuery({
    queryKey: blogQueryKeys.detail(targetSlug),
    queryFn: async () => {
      const local = localStorage.getItem("submittedBlogs");
      if (local) {
        try {
          const list: Blog[] = JSON.parse(local);
          const found = list.find((s) => String(s.slug) === String(targetSlug));
          if (found) return found;
        } catch {}
      }
      const apiBlog = await fetchBlogById(targetSlug);
      const apiBlogId = apiBlog.id || apiBlog._id;
      return {
        id: apiBlogId,
        _id: apiBlogId,
        slug: apiBlog.slug,
        title: apiBlog.title,
        authorName: apiBlog.authorName || apiBlog.author_name,
        author: apiBlog.author?.toString?.() || apiBlog.author_id?.toString?.(),
        authorUrlHandle: apiBlog.authorUrlHandle || apiBlog.author_url_handle || null,
        isAnonymous: apiBlog.isAnonymous ?? apiBlog.is_anonymous,
        submittedAt: apiBlog.createdAt || apiBlog.created_at,
        date: apiBlog.createdAt || apiBlog.created_at,
        status: apiBlog.status,
        abstract: apiBlog.abstract || "",
        content: apiBlog.content,
        contentHtml: apiBlog.contentHtml || apiBlog.content_html || "",
        contentBlocksJson: apiBlog.content,
        likes: apiBlog.likes || 0,
        dislikes: apiBlog.dislikes || 0,
        views: apiBlog.views || 0,
      } as Blog;
    },
    retry: false,
  });

  const blog = blogQuery.data || null;

  const readingTime = useMemo(() => {
    if (!blog) return 1;
    return calculateReadingTime(blog.content || blog.contentHtml);
  }, [blog]);

  // Reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const element = contentRef.current;
      const totalHeight = element.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (blogQuery.isError) {
      showError("Bloq yüklənərkən xəta baş verdi");
    }
  }, [blogQuery.isError, showError]);

  useEffect(() => {
    setContentReady(false);
    if (!blog) return;
    const timer = setTimeout(() => setContentReady(true), 200);
    return () => clearTimeout(timer);
  }, [blog?._id, blog?.title]);

  if (blogQuery.isLoading) {
    return <LoadingState text={"Bloq yüklənir…"} />;
  }

  if (!blog || blogQuery.isError) {
    return (
      <ErrorState
        title={"Bloq tapılmadı"}
        message={"Axtardığın bloq artıq mövcud deyil və ya silinib."}
        onRetry={() => blogQuery.refetch()}
        retryText={"Yenidən cəhd et"}
      />
    );
  }

  const publishedDate = blog.submittedAt || blog.date;
  const safeHtml = blog.contentHtml ? DOMPurify.sanitize(blog.contentHtml) : "";
  const formattedDate = publishedDate
    ? new Date(publishedDate).toLocaleDateString("az-AZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header / Hero Section */}
      <header className="relative overflow-hidden bg-white border-b border-gray-200">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-blue-100/50 blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link
              href={localePath("/")}
              className="hover:text-blue-600 transition-colors"
            >
              Ana Səhifə
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href={localePath("/blogs")}
              className="hover:text-blue-600 transition-colors"
            >
              Bloqlar
            </Link>
          </nav>

          {/* Back Button */}
          <Link
            href={localePath("/blogs")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Bloqlara qayıt
          </Link>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-6">
            {blog.title}
          </h1>

          {/* Abstract/Summary if available */}
          {blog.abstract && (
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-3xl">
              {blog.abstract}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Author */}
            {blog.authorName && (
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {blog.authorAvatar ? (
                    <Image src={blog.authorAvatar} alt={blog.authorName} fill className="object-cover" />
                  ) : (
                    blog.isAnonymous ? "?" : blog.authorName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    {blog.authorUrlHandle ? (
                      <Link
                        href={localePath(`/u/${blog.authorUrlHandle}`)}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors underline decoration-blue-200 underline-offset-4 decoration-2 hover:decoration-blue-400"
                      >
                        {blog.authorName}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-900">{blog.authorName}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">Müəllif</span>
                </div>
              </div>
            )}

            {/* Divider */}
            {blog.authorName && (
              <div className="hidden sm:block w-px h-8 bg-gray-200" />
            )}

            {/* Date & Reading Time */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {formattedDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formattedDate}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{readingTime} dəq oxuma</span>
              </div>
              {blog.views !== undefined && blog.views > 0 && (
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span>{blog.views.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main ref={contentRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Blog Content */}
        <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 sm:px-10 lg:px-12 py-8 sm:py-12">
            {blog.content && typeof blog.content === "object" ? (
              <BlocknoteReadOnly initialJSON={blog.content} />
            ) : safeHtml ? (
              <div
                className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-strong:text-gray-900 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4 prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100"
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg">
                {blog.content || ""}
              </div>
            )}
          </div>

          {/* Content Loading State */}
          {!contentReady && (
            <div className="flex items-center justify-center border-t border-gray-100 py-8">
              <div className="flex items-center gap-3 text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span className="text-sm">Məzmun yüklənir...</span>
              </div>
            </div>
          )}
        </article>

        {/* Reactions Section */}
        {contentReady && (blog._id || blog.id) && blog.status === "approved" && (
          <section className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Bu məqalə haqqında nə düşünürsən?</h3>
                  <p className="text-sm text-gray-500">Rəyini bildir və digər oxucularla bölüş</p>
                </div>
              </div>
              <BlogReactionsContainer
                blogId={blog._id || blog.id}
                initialLikes={blog.likes || 0}
                initialDislikes={blog.dislikes || 0}
              />
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <section className="mt-8 flex flex-wrap items-center gap-3">
          <SaveItemButtonContainer
            itemId={blog._id || blog.id}
            itemType="blog"
            itemTitle={blog.title}
            size="md"
          />
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: blog.title,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <Share2 className="h-4 w-4" />
            Paylaş
          </button>
        </section>
      </main>

      {/* CTA Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 mb-4">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Öz təcrübənizi bölüşün
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Sənin şəxsi təcrübələrin vacibdir. Öz yolunu, çətinliklərini və uğurlarını paylaşaraq
              başqalarına ilham ver və icmamızda mənalı dəyişikliklər yarat.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={localePath("/blogs")}>
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Bloqlara qayıt
                </Button>
              </Link>
              <Link href={localePath("/submit/blog")}>
                <Button className="w-full sm:w-auto">
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Bloqunu göndər
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
