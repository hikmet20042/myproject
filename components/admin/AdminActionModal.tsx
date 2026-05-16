"use client";

import { ReactNode } from "react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type AdminAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
};

type AdminActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: AdminAction[];
  cancelLabel?: string;
  showCancel?: boolean;
};

export default function AdminActionModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  actions,
  cancelLabel = "Ləğv Et",
  showCancel = true,
}: AdminActionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {description && <p className="text-sm text-slate-600 mb-4">{description}</p>}
      {children}
      <div className="flex justify-end gap-3 pt-6">
        {showCancel && (
          <Button variant="outline" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
        )}
        {actions?.map((action) => (
          <Button
            key={action.label}
            variant={action.variant || "primary"}
            size={action.size || "sm"}
            onClick={action.onClick}
            disabled={action.disabled}
            loading={action.loading}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Modal>
  );
}
