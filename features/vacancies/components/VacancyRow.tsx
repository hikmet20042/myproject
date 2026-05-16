"use client";

import Link from "next/link";
import {
  MapPin,
  DollarSign,
  Users,
  Bookmark,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useLocalizedPath } from "@/hooks/useLocalizedPath";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { VacancyItem } from "@/features/vacancies/types/items";

interface VacancyRowProps {
  vacancy: VacancyItem;
  onRequestDelete: (vacancy: VacancyItem) => void;
}

export default function VacancyRow({ vacancy, onRequestDelete }: VacancyRowProps) {
  const localePath = useLocalizedPath();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge
            variant="success"
            className="border border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            {"Təsdiqlənib"}
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="danger"
            className="border border-red-200 bg-red-50 text-red-700"
          >
            {"Rədd edilib"}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="warning"
            className="border border-amber-200 bg-amber-50 text-amber-700"
          >
            {"Gözləmədə"}
          </Badge>
        );
    }
  };

  const status = vacancy.status || "pending";
  const paymentLabel = !vacancy.isPaid
    ? "Ödənişsiz"
    : vacancy.paymentMode === "fixed"
      ? `${vacancy.paymentAmount || 0} AZN`
      : `${vacancy.paymentMin || 0} - ${vacancy.paymentMax || 0} AZN`;

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardContent padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{vacancy.title}</h3>
              {getStatusIcon(status)}
              {getStatusBadge(status)}
            </div>

            <p className="mb-3 line-clamp-2 text-gray-600">{vacancy.description}</p>

            <div className="mb-3 grid grid-cols-1 gap-3 text-sm text-gray-500 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-cyan-500" />
                <span>{vacancy.city}{vacancy.address ? `, ${vacancy.address}` : ""}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span>{paymentLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-500" />
                <span>
                  {"Son tarix"}: {new Date(vacancy.applicationDeadline).toLocaleDateString()}
                </span>
              </div>
              {typeof vacancy.views === 'number' && vacancy.views > 0 && (
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-violet-500" />
                  <span>
                    {vacancy.views.toLocaleString()} baxış
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Bookmark className="h-4 w-4 text-amber-500" />
                <span>{(vacancy.saves || 0).toLocaleString()} saxlama</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="border border-blue-200 bg-blue-50 text-blue-700"
              >
                {vacancy.type}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:ml-4">
            <Link href={localePath(`/resources/vacancies/${vacancy.slug}`)}>
              <Button
                variant="ghost"
                size="sm"
                icon={Eye}
                title={"Vakansiyaya bax"}
                className="rounded-xl hover:border-blue-200 hover:bg-blue-50"
              />
            </Link>
            <Link href={localePath(`/dashboard/vacancies/${vacancy.slug}/edit`)}>
              <Button
                variant="ghost"
                size="sm"
                icon={Edit}
                title={"Vakansiyanı redaktə et"}
                className="rounded-xl hover:border-cyan-200 hover:bg-cyan-50"
              />
            </Link>
            <Button
              onClick={() => onRequestDelete(vacancy)}
              variant="ghost"
              size="sm"
              icon={Trash2}
              title={"Vakansiyanı sil"}
              className="rounded-xl text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
