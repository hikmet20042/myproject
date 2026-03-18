"use client";

import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import VacancyRow from "@/features/vacancies/components/VacancyRow";
import type { VacancyItem } from "@/features/vacancies/components/types";

interface VacanciesListProps {
  vacancies: VacancyItem[];
  filteredVacancies: VacancyItem[];
  onRequestDelete: (vacancy: VacancyItem) => void;
}

export default function VacanciesList({
  vacancies,
  filteredVacancies,
  onRequestDelete,
}: VacanciesListProps) {
  if (filteredVacancies.length === 0) {
    return (
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <CardContent padding="md">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-blue-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No vacancies found</h3>
            <p className="mb-4 text-gray-600">
              {vacancies.length === 0
                ? "You haven't created any vacancies yet"
                : "Try changing filters or search terms to see matching vacancies."}
            </p>
            {vacancies.length === 0 && (
              <p className="mx-auto max-w-md text-sm text-slate-500">
                Vacancies make it easier for qualified candidates to find your opportunities.
                Use the Create Vacancy button above to publish your first role.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {filteredVacancies.map((vacancy) => (
        <VacancyRow
          key={vacancy._id}
          vacancy={vacancy}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </div>
  );
}
