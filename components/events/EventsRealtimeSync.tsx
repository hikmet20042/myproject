"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { eventQueryKeys } from "@/lib/eventQueries";
import { mapEventToResponse } from "@/lib/events/mapEventToResponse";
import { useSession } from "@/lib/auth/client";

const getId = (value: any) => value?._id || value?.id || null;
const realtimeRequiredKeys = [
  "id",
  "title",
  "description",
  "event_type",
  "event_date",
  "status",
  "is_published",
  "updated_at",
];

const isPartialRealtimeRow = (row: any) => {
  if (!row || typeof row !== "object") {
    return true;
  }

  return realtimeRequiredKeys.some((key) => !(key in row));
};

const isOwnerEvent = (event: any, userId: string) => {
  if (!event || !userId) {
    return false;
  }
  return event?.createdBy?._id === userId || event?.createdByOrganization?._id === userId;
};

const isEventPublished = (event: any) => event?.isPublished === true;

export default function EventsRealtimeSync() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    const viewerRole = session?.user?.role || "user";
    const viewerId = session?.user?.id || "";
    const canViewAll = viewerRole === "admin";
    const isRelevantForViewer = (event: any) => {
      if (!event) {
        return false;
      }
      if (canViewAll) {
        return true;
      }
      return isOwnerEvent(event, viewerId) || isEventPublished(event);
    };

    const channel = supabase
      .channel("events-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          const normalizedNew = newRow?.id ? mapEventToResponse(newRow) : null;
          const normalizedOld = oldRow?.id ? mapEventToResponse(oldRow) : null;
          const eventId = String(normalizedNew?.id || normalizedOld?.id || "");
          if (!eventId) {
            return;
          }
          const wasRelevant = isRelevantForViewer(normalizedOld);
          const isRelevant = isRelevantForViewer(normalizedNew);
          const shouldProcess = payload.eventType === "DELETE" ? wasRelevant : isRelevant || wasRelevant;
          if (!shouldProcess) {
            return;
          }

          if (payload.eventType === "DELETE" || (wasRelevant && !isRelevant)) {
            queryClient.setQueriesData({ queryKey: eventQueryKeys.all }, (old: any) => {
              if (!Array.isArray(old)) {
                return old;
              }
              return old.filter((event) => getId(event) !== eventId);
            });
            queryClient.removeQueries({ queryKey: eventQueryKeys.detail(eventId) });
          } else {
            if (!normalizedNew) {
              return;
            }

            queryClient.setQueryData(eventQueryKeys.detail(eventId), (previous: any) => {
              if (!previous) {
                return normalizedNew;
              }
              return {
                ...previous,
                ...normalizedNew,
                createdBy: previous.createdBy?._id ? previous.createdBy : normalizedNew.createdBy,
                createdByOrganization: previous.createdByOrganization?._id
                  ? previous.createdByOrganization
                  : normalizedNew.createdByOrganization,
              };
            });

            queryClient.setQueriesData({ queryKey: eventQueryKeys.all }, (old: any) => {
              if (!Array.isArray(old)) {
                return old;
              }

              const index = old.findIndex((event) => getId(event) === eventId);
              if (index === -1) {
                return old;
              }

              const next = [...old];
              next[index] = { ...next[index], ...normalizedNew };
              return next;
            });
          }

          if (payload.eventType !== "DELETE" && isRelevant && isPartialRealtimeRow(newRow)) {
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.all });
            queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) });
          }

        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, session?.user?.id, session?.user?.role, supabase]);

  return null;
}
