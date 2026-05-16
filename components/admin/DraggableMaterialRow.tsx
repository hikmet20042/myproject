'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, Edit, Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface DraggableMaterialRowProps {
  material: any
  onTogglePublish: (material: any) => void
  onToggleFeatured: (material: any) => void
  onEdit: (material: any) => void
  onDelete: (id: string) => void
}

export default function DraggableMaterialRow({
  material,
  onTogglePublish,
  onToggleFeatured,
  onEdit,
  onDelete
}: DraggableMaterialRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: material._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-slate-50 ${isDragging ? 'bg-blue-50 shadow-lg' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <Button variant="ghost" size="xs" className="cursor-move text-slate-400 hover:text-slate-600" {...attributes} {...listeners} icon={GripVertical} />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-slate-900">{material.title}</div>
            <div className="text-sm text-slate-500 truncate max-w-xs">{material.description}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="primary" size="sm" className="capitalize">{material.category}</Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
        {material.type}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
        <div className="flex items-center">
          <Eye className="w-4 h-4 mr-1" />
          {material.views || 0}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="xs" className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${material.isPublished ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`} onClick={() => onTogglePublish(material)}>{material.isPublished ? 'Nəşr olunub' : 'Nəşr olunmayıb'}</Button>
          {material.featured && (
            <Badge variant="primary" size="sm">Önə çıxarılıb</Badge>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="xs" className="text-blue-600 hover:text-blue-900" onClick={() => onToggleFeatured(material)} title={material.featured ? 'Önə çıxarmanı ləğv et' : 'Önə çıxar'} icon={Tag} />
          <Button variant="ghost" size="xs" className="text-cyan-600 hover:text-cyan-900" onClick={() => onEdit(material)} title="Redaktə et" icon={Edit} />
          <Button variant="ghost" size="xs" className="text-red-600 hover:text-red-900" onClick={() => onDelete(material._id)} title="Sil" icon={Trash2} />
        </div>
      </td>
    </tr>
  )
}
