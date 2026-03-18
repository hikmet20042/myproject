"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { EventItem } from "@/features/events/components/types";

interface EventDeleteDialogProps {
  isOpen: boolean;
  eventToDelete: EventItem | null;
  deleting: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export default function EventDeleteDialog({
  isOpen,
  eventToDelete,
  deleting,
  onClose,
  onConfirmDelete,
}: EventDeleteDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={"Tədbiri sil"}>
      <div className="space-y-4">
        <p className="text-gray-600">
          {`"${eventToDelete?.title || ""}" tədbirini silmək istədiyinə əminsən? Bu əməliyyatı geri qaytarmaq mümkün deyil.`}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            {"Ləğv et"}
          </Button>
          <Button variant="danger" onClick={onConfirmDelete} loading={deleting}>
            {"Tədbiri sil"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
