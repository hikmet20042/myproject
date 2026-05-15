"use client";

import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import EventRow from "@/features/events/components/EventRow";
import type { EventItem } from "@/features/events/types/items";

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
    return (
      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        <CardContent padding="md">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-blue-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">Tədbir tapılmadı</h3>
            <p className="mb-4 text-gray-600">
              {events.length === 0
                ? 'Hələ heç bir tədbir yaratmamısınız'
                : 'Uyğun tədbirləri görmək üçün filtrləri və ya axtarış sözlərini dəyişin.'}
            </p>
            {events.length === 0 && (
              <p className="mx-auto max-w-md text-sm text-slate-500">
                Tədbirlər auditoriyanızın fəaliyyətlərinizi görməsinə və xarici keçidlər vasitəsilə qoşulmasına kömək edir.
                İlk tədbirinizi paylaşmaq üçün yuxarıdakı tədbir yarat düyməsindən istifadə edin.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {filteredEvents.map((event) => (
        <EventRow key={event._id} event={event} onRequestDelete={onRequestDelete} />
      ))}
    </div>
  );
}
