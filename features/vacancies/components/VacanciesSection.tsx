"use client";

import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import VacancyRow from "@/features/vacancies/components/VacancyRow";
import type { VacancyItem } from "@/features/vacancies/types/items";

interface VacanciesSectionProps {
  vacancies: VacancyItem[];
  filteredVacancies: VacancyItem[];
  onRequestDelete: (vacancy: VacancyItem) => void;
}

export default function VacanciesSection({
  vacancies,
  filteredVacancies,
  onRequestDelete,
}: VacanciesSectionProps) {
  if (filteredVacancies.length === 0) {
    return (
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <CardContent padding="md">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-blue-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">Vakansiya tapılmadı</h3>
            <p className="mb-4 text-gray-600">
              {vacancies.length === 0
                ? 'Hələ heç bir vakansiya yaratmamısınız'
                : 'Uyğun vakansiyaları görmək üçün filtrləri və ya axtarış sözlərini dəyişin.'}
            </p>
            {vacancies.length === 0 && (
              <p className="mx-auto max-w-md text-sm text-slate-500">
                Vakansiyalar uyğun namizədlərin imkanlarınızı daha asan tapmasına kömək edir.
                İlk vakansiyanızı paylaşmaq üçün yuxarıdakı vakansiya yarat düyməsindən istifadə edin.
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
