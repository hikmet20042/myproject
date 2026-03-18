"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import BlocknoteEditor from "@/components/BlocknoteEditor";
import {
  ArrowLeft,
  Send,
  Eye,
  EyeOff,
  FileText,
  CheckCircle,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import { Input } from "@/components/ui/Input";
import {
  LoadingState,
  ProgressIndicator,
  SuccessState,
} from "@/components/shared";
import { useLocalizedPath } from "@/lib/useLocalizedPath";

interface Step2Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

function Step2Page({ searchParams }: Step2Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const localePath = useLocalizedPath();
  const urlSearchParams = useSearchParams();
  const editId = urlSearchParams?.get("edit");
  const [content, setContent] = useState<any>(null); // BlockNote JSON
  const [contentHtml, setContentHtml] = useState("");
  const [characterCount, setCharacterCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [authorName, setAuthorName] = useState("");
  const [showAuthorNameInput, setShowAuthorNameInput] = useState(false);
  const [init, setInit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push(localePath("/auth/signin"));
    }
  }, [status, session, router, localePath]);

  // Helper function to update character count in localStorage
  const updateCharacterCountInLocalStorage = useCallback((count: number) => {
    const savedDraft = localStorage.getItem("draftBlog");
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        parsedDraft.characterCount = count;
        localStorage.setItem("draftBlog", JSON.stringify(parsedDraft));
      } catch (error) {
        console.error("Error updating character count in localStorage:", error);
      }
    }
  }, []);

  // Helper function to calculate character count from content
  const calculateCharacterCountFromContent = useCallback(
    async (content: any) => {
      if (!content) {
        setCharacterCount(0);
        updateCharacterCountInLocalStorage(0);
        return;
      }

      try {
        // Create a temporary BlockNote editor to extract text from content
        const { BlockNoteEditor } = await import("@blocknote/core");
        const tempEditor = BlockNoteEditor.create();

        // Convert content to HTML then extract text
        const html = await tempEditor.blocksToFullHTML(content);
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const text = tempDiv.textContent || tempDiv.innerText || "";
        const count = text.length;
        setCharacterCount(count);
        updateCharacterCountInLocalStorage(count);
      } catch (error) {
        console.error("Error calculating character count:", error);
        // Fallback: try to extract text from content structure
        let text = "";
        if (Array.isArray(content)) {
          content.forEach((block: any) => {
            if (block.content && Array.isArray(block.content)) {
              block.content.forEach((item: any) => {
                if (item.text) text += item.text;
              });
            }
          });
        }
        const count = text.length;
        setCharacterCount(count);
        updateCharacterCountInLocalStorage(count);
      }
    },
    [updateCharacterCountInLocalStorage],
  );

  // Load functions - defined before useEffect hooks
  const loadBlogForEditing = useCallback(
    async (storyId: string) => {
      if (!session || status !== "authenticated") return;

      setLoading(true);
      try {
        const response = await fetch(`/api/blogs?id=${storyId}`);
        if (response.ok) {
          const data = await response.json();
          const blog = data.blog;

          if (blog) {
            setTitle(blog.title || "");
            setTags(Array.isArray(blog.tags) ? blog.tags : []);
            setIsAnonymous(
              blog.authorName === "Anonymous" || blog.authorName === "Anonim",
            );
            setAuthorName(blog.authorName || session.user.name || "");

            // Set content
            if (blog.content) {
              const loadedContent = Array.isArray(blog.content)
                ? blog.content
                : blog.content.blocks || [];
              setContent(loadedContent);
              calculateCharacterCountFromContent(loadedContent);
            }

            setContentHtml(blog.contentHtml || "");

            // Update localStorage
            const storyData = {
              title: blog.title || "",
              tags: Array.isArray(blog.tags) ? blog.tags.join(",") : "",
              isAnonymous:
                blog.authorName === "Anonymous" || blog.authorName === "Anonim",
              authorName: blog.authorName || session.user.name || "",
              content: blog.content || null,
              contentHtml: blog.contentHtml || "",
              characterCount: 0,
              editId: storyId,
            };
            localStorage.setItem("draftBlog", JSON.stringify(storyData));
          }
        }
      } catch (error) {
        console.error("Error loading blog for editing:", error);
      } finally {
        setLoading(false);
      }
    },
    [session, status, calculateCharacterCountFromContent],
  );

  // Check if we're editing
  useEffect(() => {
    if (editId) {
      setIsEditing(true);
      loadBlogForEditing(editId);
    }
  }, [editId, loadBlogForEditing]);

  // On mount, get data from searchParams or localStorage

  useEffect(() => {
    // Skip if we're editing (data will be loaded by loadBlogForEditing)
    if (editId) {
      setInit(true);
      return;
    }

    let t = searchParams?.title || "";
    let tg: string[] = Array.isArray(searchParams?.tags)
      ? searchParams.tags
      : typeof searchParams?.tags === "string"
        ? searchParams.tags.split(",").filter(Boolean)
        : [];
    let anon = searchParams?.isAnonymous === "true";
    let aName = "";
    let loadedContent = null;
    if (
      (!t || tg.length === 0 || typeof anon !== "boolean") &&
      typeof window !== "undefined"
    ) {
      const saved = localStorage.getItem("draftBlog");
      if (saved) {
        try {
          const d = JSON.parse(saved);
          if (d.title) t = d.title;
          if (d.tags)
            tg = Array.isArray(d.tags)
              ? (d.tags as string[])
              : typeof d.tags === "string"
                ? d.tags.split(",").filter(Boolean)
                : [];
          if (typeof d.isAnonymous === "boolean") anon = d.isAnonymous;
          if (typeof d.authorName === "string") aName = d.authorName;
          if (d.content) {
            loadedContent = Array.isArray(d.content)
              ? { blocks: d.content }
              : d.content;
          }
        } catch {}
      }
    }
    setTitle(typeof t === "string" ? t : "");
    setTags(tg);
    setIsAnonymous(anon);
    setAuthorName(aName);
    if (loadedContent) {
      // Blocknote expects an array of blocks, not an object
      if (
        loadedContent &&
        loadedContent.blocks &&
        Array.isArray(loadedContent.blocks)
      ) {
        setContent(loadedContent.blocks);
      } else if (Array.isArray(loadedContent)) {
        setContent(loadedContent);
      } else {
        setContent([]);
      }
      // Calculate character count from loaded content
      calculateCharacterCountFromContent(loadedContent.blocks || loadedContent);
    }
    setInit(true);
  }, [searchParams, editId, calculateCharacterCountFromContent]);

  // Show author name input if not anonymous and not logged in
  useEffect(() => {
    if (!isAnonymous) {
      setShowAuthorNameInput(!session || !session.user);
    } else {
      setShowAuthorNameInput(false);
    }
  }, [isAnonymous, session, status]);

  useEffect(() => {
    if (!init) return;
    if (!title) {
      router.push(localePath("/submit/blog/step1"));
    }
  }, [init, title, router, status, localePath]);

  if (status === "loading" || loading) {
    return <LoadingState text={"Yüklənir"} />;
  }

  const handleEditorChange = (json: any, html: string, text: string) => {
    setContent(json);
    setContentHtml(html);
    const count = text.length;
    setCharacterCount(count);
    updateCharacterCountInLocalStorage(count);
  };

  // Extract media from BlockNote JSON (images, embeds)
  const extractMedia = (
    json: any,
  ): Array<{ type: string; url: string; alt?: string }> => {
    if (!json || !json.blocks) return [];
    const media: Array<{ type: string; url: string; alt?: string }> = [];
    for (const block of json.blocks) {
      if (block.type === "image" && block.props?.url) {
        media.push({
          type: "image",
          url: block.props.url,
          alt: block.props.alt || "",
        });
      }
      if (block.type === "embed" && block.props?.url) {
        media.push({ type: "embed", url: block.props.url });
      }
    }
    return media;
  };

  const handleSubmit = async () => {
    // Robust content validation
    let isContentEmpty = false;
    if (typeof content === "string") {
      isContentEmpty = !content.trim();
    } else if (
      !content ||
      !JSON.stringify(content).trim() ||
      JSON.stringify(content).trim() === "{}"
    ) {
      isContentEmpty = true;
    }
    if (isContentEmpty) {
      setError("Göndərməzdən əvvəl zəhmət olmasa məzmun əlavə edin");
      return;
    }
    if (characterCount < 100) {
      setError("Bloqunuz ən azı 100 simvoldan ibarət olmalıdır");
      return;
    }
    if (
      !isAnonymous &&
      showAuthorNameInput &&
      (!authorName || !authorName.trim())
    ) {
      setError(
        "Zəhmət olmasa adınızı daxil edin və ya anonim göndərməyi seçin",
      );
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "blog",
          title,
          content, // BlockNote JSON
          contentHtml,
          tags: Array.isArray(tags) ? tags : [],
          isAnonymous,
          authorName:
            !isAnonymous && showAuthorNameInput ? authorName : undefined,
          media: extractMedia(content),
        }),
      });
      if (response.ok) {
        // Clear localStorage after successful submission
        localStorage.removeItem("draftBlog");
        localStorage.removeItem("currentBlogEditId");

        setSuccess(true);
        setTimeout(() => {
          router.push(localePath("/profile"));
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Bloq göndərmək alınmadı");
      }
    } catch (error) {
      console.error("Error submitting blog:", error);
      setError("Göndərmə zamanı xəta baş verdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!init) {
    return <LoadingState text="Redaktor yüklənir..." />;
  }

  if (success) {
    return (
      <SuccessState
        title={"Bloqunuz uğurla göndərildi!"}
        message={
          "Bloqunuz nəzərdən keçirilməsi üçün göndərildi. Təsdiq olunduqda bildiriş alacaqsınız."
        }
        gradientFrom="from-green-50"
        gradientVia="via-emerald-50"
        gradientTo="to-teal-50"
        actions={
          <>
            <ButtonLink
              href={localePath("/profile")}
              variant="gradient-green"
              hoverEffect="scale"
            >
              Profilimə bax
            </ButtonLink>
            <ButtonLink
              href={localePath("/blogs")}
              variant="secondary"
              hoverEffect="scale"
            >
              Bloqlara bax
            </ButtonLink>
          </>
        }
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[440px] w-[760px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={2} totalSteps={2} percentage={100} />

        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-fade-in animation-delay-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
                {"Bloqunuzu Yazın"}
              </h1>
              <p className="mt-2 text-base text-gray-600">
                {"Şəxsi təcrübənizi və ya icma bloqunuzu paylaşın"}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                // Save current state to localStorage before going back
                if (typeof window !== "undefined") {
                  const saved = localStorage.getItem("draftBlog");
                  const base = saved ? JSON.parse(saved) : {};
                  const updatedDraft = {
                    ...base,
                    title,
                    tags,
                    isAnonymous,
                    authorName,
                    content,
                    contentHtml,
                    characterCount,
                    ...(editId && { editId }),
                  };
                  localStorage.setItem(
                    "draftBlog",
                    JSON.stringify(updatedDraft),
                  );
                }
                const backUrl = editId
                  ? `/submit/blog/step1?edit=${editId}`
                  : "/submit/blog/step1";
                router.push(backUrl);
              }}
              className="inline-flex items-center px-4 py-2.5 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {"Geri"}
            </Button>
          </div>
        </div>

        {/* Blog Details Card */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-fade-in animation-delay-400">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            {"Bloq Təfərrüatları"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {"Bloq Başlığı *"}
              </label>
              <p className="text-base font-semibold text-gray-900">{title}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {"Müəllif"}
              </label>
              {isAnonymous ? (
                <p className="text-base font-semibold text-gray-900">
                  {"Anonim"}
                </p>
              ) : showAuthorNameInput ? (
                <Input
                  type="text"
                  className="mt-1 block w-full focus:border-blue-500 focus:ring-blue-100 text-base"
                  placeholder={
                    "Adınızı daxil edin (və ya profil adınızı istifadə etmək üçün boş saxlayın)"
                  }
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              ) : (
                <p className="text-base font-semibold text-gray-900">
                  {authorName || session?.user?.name || "İcma Üzvü"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Editor Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-fade-in animation-delay-600">
          <div className="border-b border-gray-200 bg-slate-50 px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                {"Bloq Məzmunu"}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-semibold text-gray-700">
                    {characterCount} {"simvol"}
                  </span>
                </div>
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant="secondary"
                  size="sm"
                  className="hover:scale-105 transition-transform"
                >
                  {showPreview ? (
                    <EyeOff className="w-4 h-4 mr-2" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  {showPreview ? "Önizləməni gizlət" : "Önizləməni göstər"}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 min-h-[400px]">
            {showPreview ? (
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
              </div>
            ) : (
              <BlocknoteEditor
                key={title || "empty"}
                initialJSON={content}
                onChange={handleEditorChange}
                context="blog"
              />
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 animate-shake">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in animation-delay-800">
          <div className="text-sm text-gray-600 order-2 sm:order-1">
            {characterCount < 100 && (
              <span className="text-amber-600 font-semibold">
                Minimum 100 simvol tələb olunur ({100 - characterCount} simvol
                qalıb)
              </span>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (typeof content === "string" && (!content || !content.trim())) ||
              (typeof content !== "string" &&
                (!content ||
                  !JSON.stringify(content).trim() ||
                  JSON.stringify(content).trim() === "{}")) ||
              characterCount < 100
            }
            variant="gradient-blue"
            loading={isSubmitting}
            size="lg"
            icon={Send}
            iconPosition="left"
            shadow="lg"
            hoverEffect="scale"
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isSubmitting ? "Göndərilir..." : "Bloqu Göndər"}
          </Button>
        </div>

        {/* Guidelines */}
        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 animate-fade-in animation-delay-1000">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            {"Bloq Qaydaları"}
          </h3>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-3 text-sm text-blue-800">
              <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-blue-700" />
              </span>
              <span>
                {
                  "Sosial ədalət və bərabərliklə bağlı şəxsi təcrübələri, çətinlikləri və ya qələbələri paylaşın"
                }
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-blue-800">
              <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-blue-700" />
              </span>
              <span>{"Nəzakətli və konstruktiv olun"}</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-blue-800">
              <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-blue-700" />
              </span>
              <span>{"Minimum 100 simvol tələb olunur"}</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-blue-800">
              <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-blue-700" />
              </span>
              <span>{"Bloqunuz dərc olunmazdan əvvəl yoxlanılacaq"}</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-blue-800">
              <span className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-blue-700" />
              </span>
              <span>{"Anonim qalmağı seçə bilərsiniz"}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Step2PageWrapper({ searchParams }: Step2Props) {
  const localePath = useLocalizedPath();
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Yüklənir...</div>
        </div>
      }
    >
      <Step2Page searchParams={searchParams} />
    </Suspense>
  );
}
