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
    <div className="min-h-screen bg-white">
      {/* Top spacing for fixed header */}
      <div className="pt-20" />

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Breadcrumb + Back Button */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-6 mb-8 flex-col sm:flex-row">
          <Breadcrumb items={breadcrumbItems} className="order-2 sm:order-1" />
          <ButtonLink
            href={backHref}
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            iconPosition="left"
            className="border-slate-200 hover:border-blue-200 gap-2 order-1 sm:order-2"
          >
            {backLabel}
          </ButtonLink>
        </nav>

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

        {/* Cover Image */}
        {coverImage && (
          <div className="mb-8 overflow-hidden rounded-xl shadow-sm">
            <div className="relative h-48 md:h-72 w-full">
              <Image
                src={coverImage}
                alt="Cover image"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-[1.15] text-slate-900 mb-6">
          {title}
        </h1>

        {/* Metadata Block */}
        {metadata && (
          <div className="border-b border-slate-200 pb-6 mb-10">
            {metadata}
          </div>
        )}

        {/* Content Area */}
        <div className="pb-16 md:pb-20">
          {hasSidebar ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
              <div className="lg:col-span-2 space-y-10">
                {mainContent}
              </div>
              <div className="space-y-6">
                {sidebar}
              </div>
            </div>
          ) : (
            <div className={`mx-auto ${contentMaxWidthClass} space-y-10`}>
              {mainContent}
            </div>
          )}

          {/* Action Section */}
          {actionSection && (
            <div className="mt-12 pt-10 border-t border-slate-200">
              {actionSection}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
