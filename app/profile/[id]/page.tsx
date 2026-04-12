"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExternalLink, Mail, MapPin, NotebookPen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";

interface User {
  _id: string;
  name: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  joinedAt: string;
}

interface Blog {
  _id: string;
  title: string;
  abstract?: string;
  createdAt: string;
  category?: string;
}

function normalizeBlogPayload(payload: any): Blog[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.blogs)) return payload.blogs;
  if (Array.isArray(payload?.results?.blogs)) return payload.results.blogs;

  const firstArray = Object.values(payload || {}).find((value) => Array.isArray(value));
  return Array.isArray(firstArray) ? (firstArray as Blog[]) : [];
}

export default function PublicProfilePage() {
  const localePath = useLocalizedPath();
  const router = useRouter();
  const params = useParams();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [user, setUser] = useState<User | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!profileId) {
        setError("Profil identifikatoru tapılmadı.");
        setIsLoading(false);
        return;
      }

      try {
        const userResponse = await fetch(`/api/users/${profileId}`);
        if (!userResponse.ok) {
          throw new Error("İstifadəçi tapılmadı");
        }

        const userData = await userResponse.json();
        setUser(userData?.user ? userData.user : userData);

        const blogsResponse = await fetch(`/api/blogs?author=${profileId}`);
        if (blogsResponse.ok) {
          const blogsData = await blogsResponse.json();
          setBlogs(normalizeBlogPayload(blogsData));
        } else {
          setBlogs([]);
        }
      } catch {
        setError("İstifadəçi profili yüklənmədi");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUserData();
  }, [profileId]);

  const joinedDate = useMemo(() => {
    if (!user?.joinedAt) return "Naməlum";
    return new Date(user.joinedAt).toLocaleDateString("az-AZ", {
      year: "numeric",
      month: "long",
    });
  }, [user?.joinedAt]);

  if (isLoading) {
    return <LoadingState text="Profil yüklənir..." />;
  }

  if (error || !user) {
    return (
      <ErrorState
        title="Profil tapılmadı"
        message={error || "Sorğu edilən profil tapılmadı."}
        retryText="Ana səhifəyə qayıt"
        onRetry={() => router.replace(localePath("/"))}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <section className="section-padding py-14 md:py-20">
        <div className="mx-auto max-w-5xl space-y-8">
          <Card className="border-slate-200 bg-white/90 shadow-sm backdrop-blur">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-semibold text-white">
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{user.name || "Naməlum istifadəçi"}</h1>
                    <p className="mt-1 text-sm text-slate-600">Platformada {joinedDate} tarixindən aktivdir</p>
                    {user.location && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin className="h-4 w-4" />
                        {user.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.email && (
                    <ButtonLink href={`mailto:${user.email}`} variant="secondary">
                      <Mail className="mr-1.5 h-4 w-4" />
                      Əlaqə
                    </ButtonLink>
                  )}
                  {user.website && (
                    <ButtonLink
                      href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                      variant="outline"
                      external
                    >
                      <ExternalLink className="mr-1.5 h-4 w-4" />
                      Vebsayt
                    </ButtonLink>
                  )}
                </div>
              </div>

              {user.bio && <p className="mt-6 border-t border-slate-100 pt-6 leading-relaxed text-slate-700">{user.bio}</p>}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">Bloqlar</h2>
                  <Badge className="bg-slate-100 text-slate-700">{blogs.length}</Badge>
                </div>

                {blogs.length === 0 ? (
                  <EmptyState title="Bloq tapılmadı" message="Bu istifadəçi hələ bloq paylaşmayıb." />
                ) : (
                  <div className="space-y-4">
                    {blogs.map((blog) => (
                      <article key={blog._id} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
                        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                          {blog.category ? <Badge className="bg-slate-100 text-slate-700">{blog.category}</Badge> : null}
                          <span>{new Date(blog.createdAt).toLocaleDateString("az-AZ")}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          <Link href={localePath(`/blogs/${blog._id}`)} className="hover:text-slate-700">
                            {blog.title}
                          </Link>
                        </h3>
                        {blog.abstract ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{blog.abstract}</p> : null}
                        <Link href={localePath(`/blogs/${blog._id}`)} className="mt-3 inline-flex items-center text-sm font-medium text-slate-800 hover:text-slate-600">
                          Oxumağa davam et
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profil məlumatı</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-slate-500">Bloqlar</span>
                      <span className="font-medium text-slate-900">{blogs.length}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-slate-500">Qoşulub</span>
                      <span className="font-medium text-slate-900">{joinedDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {user.socialMedia && Object.values(user.socialMedia).some(Boolean) ? (
                <Card className="border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sosial hesablar</h3>
                    <div className="mt-4 space-y-2">
                      {user.socialMedia.twitter ? (
                        <a href={user.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                          Twitter
                        </a>
                      ) : null}
                      {user.socialMedia.linkedin ? (
                        <a href={user.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                          LinkedIn
                        </a>
                      ) : null}
                      {user.socialMedia.github ? (
                        <a href={user.socialMedia.github} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                          GitHub
                        </a>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <Link href={localePath("/blogs")} className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50">
                <NotebookPen className="mr-2 h-4 w-4" />
                Bütün bloqlara bax
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
