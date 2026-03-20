"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "@/lib/auth/client";
import type { EventItem } from "@/features/events/components/types";
import type { VacancyItem } from "@/features/vacancies/components/types";

interface DashboardDataContextValue {
  profile: any | null;
  setProfile: (profile: any | null) => void;
  profileLoading: boolean;
  setProfileLoading: (loading: boolean) => void;
  profileError: string | null;
  setProfileError: (error: string | null) => void;
  events: EventItem[];
  setEvents: (events: EventItem[]) => void;
  eventsLoading: boolean;
  eventsError: string | null;
  eventsLastFetchedAt: number | null;
  eventsDirty: boolean;
  markEventsDirty: () => void;
  refreshEvents: () => Promise<void>;
  refreshEventsIfStale: (maxAgeMs: number) => Promise<void>;
  ensureFreshEvents: (maxAgeMs: number) => Promise<void>;
  removeEventById: (id: string) => void;
  vacancies: VacancyItem[];
  setVacancies: (vacancies: VacancyItem[]) => void;
  vacanciesLoading: boolean;
  setVacanciesLoading: (loading: boolean) => void;
  vacanciesError: string | null;
  setVacanciesError: (error: string | null) => void;
}

const DashboardDataContext = createContext<DashboardDataContextValue | undefined>(
  undefined,
);

interface DashboardDataProviderProps {
  children: ReactNode;
}

export function DashboardDataProvider({ children }: DashboardDataProviderProps) {
  const { data: session, status } = useSession();
  const sessionUserId = session?.user?.id ?? null;
  const isOrganizationApproved = session?.user?.organizationStatus === 'approved';
  const hasFetchedEventsRef = useRef(false);

  const [profile, setProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [events, setEventsState] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsLastFetchedAt, setEventsLastFetchedAt] = useState<number | null>(
    null,
  );
  const [eventsDirty, setEventsDirty] = useState(false);

  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);
  const [vacanciesError, setVacanciesError] = useState<string | null>(null);

  const refreshEvents = useCallback(async () => {
    try {
      console.debug("[dashboard-data] fetch events triggered", {
        userId: sessionUserId,
      });
      setEventsLoading(true);
      setEventsError(null);

      const response = await fetch("/api/events?author=me");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEventsState(data.events || data || []);
      setEventsLastFetchedAt(Date.now());
      setEventsDirty(false);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEventsError("Tədbirlər yüklənərkən xəta baş verdi.");
    } finally {
      setEventsLoading(false);
    }
  }, [sessionUserId]);

  useEffect(() => {
    console.debug("[dashboard-data] provider mount", { userId: sessionUserId });
    return () => {
      console.debug("[dashboard-data] provider unmount", { userId: sessionUserId });
    };
    // Run once to track lifecycle; userId in logs is informational.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!isOrganizationApproved) {
      hasFetchedEventsRef.current = false;
      setEventsState([]);
      setEventsLoading(false);
      setEventsError(null);
      setEventsLastFetchedAt(null);
      setEventsDirty(false);
      return;
    }

    if (hasFetchedEventsRef.current) {
      return;
    }

    hasFetchedEventsRef.current = true;
    refreshEvents();
  }, [isOrganizationApproved, refreshEvents, status]);

  const setEvents = useCallback((nextEvents: EventItem[]) => {
    setEventsState(nextEvents);
  }, []);

  const markEventsDirty = useCallback(() => {
    setEventsDirty(true);
  }, []);

  const refreshEventsIfStale = useCallback(
    async (maxAgeMs: number) => {
      if (eventsLoading) {
        return;
      }

      if (!eventsLastFetchedAt) {
        await refreshEvents();
        return;
      }

      const ageMs = Date.now() - eventsLastFetchedAt;
      if (ageMs > maxAgeMs) {
        await refreshEvents();
      }
    },
    [eventsLastFetchedAt, eventsLoading, refreshEvents],
  );

  const ensureFreshEvents = useCallback(
    async (maxAgeMs: number) => {
      if (eventsLoading) {
        return;
      }

      if (eventsDirty) {
        await refreshEvents();
        return;
      }

      await refreshEventsIfStale(maxAgeMs);
    },
    [eventsDirty, eventsLoading, refreshEvents, refreshEventsIfStale],
  );

  const removeEventById = useCallback((id: string) => {
    setEventsState((prev) => prev.filter((event) => event._id !== id));
  }, []);

  const value = useMemo<DashboardDataContextValue>(
    () => ({
      profile,
      setProfile,
      profileLoading,
      setProfileLoading,
      profileError,
      setProfileError,
      events,
      setEvents,
      eventsLoading,
      eventsError,
      eventsLastFetchedAt,
      eventsDirty,
      markEventsDirty,
      refreshEvents,
      refreshEventsIfStale,
      ensureFreshEvents,
      removeEventById,
      vacancies,
      setVacancies,
      vacanciesLoading,
      setVacanciesLoading,
      vacanciesError,
      setVacanciesError,
    }),
    [
      profile,
      profileLoading,
      profileError,
      events,
      setEvents,
      eventsLoading,
      eventsError,
      eventsLastFetchedAt,
      eventsDirty,
      markEventsDirty,
      refreshEvents,
      refreshEventsIfStale,
      ensureFreshEvents,
      removeEventById,
      vacancies,
      vacanciesLoading,
      vacanciesError,
    ],
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);

  if (!context) {
    throw new Error("useDashboardData must be used within DashboardDataProvider");
  }

  return context;
}