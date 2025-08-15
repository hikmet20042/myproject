'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Select from 'react-select'
import { RESEARCH_TAGS } from '@/lib/tagOptions'

export default function ArticleStep1() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [references, setReferences] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('draftArticle')
    if (saved) {
      try {
        const d = JSON.parse(saved)
        if (d.title) setTitle(d.title)
        if (d.abstract) setAbstract(d.abstract)
        if (d.tags) setTags(Array.isArray(d.tags) ? d.tags : typeof d.tags === 'string' ? d.tags.split(',').map((t:string)=>t.trim()).filter(Boolean) : [])
        if (d.references) setReferences(d.references)
        if (typeof d.isAnonymous === 'boolean') setIsAnonymous(d.isAnonymous)
      } catch {}
    }
  }, [])

  const next = (e: React.FormEvent) => {
    e.preventDefault()
    const saved = localStorage.getItem('draftArticle')
    const base = saved ? JSON.parse(saved) : {}
    localStorage.setItem('draftArticle', JSON.stringify({ ...base, title, abstract, tags, references, isAnonymous }))
    const params = new URLSearchParams({
      title,
      abstract,
      tags: tags.join(','),
      references,
      isAnonymous: isAnonymous ? 'true' : 'false'
    }).toString();
    router.push(`/submit/article/step2?${params}`)
  }

  return (
    <form onSubmit={next} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Article Title *</label>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter the title of your research article..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Abstract *</label>
        <textarea value={abstract} onChange={(e)=>setAbstract(e.target.value)} required rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Provide a concise summary..." />
        <p className="text-xs text-gray-500 mt-2">150-250 words recommended.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <Select
          isMulti
          name="tags"
          options={RESEARCH_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }))}
          value={RESEARCH_TAGS.map(tag => ({ value: tag, label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) })).filter(opt => tags.includes(opt.value))}
          onChange={selected => setTags(selected ? selected.map((opt:any) => opt.value) : [])}
          classNamePrefix="react-select"
          placeholder="Select tags..."
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{tag}</span>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">References</label>
        <textarea value={references} onChange={(e)=>setReferences(e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="One per line..." />
      </div>
      <div className="flex items-center">
        <input id="anon" type="checkbox" checked={isAnonymous} onChange={(e)=>setIsAnonymous(e.target.checked)} className="h-4 w-4 text-primary border-gray-300 rounded" />
        <label htmlFor="anon" className="ml-2 text-sm text-gray-700">Submit anonymously</label>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">Continue to writing →</button>
      </div>
    </form>
  )
}


