"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Briefcase, Plus, Search } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useLocalizedPath } from "@/lib/useLocalizedPath";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/shared";
import { Alert } from "@/components/feedback";
import VacanciesList from "@/features/vacancies/components/VacanciesList";
import VacancyDeleteDialog from "@/features/vacancies/components/VacancyDeleteDialog";
import type { VacancyItem } from "@/features/vacancies/components/types";
import {
  statusOptions,
  categoryOptions,
  compensationOptions,
} from "@/features/vacancies/components/types";

export default function VacanciesPageContainer() {
  const { data: session, status } = useSession();
  const sessionUserId = session?.user?.id ?? null;
  const accountType = session?.user?.accountType;
  const isOrganizationAccount = accountType === "organization";
  const isApprovedKnown = session?.user?.isApprovedOrganization !== undefined;
  const isApprovedOrganization = session?.user?.isApprovedOrganization === true;
  const router = useRouter();
  const routerRef = useRef(router);
  const localePath = useLocalizedPath();
  const signInPath = localePath("/auth/signin");
  const homePath = localePath("/");
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [compensationFilter, setCompensationFilter] = useState("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vacancyToDelete, setVacancyToDelete] = useState<VacancyItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackVariant, setFeedbackVariant] = useState<"success" | "error">("success");

  useEffect(() => {
    setMounted(true);
    console.debug("[vacancies-page] mount", { userId: sessionUserId });
    return () => {
      console.debug("[vacancies-page] unmount", { userId: sessionUserId });
    };
    // Mount-only lifecycle debug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      console.debug("[auth-guard][vacancies] redirect -> signin", { status });
      routerRef.current.replace(signInPath);
      return;
    }

    if (status === "authenticated" && !sessionUserId) {
      console.debug("[auth-guard][vacancies] authenticated but userId not ready");
      return;
    }

    if (status === "authenticated" && accountType === undefined) {
      console.debug("[auth-guard][vacancies] authenticated but accountType not ready", {
        userId: sessionUserId,
      });
      return;
    }

    if (status === "authenticated" && !isOrganizationAccount) {
      console.debug("[auth-guard][vacancies] redirect -> home (non-organization account)", {
        userId: sessionUserId,
        accountType,
      });
      routerRef.current.replace(homePath);
      return;
    }

    if (status === "authenticated" && !isApprovedKnown) {
      console.debug("[auth-guard][vacancies] authenticated but approval state not ready", {
        userId: sessionUserId,
      });
      return;
    }

    if (status === "authenticated" && isApprovedOrganization === false) {
      console.debug("[auth-guard][vacancies] redirect -> home (not approved org)", {
        userId: sessionUserId,
      });
      routerRef.current.replace(homePath);
      return;
    }

    console.debug("[auth-guard][vacancies] ready", {
      userId: sessionUserId,
      status,
      accountType,
      isApprovedOrganization,
    });
    console.debug("[vacancies-page] fetch trigger", { reason: "guard-ready" });
    fetchVacancies();
  }, [accountType, homePath, isApprovedKnown, isApprovedOrganization, isOrganizationAccount, sessionUserId, signInPath, status, mounted]);

  const fetchVacancies = async () => {
    try {
      console.debug("[vacancies-page] fetch vacancies request");
      setLoading(true);
      const response = await fetch(`/api/vacancies?author=me`);
      if (response.ok) {
        const data = await response.json();
        setVacancies(data.vacancies || data);
      }
    } catch (error) {
      console.error("Error fetching vacancies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = (vacancy: VacancyItem) => {
    setFeedbackMessage(null);
    setVacancyToDelete(vacancy);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!vacancyToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/vacancies/${vacancyToDelete._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVacancies(vacancies.filter((v) => v._id !== vacancyToDelete._id));
        setFeedbackVariant("success");
        setFeedbackMessage("Vacancy deleted successfully.");
        setDeleteModalOpen(false);
        setVacancyToDelete(null);
      } else {
        console.error("Failed to delete vacancy");
        setFeedbackVariant("error");
        setFeedbackMessage("Could not delete the vacancy. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting vacancy:", error);
      setFeedbackVariant("error");
      setFeedbackMessage("Something went wrong while deleting the vacancy.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredVacancies = vacancies.filter((vacancy) => {
    const matchesSearch =
      vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacancy.description.toLowerCase().includes(searchTerm.toLowerCase());

    const status = vacancy.status || "pending";
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || vacancy.category === categoryFilter;
    const matchesCompensation =
      compensationFilter === "all" ||
      vacancy.compensation.type === compensationFilter;

    return (
      matchesSearch && matchesStatus && matchesCategory && matchesCompensation
    );
  });

  if (status === "loading" || loading) {
    return <Loading />;
  }

  if (
    status === "authenticated" &&
    accountType !== undefined &&
    !isOrganizationAccount
  ) {
    return (
      <ErrorState
        title={"Giriş Qadağandır"}
        message={"Bu səhifəyə daxil olmaq üçün təşkilat hesabı tələb olunur."}
        onRetry={() => routerRef.current.replace(homePath)}
        retryText={"Ana səhifəyə qayıt"}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
    );
  }

  if (
    status === "authenticated" &&
    isApprovedKnown &&
    isApprovedOrganization === false
  ) {
    return (
      <ErrorState
        title={"Giriş Qadağandır"}
        message={"Bu səhifəyə daxil olmaq üçün təsdiqlənmiş təşkilat olmalısınız."}
        onRetry={() => routerRef.current.replace(homePath)}
        retryText={"Ana səhifəyə qayıt"}
        gradientFrom="from-red-50"
        gradientVia="via-orange-50"
        gradientTo="to-yellow-50"
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-100 text-cyan-700">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Your Vacancies</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage and track the vacancies you've published.
            </p>
          </div>
        </div>
        <Link href={localePath("/dashboard/vacancies/create")}>
          <Button variant="primary" size="sm" icon={Plus} className="rounded-xl">
            Create Vacancy
          </Button>
        </Link>
      </header>

      {feedbackMessage && (
        <Alert
          variant={feedbackVariant}
          dismissible
          onDismiss={() => setFeedbackMessage(null)}
        >
          {feedbackMessage}
        </Alert>
      )}

      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <CardContent padding="md" className="bg-white">
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Filters
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <Input
                placeholder={"Vakansiya adı və ya təşkilat adı axtar."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="indigo"
                className="h-12 border-blue-100 bg-white pl-10"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder={"Statusa görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
            />
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder={"Kateqoriyaya görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
            />
            <Select
              options={compensationOptions}
              value={compensationFilter}
              onChange={(e) => setCompensationFilter(e.target.value)}
              placeholder={"Ödənişə görə filtr"}
              variant="indigo"
              className="h-12 border-blue-100 bg-white"
            />
          </div>
        </CardContent>
      </Card>

      <VacanciesList
        vacancies={vacancies}
        filteredVacancies={filteredVacancies}
        onRequestDelete={handleDeleteRequest}
      />

      <VacancyDeleteDialog
        isOpen={deleteModalOpen}
        vacancyToDelete={vacancyToDelete}
        deleting={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirmDelete={confirmDelete}
      />
    </div>
  );
}
