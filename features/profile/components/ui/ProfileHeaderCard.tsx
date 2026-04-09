import React from "react";
import { Mail } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface ProfileHeaderCardProps {
  name: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  onEdit?: () => void;
} 

export default function ProfileHeaderCard({
  name,
  email,
  bio,
  avatarUrl,
  onEdit,
}: ProfileHeaderCardProps) {
  const fallbackInitial = name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-primary text-white flex items-center justify-center text-2xl font-black">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name} fill className="object-cover" />
            ) : (
              fallbackInitial
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900 sm:text-2xl">{name}</h2>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              {email}
            </p>
            {bio ? <p className="max-w-2xl text-sm text-gray-700">{bio}</p> : null}
          </div>
        </div>

        {onEdit ? (
          <Button variant="primary" size="sm" onClick={onEdit}>
            Profili redaktə et
          </Button>
        ) : null}
      </div>
    </div>
  );
}
