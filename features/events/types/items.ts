export interface EventItem {
  _id: string;
  slug: string;
  title: string;
  description: string;
  eventDate: string;
  endDate?: string;
  sessions?: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
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
  audienceAgeMin?: number;
  audienceAgeMax?: number;
  requirements?: string[];
  participantBenefits?: string[];
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
  "Vörkşop",
  "Konfrans",
  "Seminar",
  "İncəsənət",
  "Mədəni Tədbir",
  "Vəsait Toplama",
  "İcma Toplantısı",
  "Məlumatlandırma Kampaniyası",
  "Etiraz/Mitinq",
  "Təhsil Tədbiri",
  "Şəbəkələşmə",
  "Bayram/Qeyd",
  "Digər",
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
