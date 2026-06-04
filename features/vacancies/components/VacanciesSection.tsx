"use client";

import { Briefcase } from "lucide-react";
import VacancyRow from "@/features/vacancies/components/VacancyRow";
import type { VacancyItem } from "@/features/vacancies/types/items";
import EmptyState from "@/components/shared/EmptyState";

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
    const hasNoVacancies = vacancies.length === 0
    return (
      <EmptyState
        variant="section"
        icon={Briefcase}
        title="Vakansiya tapılmadı"
        message={hasNoVacancies ? 'Hələ heç bir vakansiya yaratmamısınız' : "Uyğun vakansiyaları görmək üçün filtrləri və ya axtarış sözlərini dəyişin."}
        helpText={hasNoVacancies ? 'Vakansiyalar uyğun namizədlərin imkanlarınızı daha asan tapmasına kömək edir. İlk vakansiyanızı paylaşmaq üçün yuxarıdakı vakansiya yarat düyməsindən istifadə edin.' : undefined}
      />
    )
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
