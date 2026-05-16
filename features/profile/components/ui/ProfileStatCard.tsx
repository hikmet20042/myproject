import { Card } from '@/components/ui/Card'

interface ProfileStatCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

export default function ProfileStatCard({ label, value, helper }: ProfileStatCardProps) {
  return (
    <Card className="rounded-2xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-gray-500">{helper}</p> : null}
    </Card>
  );
}
