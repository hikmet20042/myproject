import type { ReactNode } from "react";
import Image from "next/image";
import Script from "next/script";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Breadcrumb, ButtonLink } from "@/components/ui";
import type { BreadcrumbItem } from "@/components/ui/Breadcrumb";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://icma360.org"

type DetailPageLayoutProps = {
  backHref: string;
  backLabel: string;
  breadcrumbItems: BreadcrumbItem[];
  title: ReactNode;
  metadata?: ReactNode;
  mainContent: ReactNode;
  actionSection?: ReactNode;
  sidebar?: ReactNode;
  contentMaxWidthClass?: string;
  pageType?: string;
  coverImage?: string;
};

export default function DetailPageLayout({
  backHref,
  backLabel,
  breadcrumbItems,
  title,
  metadata,
  mainContent,
  actionSection,
  sidebar,
  contentMaxWidthClass = "max-w-4xl",
  coverImage,
}: DetailPageLayoutProps) {
  const hasSidebar = Boolean(sidebar);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <section className="relative overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 z-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl z-0" />

        <div className="section-padding relative z-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <Breadcrumb items={breadcrumbItems} />
            </div>

            {/* JSON-LD BreadcrumbList */}
            <Script
              id="detail-page-breadcrumb-schema"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'BreadcrumbList',
                  itemListElement: breadcrumbItems.map((item, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    name: item.label,
                    item: item.href?.startsWith('http') ? item.href : `${siteUrl}${item.href || '/'}`,
                  })),
                }),
              }}
            />

            <ButtonLink
              href={backHref}
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              iconPosition="left"
              className="border-slate-200 hover:border-blue-200"
              shadow="sm"
            >
              {backLabel}
            </ButtonLink>

            {/* Cover image block placed above the title card */}
            {coverImage && (
              <div className="mt-6 mb-6 w-full overflow-hidden rounded-2xl shadow-lg">
                <div className="relative h-44 md:h-64 w-full">
                  <Image
                    src={coverImage}
                    alt="Cover image"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
                </div>
              </div>
            )}

            <Card className="mt-0 p-6 sm:p-8">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                {title}
              </h1>
              {metadata && <div className="mt-5">{metadata}</div>}
            </Card>
          </div>
        </div>
      </section>

      <section className="section-padding pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl">
          {hasSidebar ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
              <div className="lg:col-span-2 space-y-8">
                {mainContent}
                {actionSection}
              </div>
              <div className="space-y-8">{sidebar}</div>
            </div>
          ) : (
            <div className={`mx-auto ${contentMaxWidthClass} space-y-8`}>
              {mainContent}
              {actionSection}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
