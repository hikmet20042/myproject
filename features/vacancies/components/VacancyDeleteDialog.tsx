"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { VacancyItem } from "@/features/vacancies/components/types";

interface VacancyDeleteDialogProps {
  isOpen: boolean;
  vacancyToDelete: VacancyItem | null;
  deleting: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export default function VacancyDeleteDialog({
  isOpen,
  vacancyToDelete,
  deleting,
  onClose,
  onConfirmDelete,
}: VacancyDeleteDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={"Vakansiyanı sil"}>
      <div className="space-y-4">
        <p className="text-gray-600">
          {`"${vacancyToDelete?.title || ""}" vakansiyasını silmək istədiyinə əminsən? Bu əməliyyatı geri qaytarmaq mümkün deyil.`}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            {"Ləğv et"}
          </Button>
          <Button variant="danger" onClick={onConfirmDelete} loading={deleting}>
            {"Vakansiyanı sil"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
