'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, Edit, Trash2, Tag } from 'lucide-react'

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
      className={`hover:bg-gray-50 ${isDragging ? 'bg-blue-50 shadow-lg' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-gray-900">{material.title}</div>
            <div className="text-sm text-gray-500 truncate max-w-xs">{material.description}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
          {material.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {material.type}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <Eye className="w-4 h-4 mr-1" />
          {material.views || 0}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onTogglePublish(material)}
            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              material.isPublished
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {material.isPublished ? 'Published' : 'Unpublished'}
          </button>
          {material.featured && (
            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
              Featured
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFeatured(material)}
            className="text-purple-600 hover:text-purple-900"
            title={material.featured ? 'Unfeature' : 'Feature'}
          >
            <Tag className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(material)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(material._id)}
            className="text-red-600 hover:text-red-900"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
