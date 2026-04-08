"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import dynamic from "next/dynamic";
const BlocknoteReadOnly = dynamic(
  () => import("@/components/BlocknoteReadOnly"),
  { ssr: false },
);
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import BlogReactions from "@/components/BlogReactions";
import {
  LoadingState,
  ErrorState,
  AnimatedBackground,
} from "@/components/shared";
import {
  Calendar,
  User,
  Eye,
  Heart,
  BookOpen,
} from "lucide-react";
import { useLocalizedPath } from "@/lib/useLocalizedPath";
import ViewTracker from "@/components/ViewTracker";
import { blogQueryKeys, fetchBlogById } from "@/lib/blogQueries";
import { DetailPageLayout } from "@/components/layout";
import SaveButton from "@/components/SaveButton";

// Custom CSS styles for professional BlocknoteReadOnly editor
const blogStyles = `
  .blog-content { line-height: 1.8;
    color: #2d3748; }
  
  /* Professional Magazine-Style BlocknoteReadOnly Editor */
  .bn-editor { border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0 !important; }
  
  .bn-editor .ProseMirror { padding: 0 !important;
    border: none !important;
    outline: none !important;
    line-height: 1.9 !important;
    color: #1a202c !important;
    background: transparent !important;
    font-size: 1.0625rem !important;
    letter-spacing: 0.01em !important; }
  
  /* Remove any editor-specific backgrounds */
  .bn-editor .ProseMirror-focused { background: transparent !important; }
  
  .bn-editor .bn-block-group { background: transparent !important; }
  
  .bn-editor .bn-block { background: transparent !important; }
  
  /* Beautiful Paragraphs */
  .bn-editor .ProseMirror p { margin-bottom: 1.75rem !important;
    text-align: justify !important;
    line-height: 1.9 !important;
    color: #374151 !important;
    font-weight: 400 !important;
    hyphens: auto !important;
    word-spacing: 0.05em !important; }
  
  .bn-editor .ProseMirror p:first-of-type::first-letter { font-size: 3.5em !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    float: left !important;
    margin: 0.1em 0.1em 0 0 !important;
    color: #2563EB !important;
    background: linear-gradient(135deg, #2563eb 0%, #10b981 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important; }
  
  /* Elegant Headings */
  .bn-editor .ProseMirror h1, 
  .bn-editor .ProseMirror h2, 
  .bn-editor .ProseMirror h3, 
  .bn-editor .ProseMirror h4, 
  .bn-editor .ProseMirror h5, 
  .bn-editor .ProseMirror h6 { font-weight: 700 !important;
    margin-top: 2.5rem !important;
    margin-bottom: 1.25rem !important;
    color: #111827 !important;
    text-indent: 0 !important;
    letter-spacing: -0.02em !important;
    line-height: 1.3 !important; }
  
  .bn-editor .ProseMirror h1 { font-size: 2.25rem !important;
    color: #0F172A !important;
    border-bottom: 3px solid #E5E7EB !important;
    padding-bottom: 0.75rem !important; }
  
  .bn-editor .ProseMirror h2 { font-size: 1.875rem !important;
    color: #1F2937 !important;
    border-left: 4px solid #2563EB !important;
    padding-left: 1rem !important;
    border-bottom: 2px solid #E5E7EB !important;
    padding-bottom: 0.625rem !important; }
  
  .bn-editor .ProseMirror h3 { font-size: 1.5rem !important;
    color: #374151 !important;
    border-left: 3px solid #10B981 !important;
    padding-left: 0.875rem !important; }
  
  .bn-editor .ProseMirro h4 { font-size: 1.25rem !important;
    color: #4B5563 !important; }
  
  /* Stylish Blockquotes */
  .bn-editor .ProseMirror blockquote { position: relative !important;
    border: none !important;
    padding: 1.5rem 2rem 1.5rem 4rem !important;
    margin: 2rem 0 !important;
    font-style: italic !important;
    background: linear-gradient(135deg, #eff6ff 0%, #ecfdf5 100%) !important;
    border-radius: 0.75rem !important;
    text-indent: 0 !important;
    color: #1E40AF !important;
    font-size: 1.125rem !important;
    line-height: 1.75 !important;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.08) !important; }
  
  .bn-editor .ProseMirror blockquote::before { content: '"' !important;
    position: absolute !important;
    left: 1rem !important;
    top: 0.5rem !important;
    font-size: 4rem !important;
    color: #60A5FA !important;
    opacity: 0.3 !important;
    font-family: Georgia, serif !important;
    line-height: 1 !important; }
  
  /* Enhanced Lists */
  .bn-editor .ProseMirror ul, 
  .bn-editor .ProseMirror ol { margin: 1.5rem 0 !important;
    padding-left: 2rem !important; }
  
  .bn-editor .ProseMirror ul li { margin-bottom: 0.75rem !important;
    text-indent: 0 !important;
    position: relative !important;
    padding-left: 0.5rem !important; }
  
  .bn-editor .ProseMirror ul li::marker { color: #2563EB !important;
    font-size: 1.2em !important; }
  
  .bn-editor .ProseMirror ol li { margin-bottom: 0.75rem !important;
    text-indent: 0 !important;
    padding-left: 0.5rem !important; }
  
  .bn-editor .ProseMirror ol li::marker { color: #2563EB !important;
    font-weight: 600 !important; }
  
  /* Inline Code */
  .bn-editor .ProseMirror code { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
    color: #DC2626 !important;
    padding: 0.25rem 0.5rem !important;
    border-radius: 0.375rem !important;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace !important;
    font-size: 0.9em !important;
    font-weight: 500 !important;
    border: 1px solid #E5E7EB !important; }
  
  /* Code Blocks */
  .bn-editor .ProseMirror pre { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
    color: #e2e8f0 !important;
    padding: 1.5rem !important;
    border-radius: 0.75rem !important;
    overflow-x: auto !important;
    margin: 2rem 0 !important;
    border: 1px solid #334155 !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2) !important; }
  
  .bn-editor .ProseMirror pre code { background: transparent !important;
    color: #e2e8f0 !important;
    border: none !important;
    padding: 0 !important;
    font-size: 0.9rem !important; }
  
  /* Beautiful Images */
  .bn-editor .ProseMirror img { max-width: 100% !important;
    height: auto !important;
    margin: 2.5rem auto !important;
    display: block !important;
    border-radius: 1rem !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
    border: 1px solid #E5E7EB !important; }
  
  /* Elegant Tables */
  .bn-editor .ProseMirror table { width: 100% !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
    margin: 2rem 0 !important;
    border-radius: 0.75rem !important;
    overflow: hidden !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important; }
  
  .bn-editor .ProseMirror th, 
  .bn-editor .ProseMirror td { border: 1px solid #E5E7EB !important;
    padding: 1rem !important;
    text-align: left !important; }
  
  .bn-editor .ProseMirror th { background: linear-gradient(135deg, #2563eb 0%, #10b981 100%) !important;
    color: white !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    font-size: 0.875rem !important;
    letter-spacing: 0.05em !important; }
  
  .bn-editor .ProseMirror tr:nth-child(even) { background-color: #F9FAFB !important; }
  
  .bn-editor .ProseMirror tr:hover { background-color: #F3F4F6 !important; }
  
  /* Strong and Emphasis */
  .bn-editor .ProseMirror strong { font-weight: 700 !important;
    color: #111827 !important; }
  
  .bn-editor .ProseMirror em { font-style: italic !important;
    color: #4B5563 !important; }
  
  /* Links */
  .bn-editor .ProseMirror a { color: #2563EB !important;
    text-decoration: underline !important;
    text-decoration-color: #BFDBFE !important;
    text-decoration-thickness: 2px !important;
    text-underline-offset: 2px !important;
    transition: all 0.2s ease !important; }
  
  .bn-editor .ProseMirror a:hover { color: #1D4ED8 !important;
    text-decoration-color: #2563EB !important;
    text-decoration-thickness: 3px !important; }
  
  /* Hide editor controls */
  .bn-toolbar, .bn-side-menu, .bn-slash-menu { display: none !important; }
`;

// Helper function to validate ObjectId format
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

type Blog = {
  id: string;
  _id?: string;
  title: string;
  authorName: string;
  author?: string; // User ID
  isAnonymous?: boolean;
  submittedAt?: string;
  date?: string;
  status?: string;
  abstract?: string;
  content?: string;
  contentHtml?: string;
  contentBlocksJson?: any;
  likes?: number;
  dislikes?: number;
  views?: number;
};

export default function BlogDetailPage({ params }: { params: { id: string } }) {
  // localized pattern for author display, supports templates like "by {{author}}" (en)
  // and "{{author}} tərəfindən" (az)
  const byPattern = "{{author}} tərəfindən";
  const byParts = (byPattern || "").split("{{author}}");
  const byPre = byParts[0] || "";
  const byPost = byParts[1] || "";
  const targetId = useMemo(() => {
    return params.id;
  }, [params.id]);

  const localePath = useLocalizedPath();
  const [contentReady, setContentReady] = useState(false);

  const blogQuery = useQuery({
    queryKey: blogQueryKeys.detail(targetId),
    queryFn: async () => {
      const local = localStorage.getItem("submittedBlogs");
      if (local) {
        try {
          const list: Blog[] = JSON.parse(local);
          const found = list.find((s) => String(s.id) === String(targetId));
          if (found) return found;
        } catch {}
      }
      const apiBlog = await fetchBlogById(targetId);
      const apiBlogId = apiBlog.id || apiBlog._id;
      return {
        id: apiBlogId,
        _id: apiBlogId,
        title: apiBlog.title,
        authorName: apiBlog.authorName || apiBlog.author_name,
        author: apiBlog.author?.toString?.() || apiBlog.author_id?.toString?.(),
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
        views: apiBlog.views || 0
      } as Blog;
    },
    retry: false
  });

  const blog = blogQuery.data || null;

  useEffect(() => {
    setContentReady(false);
    if (!blog) return;
    const timer = setTimeout(() => setContentReady(true), 300);
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
  const breadcrumbItems = [
    { label: "Ana Səhifə", href: localePath("/") },
    { label: "Bloqlar", href: localePath("/blogs") },
    { label: blog.title, current: true },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: blogStyles }} />

      <DetailPageLayout
        backHref={localePath("/blogs")}
        backLabel={"Bloqlara Qayıt"}
        breadcrumbItems={breadcrumbItems}
        title={blog.title}
        metadata={
          <>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 sm:text-base">
                {blog.authorName && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                    <User className="h-4 w-4 text-primary" />
                    <div className="flex items-center">
                      {byPre && <span className="mr-1">{byPre}</span>}
                      {!blog.isAnonymous &&
                      blog.author &&
                      isValidObjectId(blog.author) ? (
                        <Link
                          href={`/profile/${blog.author}`}
                          className="font-semibold text-primary underline decoration-blue-200 underline-offset-2 transition-colors hover:text-blue-700"
                        >
                          {blog.authorName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-gray-900">
                          {blog.authorName}
                        </span>
                      )}
                      {byPost && <span className="ml-1">{byPost}</span>}
                    </div>
                  </div>
                )}

                {publishedDate && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                    <Calendar className="h-4 w-4 text-accent" />
                    <time className="font-medium">
                      {new Date(publishedDate).toLocaleDateString("az-AZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                )}

                {blog.views !== undefined && blog.views > 0 && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {blog.views.toLocaleString()} {"baxış"}
                    </span>
                  </div>
                )}
            </div>
            {blog._id &&
                blog.status === "approved" &&
                isValidObjectId(blog._id) && (
              <div className="mt-5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                <ViewTracker
                  itemId={blog._id}
                  itemType="blog"
                  initialViews={blog.views || 0}
                />
              </div>
            )}
          </>
        }
        mainContent={
          <>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="p-6 sm:p-10">
                <div className="blog-content prose prose-lg max-w-none text-base sm:text-lg">
                  {blog.content && typeof blog.content === "object" ? (
                    <BlocknoteReadOnly initialJSON={blog.content} />
                  ) : safeHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {blog.content || ""}
                    </div>
                  )}
                </div>
              </div>

              {!contentReady && (
                <div className="flex items-center justify-center border-t border-gray-100 py-12">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="text-sm text-gray-600">
                      {"Məzmun yüklənir..."}
                    </p>
                  </div>
                </div>
              )}

              {contentReady &&
                (blog._id || blog.id) &&
                blog.status === "approved" && (
                  <div className="border-t border-gray-200 bg-slate-50 px-6 py-6 sm:px-10">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Heart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">
                            {"Fikrin nədir?"}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {"Düşüncəni paylaş"}
                          </p>
                        </div>
                      </div>
                      <BlogReactions
                        blogId={blog._id || blog.id}
                        initialLikes={blog.likes || 0}
                        initialDislikes={blog.dislikes || 0}
                      />
                    </div>
                  </div>
                )}
            </div>
          </>
        }
        actionSection={
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                    <BookOpen className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {
                      "Sənin şəxsi təcrübələrin vacibdir. Öz yolunu, çətinliklərini və uğurlarını paylaşaraq başqalarına ilham ver və icmamızda mənalı dəyişikliklər yarat."
                    }
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <SaveButton itemId={blog._id || blog.id} itemType="blog" itemTitle={blog.title} size="md" />
                  <Link href={localePath("/blogs")}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      {"Bloqlara Qayıt"}
                    </Button>
                  </Link>
                  <Link href={localePath("/submit/blog/step1")}>
                    <Button className="w-full sm:w-auto">
                      {"Bloqunu Göndər"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
        }
      />
    </>
  );
}
