export interface VacancyItem {
  _id: string;
  slug: string;
  title: string;
  description: string;
  type: "full_time" | "part_time" | "volunteer" | "intern";
  city: string;
  address?: string | null;
  applicationDeadline: string;
  requirements: string[];
  responsibilities: string[];
  ageMin: number;
  ageMax: number;
  isPaid: boolean;
  paymentMode?: "fixed" | "range" | null;
  paymentAmount?: number | null;
  paymentMin?: number | null;
  paymentMax?: number | null;
  benefits: string[];
  applicationMethod: "link" | "email" | "phone";
  applicationValue: string;
  periodFromMonth?: number | null;
  periodFromYear?: number | null;
  periodToMonth?: number | null;
  periodToYear?: number | null;
  imageUrl?: string;
  status: "pending" | "approved" | "rejected";
  adminComment?: string;
  approvedAt?: string;
  approvedBy?: string;
  isPublished: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: { _id: string; name: string; email: string };
  views?: number;
  uniqueViews?: number;
  saves?: number;
}

export const statusOptions = [
  { value: "all", label: "Bütün Statuslar" },
  { value: "pending", label: "Gözləmədə" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "rejected", label: "Rədd edilib" },
];
