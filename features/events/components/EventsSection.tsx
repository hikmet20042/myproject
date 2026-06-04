"use client";

import { Calendar } from "lucide-react";
import EventRow from "@/features/events/components/EventRow";
import type { EventItem } from "@/features/events/types/items";
import EmptyState from "@/components/shared/EmptyState";

interface EventsSectionProps {
  events: EventItem[];
  filteredEvents: EventItem[];
  onRequestDelete: (event: EventItem) => void;
}

export default function EventsSection({
  events,
  filteredEvents,
  onRequestDelete,
}: EventsSectionProps) {
  if (filteredEvents.length === 0) {
    const hasNoEvents = events.length === 0
    return (
      <EmptyState
        variant="section"
        icon={Calendar}
        title="Tədbir tapılmadı"
        message={hasNoEvents ? 'Hələ heç bir tədbir yaratmamısınız' : "Uyğun tədbirləri görmək üçün filtrləri və ya axtarış sözlərini dəyişin."}
        helpText={hasNoEvents ? 'Tədbirlər auditoriyanızın fəaliyyətlərinizi görməsinə və xarici keçidlər vasitəsilə qoşulmasına kömək edir. İlk tədbirinizi paylaşmaq üçün yuxarıdakı tədbir yarat düyməsindən istifadə edin.' : undefined}
      />
    )
  }

  return (
    <div className="grid gap-4">
      {filteredEvents.map((event) => (
        <EventRow key={event._id} event={event} onRequestDelete={onRequestDelete} />
      ))}
    </div>
  );
}
