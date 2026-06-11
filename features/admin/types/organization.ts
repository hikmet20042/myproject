/**
 * Shared types for admin organization management.
 * Extracted from app/api/admin/organizations/route.ts to reduce duplication.
 */

export type OrganizationProfileRow = {
  account_id: string;
  organization_name: string | null;
  email: string | null;
  description: string | null;
  moderation_status: 'pending' | 'approved' | 'rejected' | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
  contact_person: string | null;
};

export type OrganizationListRow = {
  account_id: string;
  organization_name: string | null;
};

export type OrganizationActionBody = {
  id?: string;
  organizationId?: string;
  action?: 'approve' | 'reject';
  rejectionReason?: string;
};

export type OrganizationBulkActionBody = {
  action?: 'approve' | 'reject';
  organizationIds?: string[];
  rejectionReason?: string;
};
