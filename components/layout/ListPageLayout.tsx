import type { LucideIcon } from "lucide-react";
import { Sparkles, BookOpen, Calendar, Briefcase, Users, FileText, Search, Link } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { ReactNode } from "react";
import { PageStateGuard } from "@/components/shared";

type ListPageLayoutProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  pageType?: 'blog' | 'event' | 'vacancy' | 'organization' | 'material';
  headerBadgeText?: string;
  headerActions?: ReactNode;
  filterSection?: ReactNode;
  content: ReactNode;
  bottomCta?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  loadingTitle?: string;
  loadingText?: string;
  errorTitle?: string;
  errorMessage?: string;
  retryText?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  contentContainerClassName?: string;
  filterContainerClassName?: string;
};

export default function ListPageLayout({
  title,
  description,
  icon: HeaderIcon = Sparkles,
  pageType = 'blog',
  headerBadgeText,
  headerActions,
  filterSection,
  content,
  bottomCta,
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingTitle,
  loadingText,
  errorTitle,
  errorMessage,
  retryText,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyActionText,
  onEmptyAction,
  contentContainerClassName = "max-w-[1400px] mx-auto",
  filterContainerClassName = "max-w-5xl mx-auto",
}: ListPageLayoutProps) {

  // Theme configuration based on pageType
  const themes = {
    blog: {
      blob1: 'bg-amber-200/40',
      blob2: 'bg-orange-200/30',
      headerBg: 'bg-amber-50/30',
      badgeBg: 'bg-amber-100/80',
      badgeText: 'text-amber-700',
    },
    event: {
      blob1: 'bg-purple-200/40',
      blob2: 'bg-pink-200/30',
      headerBg: 'bg-purple-50/30',
      badgeBg: 'bg-purple-100/80',
      badgeText: 'text-purple-700',
    },
    vacancy: {
      blob1: 'bg-blue-200/40',
      blob2: 'bg-cyan-200/30',
      headerBg: 'bg-blue-50/30',
      badgeBg: 'bg-blue-100/80',
      badgeText: 'text-blue-700',
    },
    organization: {
      blob1: 'bg-emerald-200/40',
      blob2: 'bg-teal-200/30',
      headerBg: 'bg-emerald-50/30',
      badgeBg: 'bg-emerald-100/80',
      badgeText: 'text-emerald-700',
    },
    material: {
      blob1: 'bg-indigo-200/40',
      blob2: 'bg-violet-200/30',
      headerBg: 'bg-indigo-50/30',
      badgeBg: 'bg-indigo-100/80',
      badgeText: 'text-indigo-700',
    }
  }[pageType];

  // Illustration Renderer based on pageType
  const renderIllustration = () => {
    switch (pageType) {
      case 'blog':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute w-40 h-56 bg-white rounded-2xl shadow-xl border border-slate-100 -rotate-6 translate-x-4 translate-y-4" />
            <div className="absolute w-40 h-56 bg-white rounded-2xl shadow-xl border border-slate-100 rotate-3 translate-x-2" />
            <div className="relative w-40 h-56 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col p-6 items-center justify-center group-hover:scale-105 transition-transform duration-500">
               <FileText className="h-16 w-16 text-amber-500 mb-4" />
               <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-2" />
               <div className="w-20 h-1.5 bg-slate-50 rounded-full mb-2" />
               <div className="w-16 h-1.5 bg-slate-50 rounded-full" />
            </div>
          </div>
        )
      case 'event':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-purple-100/50 rounded-full blur-3xl animate-pulse" />
            <div className="relative h-48 w-48 rounded-[2.5rem] bg-white shadow-2xl border border-slate-100 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-500">
               <Calendar className="h-20 w-20 text-purple-600" />
               <div className="absolute -top-2 -right-2 h-10 w-10 rounded-xl bg-pink-500 shadow-lg flex items-center justify-center animate-bounce">
                  <Sparkles className="h-5 w-5 text-white" />
               </div>
            </div>
            <div className="absolute bottom-4 -left-4 h-12 w-12 rounded-full bg-indigo-100 border-4 border-white shadow-md animate-pulse" />
          </div>
        )
      case 'vacancy':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute w-64 h-64 border-2 border-dashed border-blue-200 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="relative h-52 w-52 rounded-3xl bg-white shadow-2xl border border-slate-100 flex items-center justify-center -rotate-6 group-hover:scale-110 transition-all duration-500">
               <Briefcase className="h-24 w-24 text-blue-600" />
               <div className="absolute -bottom-4 -right-4 h-14 w-14 rounded-2xl bg-cyan-400 shadow-xl flex items-center justify-center border-4 border-white">
                  <Search className="h-6 w-6 text-white" />
               </div>
            </div>
          </div>
        )
      case 'organization':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-emerald-100" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-emerald-50" />
            <div className="relative h-44 w-44 rounded-full bg-white shadow-2xl border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-all duration-700">
               <Users className="h-16 w-16 text-emerald-600" />
            </div>
            {/* Small floating circles */}
            <div className="absolute top-10 right-10 h-8 w-8 rounded-full bg-teal-100 border-2 border-white shadow-sm" />
            <div className="absolute bottom-10 left-10 h-10 w-10 rounded-full bg-emerald-50 border-2 border-white shadow-sm" />
          </div>
        )
      case 'material':
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative h-48 w-40 rounded-tr-[3rem] rounded-bl-[3rem] bg-white shadow-2xl border border-slate-100 flex items-center justify-center transform rotate-6 group-hover:rotate-0 transition-all duration-500">
               <BookOpen className="h-20 w-20 text-indigo-600" />
            </div>
            <div className="absolute -bottom-2 -left-8 h-12 w-24 bg-white rounded-full shadow-lg border border-slate-50 flex items-center justify-center gap-2">
               <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
               <span className="text-[10px] font-black text-slate-400 uppercase">PDF / DOC</span>
            </div>
          </div>
        )
      default:
        return <HeaderIcon className="h-24 w-24 text-blue-600" />;
    }
  };

  return (
    <PageStateGuard
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      loadingTitle={loadingTitle}
      loadingText={loadingText}
      errorTitle={errorTitle}
      errorMessage={errorMessage}
      retryText={retryText}
      onRetry={onRetry}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      emptyActionText={emptyActionText}
      onEmptyAction={onEmptyAction}
    >
      <div className="min-h-screen bg-slate-50 text-slate-900 relative font-sans">
        {/* Subtle Background Decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className={`absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full ${themes.blob1} opacity-40 blur-[120px] animate-blob`} />
          <div className={`absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full ${themes.blob2} opacity-30 blur-[100px] animate-blob animation-delay-2000`} />
        </div>

        {/* Header Section */}
        <section className={`relative z-10 pt-32 pb-24 md:pt-44 md:pb-32 overflow-hidden border-b border-slate-200 ${themes.headerBg}`}>

          <div className="container relative z-10 mx-auto px-4">
            <div className="grid lg:grid-cols-[1fr_auto] gap-16 items-center">
              <div className="max-w-3xl text-center lg:text-left">
                <Badge variant="primary" size="md" icon={HeaderIcon} className={`border border-slate-100 ${themes.badgeBg} px-5 py-2.5 text-[10px] font-black ${themes.badgeText} uppercase tracking-[0.3em] mb-8 shadow-sm backdrop-blur-md`}>
                  {headerBadgeText || title}
                </Badge>

                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.95] mb-8 drop-shadow-sm">
                  {title}
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {description}
                </p>

                {headerActions && (
                  <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                    {headerActions}
                  </div>
                )}
              </div>

              {/* Right Side Decorative Elements - Page Specific */}
              <div className="hidden lg:flex relative h-[450px] w-[450px] items-center justify-center group">
                 {renderIllustration()}
              </div>
            </div>
          </div>
        </section>

        {filterSection && (
          <section className="relative z-10 py-16 bg-slate-50 border-b border-slate-200">
            <div className="container mx-auto px-4">
               <div className={filterContainerClassName}>{filterSection}</div>
            </div>
          </section>
        )}

        <section className="relative z-10 py-24 lg:py-40">
          <div className="container mx-auto px-4">
            <div className={contentContainerClassName}>{content}</div>
          </div>
        </section>

        {bottomCta && (
          <section className="relative z-10 py-32 bg-slate-900 text-white overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto">{bottomCta}</div>
            </div>
          </section>
        )}
      </div>
    </PageStateGuard>
  );
}
