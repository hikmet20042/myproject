export interface EventItem {
  _id: string;
  slug: string;
  title: string;
  description: string;
  eventDate: string;
  endDate?: string;
  location: {
    type: "online" | "physical" | "hybrid";
    address?: string;
    city?: string;
    country?: string;
    onlineLink?: string;
  };
  category: string;
  eventType: string;
  maxParticipants?: number;
  applicationDeadline?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  tags: string[];
  status: "pending" | "approved" | "rejected";
  adminComment?: string;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { _id: string; name: string; organizationName?: string };
  views?: number;
  uniqueViews?: number;
  saves?: number;
}

export const eventCategories = [
  "Workshop",
  "Conference",
  "Seminar",
  "Art Performance",
  "Cultural Event",
  "Fundraising",
  "Community Gathering",
  "Awareness Campaign",
  "Protest/Rally",
  "Educational Event",
  "Networking",
  "Celebration",
  "Other",
];

export const statusOptions = [
  { value: "all", label: "Bütün statuslar" },
  { value: "pending", label: "Gözləmədə" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "rejected", label: "Rədd edilib" },
];

export const categoryOptions = [
  { value: "all", label: "Bütün Kateqoriyalar" },
  ...eventCategories.map((cat) => ({ value: cat, label: cat })),
];
