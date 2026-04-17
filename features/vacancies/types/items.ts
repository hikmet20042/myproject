export interface VacancyItem {
  _id: string;
  slug: string;
  title: string;
  description: string;
  type: "job" | "volunteer" | "internship";
  category: string;
  workType: "remote" | "onsite" | "hybrid";
  location: {
    city?: string;
    country?: string;
    address?: string;
    isRemote: boolean;
  };
  experienceLevel: "entry" | "mid" | "senior" | "any";
  duration: {
    type: "permanent" | "contract" | "temporary";
    contractLength?: { value: number; unit: "months" | "years" };
  };
  compensation: {
    type: "paid" | "unpaid" | "stipend";
    amount?: number;
    currency?: string;
    period?: "hourly" | "monthly" | "yearly";
    benefits?: string[];
  };
  applicationProcess: {
    applicationLink?: string;
    email?: string;
    instructions: string;
    requiredDocuments: string[];
  };
  applicationDeadline: string;
  startDate?: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  skills: string[];
  languages?: string[];
  tags: string[];
  status: "pending" | "approved" | "rejected";
  adminComment?: string;
  approvedAt?: string;
  approvedBy?: string;
  isPublished: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: { _id: string; name: string; email: string };
  views?: number;
  uniqueViews?: number;
  saves?: number;
}

export const vacancyCategories = [
  "Program Management",
  "Communications & Media",
  "Fundraising & Development",
  "Research & Policy",
  "Education & Training",
  "Healthcare & Medical",
  "Legal & Advocacy",
  "Finance & Administration",
  "Technology & IT",
  "Human Resources",
  "Marketing & Outreach",
  "Project Coordination",
  "Field Work",
  "Volunteer Coordination",
  "Other",
];

export const statusOptions = [
  { value: "all", label: "Bütün Statuslar" },
  { value: "pending", label: "Gözləmədə" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "rejected", label: "Rədd edilib" },
];

export const categoryOptions = [
  { value: "all", label: "Bütün Kateqoriyalar" },
  ...vacancyCategories.map((cat) => ({ value: cat, label: cat })),
];

export const compensationOptions = [
  { value: "all", label: "Bütün Növlər" },
  { value: "paid", label: "Ödənişli" },
  { value: "unpaid", label: "Ödənişsiz" },
  { value: "stipend", label: "Məvacib" },
];
