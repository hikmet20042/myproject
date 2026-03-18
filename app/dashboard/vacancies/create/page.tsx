'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, Plus, X, Briefcase, DollarSign, Clock, FileText, Send } from 'lucide-react'
import { Input,Select,Button,TextArea } from '@/components/ui'
import { useLocalizedPath } from '@/lib/useLocalizedPath'
import { LoadingState } from '@/components/shared'


export default function CreateVacancy() { const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const localePath = useLocalizedPath()
  const [formData, setFormData] = useState({ title: '',
    type: 'job' as 'job' | 'volunteer' | 'internship',
    description: '',
    category: '',
    workType: 'onsite' as 'remote' | 'onsite' | 'hybrid',
    city: '',
    country: '',
    applicationMethod: 'link' as 'link' | 'email',
    applicationLink: '',
    applicationEmail: '',
    applicationInstructions: '',
    applicationDeadline: '',
    requirements: [''],
    responsibilities: [''],
    qualifications: [''],
    benefits: [''],
    tags: [''],
    experienceLevel: '',
    compensationType: '',
    compensationAmount: '',
    durationType: '',
    contractLength: '',
    contractUnit: 'months' })

  useEffect(() => { if (status === 'loading') return
    if (!session) { router.push(localePath('/auth/signin')) } }, [status, session, router, localePath])

  if (status === 'loading') { return <LoadingState text={'Yüklənir'} /> }

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault()
    setLoading(true)

    // Validation
    if (!formData.title || !formData.description) { alert('Lazım olan bütün sahələri doldur')
      setLoading(false)
      return }

    if (!formData.category) { alert('Kateqoriya seç')
      setLoading(false)
      return }

    if (!formData.experienceLevel) { alert('Təcrübə səviyyəsini seç')
      setLoading(false)
      return }

    // Optional validation - these fields have defaults in the API
    // if (!formData.compensationType) { //   alert('Please select a compensation type')
    //   setLoading(false)
    //   return
    // }

    // if (!formData.durationType) { //   alert('Please select a duration type')
    //   setLoading(false)
    //   return
    // }

    if (!formData.applicationDeadline) { alert('Müraciət üçün son tarixi seç')
      setLoading(false)
      return }

    if (!formData.applicationInstructions.trim()) { alert('Müraciət təlimatlarını daxil et')
      setLoading(false)
      return }

    // Validate application method specific fields
    if (formData.applicationMethod === 'link' && !formData.applicationLink) { alert('Müraciət linki təmin et')
      setLoading(false)
      return }

    if (formData.applicationMethod === 'email' && !formData.applicationEmail) { alert('Müraciət e-poçtunu təmin et')
      setLoading(false)
      return }

    try { const vacancyData = { title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        workType: formData.workType,
        location: { city: formData.city || undefined,
          country: formData.country || undefined,
          isRemote: formData.workType === 'remote' },
        duration: { type: formData.durationType || 'permanent',
          ...(formData.contractLength && { contractLength: { value: parseInt(formData.contractLength),
              unit: formData.contractUnit } }) },
        compensation: { type: formData.compensationType || 'unpaid',
          ...(formData.compensationAmount && { amount: parseFloat(formData.compensationAmount),
            currency: 'USD',
            period: 'monthly' }),
          benefits: formData.benefits.filter(benefit => benefit.trim() !== '') },
        applicationProcess: { ...(formData.applicationMethod === 'link' && formData.applicationLink && { applicationLink: formData.applicationLink }),
          ...(formData.applicationMethod === 'email' && formData.applicationEmail && { email: formData.applicationEmail }),
          instructions: formData.applicationInstructions || 'Zəhmət olmasa göstərilən müraciət üsulundan istifadə edin.',
          requiredDocuments: ['CV/Resume'] },
        applicationDeadline: new Date(formData.applicationDeadline),
        experienceLevel: formData.experienceLevel || 'any',
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        responsibilities: formData.responsibilities.filter(resp => resp.trim() !== ''),
        qualifications: formData.qualifications.filter(qual => qual.trim() !== ''),
        skills: formData.tags.filter(tag => tag.trim() !== ''),
        tags: formData.tags.filter(tag => tag.trim() !== '') }

      const response = await fetch('/api/vacancies', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vacancyData) })

      if (response.ok) { router.push(localePath("/dashboard")) } else { const error = await response.json()
        alert(error.error || 'Vakansiya yaradılmadı') } } catch (error) { console.error('Error creating vacancy:', error)
      alert('Vakansiya yaradılmadı') } finally { setLoading(false) } }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value })) }

  const handleArrayChange = (index: number, value: string, field: 'requirements' | 'responsibilities' | 'qualifications' | 'benefits' | 'tags') => { setFormData(prev => ({ ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item) })) }

  const addArrayItem = (field: 'requirements' | 'responsibilities' | 'qualifications' | 'benefits' | 'tags') => { setFormData(prev => ({ ...prev,
      [field]: [...prev[field], ''] })) }

  const removeArrayItem = (index: number, field: 'requirements' | 'responsibilities' | 'qualifications' | 'benefits' | 'tags') => { setFormData(prev => ({ ...prev,
      [field]: prev[field].filter((_, i) => i !== index) })) }

  const sectionCardClass = 'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'
  const sectionHeaderClass = 'border-b border-gray-200 bg-slate-50 px-6 py-5'
  const fieldLabelClass = 'block text-sm font-medium text-gray-700'
  const fieldHintClass = 'mb-2 text-xs text-gray-600'
  const nativeInputClass = 'w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-base text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100'
  const removeChipButtonClass = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600'

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">{'Yeni vakansiya yarat'}</h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">{'Fərq yaradan fürsətləri paylaşın. İş elanları, könüllülük və təcrübə proqramlarını yerləşdirin və istedadlarla əlaqə yaradın.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Card */}
          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2.5" />
                {'Əsas Məlumatlar'}
              </h2>
              <p className="mt-2 text-gray-600">{'Təklif etdiyiniz mövzu haqqında bizə məlumat verin'}</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Position Title */}
              <div className="space-y-2">
                <label htmlFor="title" className={fieldLabelClass}>
                  {'Vəzifə Başlığı *'}
                </label>
                <p className={fieldHintClass}>{'Hansı rolu doldurmaq istəyirsiniz?'}</p>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className={nativeInputClass}
                  placeholder={'məs., Proqram Meneceri, Könüllü Koordinatoru, Marketinq İnternəsi'}
                />
              </div>

              {/* Type and Experience Level */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="type" className={fieldLabelClass}>
                    {'Fürsət Növü *'}
                  </label>
                  <p className={fieldHintClass}>{'Bu hansı növ fürsətdir?'}</p>
                  <select
                    id="type"
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                    className={nativeInputClass}
                  >
                    <option value="job">{'Ödənişli İş Vəzifəsi'}</option>
                <option value="volunteer">{'Könüllü Fürsəti'}</option>
                <option value="internship">{'Təcrübə Proqramı'}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="experienceLevel" className={fieldLabelClass}>
                    {'Təcrübə Səviyyəsi *'}
                  </label>
                  <p className={fieldHintClass}>{'Hansı səviyyədə təcrübə tələb olunur?'}</p>
                  <select
                    id="experienceLevel"
                    name="experienceLevel"
                    required
                    value={formData.experienceLevel}
                    onChange={handleInputChange}
                    className={nativeInputClass}
                  >
                    <option value="">{'Təcrübə səviyyəsini seçin...'}</option>
                    <option value="entry">{'Başlanğıc Səviyyə (0-2 il)'}</option>
                <option value="mid">{'Orta Səviyyə (2-5 il)'}</option>
                <option value="senior">{'Yüksək Səviyyə (5+ il)'}</option>
                <option value="any">{'Hər hansı Səviyyə Qəbul olunur'}</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className={fieldLabelClass}>
                  {'Vəzifə Təsviri *'}
                </label>
                <p className={fieldHintClass}>{'Rolu, təşkilatınızı və bu fürsətin nə üçün vacib olduğunu təsvir edin'}</p>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`${nativeInputClass} resize-none`}
                  placeholder={'Namizədlərə rolu, təşkilatınızın missiyasını və yaradacaqları təsiri izah edin...'}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                  <label htmlFor="category" className={fieldLabelClass}>
                  {'Kateqoriya *'}
                </label>
                <p className={fieldHintClass}>{'Bu vəzifəni ən yaxşı hansı sahə təsvir edir?'}</p>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className={nativeInputClass}
                >
                  <option value="">{'Kateqoriya seçin...'}</option>
                  <option value="Program Management">Proqram idarəçiliyi</option>
                  <option value="Project Coordination">Layihə koordinasiyası</option>
                <option value="Research & Analysis">Araşdırma və analiz</option>
                <option value="Communications & Media">Kommunikasiya və media</option>
                <option value="Fundraising & Development">Fundreyzinq və inkişaf</option>
                <option value="Legal & Advocacy">Hüquq və vəkillik</option>
                <option value="Finance & Administration">Maliyyə və inzibatçılıq</option>
                  <option value="Human Resources">İnsan resursları</option>
                  <option value="IT & Technology">İT və texnologiya</option>
                  <option value="Field Operations">Sahə əməliyyatları</option>
                  <option value="Community Outreach">İcma ilə iş</option>
                  <option value="Education & Training">Təhsil və təlim</option>
                  <option value="Healthcare & Medical">Səhiyyə və tibb</option>
                  <option value="Social Work">Sosial iş</option>
                  <option value="Environmental">{'Ətraf Mühit'}</option>
                  <option value="Emergency Response">Fövqəladə cavab</option>
                  <option value="Monitoring & Evaluation">Monitorinq və qiymətləndirmə</option>
                  <option value="Grant Writing">Qrant yazımı</option>
                  <option value="Marketing & Design">Marketinq və dizayn</option>
                  <option value="Other">{'Digər'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Work Details Card */}
          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2.5" />
                Yer və iş detalları
              </h2>
              <p className="mt-2 text-gray-600">Bu fürsət harada baş tutacaq?</p>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Work Type */}
              <div className="space-y-2">
                <label htmlFor="workType" className={fieldLabelClass}>
                  İş formatı *
                </label>
                <p className={fieldHintClass}>İş necə təşkil olunacaq?</p>
                <Select
                   id="workType"
                   name="workType"
                   required
                   value={formData.workType}
                   onChange={handleInputChange}
                   className="w-full px-4 py-3 text-lg"
                   placeholder={'İş təşkilini seçin...'}
                   options={[
                     { value: 'onsite', label: 'Ofisdə (məkan tələb olunur)' },
                     { value: 'remote', label: 'Uzaqdan (istənilən yerdən)' },
                     { value: 'hybrid', label: 'Hibrid (uzaqdan + ofis)' }
                   ]}
                 />
              </div>

              {/* Location Details */}
              {(formData.workType === 'onsite' || formData.workType === 'hybrid') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="city" className={fieldLabelClass}>
                      {'Yer'} *
                    </label>
                    <p className={fieldHintClass}>{'Bu fürsətin yerləşdiyi şəhər və ya rayonu seçin'}</p>
                    <Select
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-lg"
                      placeholder={'Yer seçin...'}
                      options={[
                        // Cities
                        { value: 'Baku', label: 'Bakı' },
                        { value: 'Ganja', label: 'Gəncə' },
                        { value: 'Nakhchivan', label: 'Naxçıvan' },
                        { value: 'Sumgayit', label: 'Sumqayıt' },
                        { value: 'Lankaran', label: 'Lənkəran' },
                        { value: 'Mingachevir', label: 'Mingəçevir' },
                        { value: 'Naftalan', label: 'Naftalan' },
                        { value: 'Khankendi', label: 'Xankəndi' },
                        { value: 'Shaki', label: 'Şəki' },
                        { value: 'Shirvan', label: 'Şirvan' },
                        { value: 'Yevlakh', label: 'Yevlax' },
                        // Districts
                        { value: 'Absheron', label: 'Abşeron rayonu' },
                        { value: 'Aghjabadi', label: 'Ağcabədi rayonu' },
                        { value: 'Agdam', label: 'Ağdam rayonu' },
                        { value: 'Agdash', label: 'Ağdaş rayonu' },
                        { value: 'Agdere', label: 'Ağdərə rayonu' },
                        { value: 'Agstafa', label: 'Ağstafa rayonu' },
                        { value: 'Agsu', label: 'Ağsu rayonu' },
                        { value: 'Astara', label: 'Astara rayonu' },
                        { value: 'Babek', label: 'Babək rayonu' },
                        { value: 'Balakan', label: 'Balakən rayonu' },
                        { value: 'Beylagan', label: 'Beyləqan rayonu' },
                        { value: 'Barda', label: 'Bərdə rayonu' },
                        { value: 'Bilasuvar', label: 'Biləsuvar rayonu' },
                        { value: 'Jabrayil', label: 'Cəbrayıl rayonu' },
                        { value: 'Jalilabad', label: 'Cəlilabad rayonu' },
                        { value: 'Julfa', label: 'Culfa rayonu' },
                        { value: 'Dashkasan', label: 'Daşkəsən rayonu' },
                        { value: 'Fuzuli', label: 'Füzuli rayonu' },
                        { value: 'Gadabay', label: 'Gədəbəy rayonu' },
                        { value: 'Goranboy', label: 'Goranboy rayonu' },
                        { value: 'Goychay', label: 'Göyçay rayonu' },
                        { value: 'Goygol', label: 'Göygöl rayonu' },
                        { value: 'Hajigabul', label: 'Hacıqabul rayonu' },
                        { value: 'Khachmaz', label: 'Xaçmaz rayonu' },
                        { value: 'Khizi', label: 'Xızı rayonu' },
                        { value: 'Khojaly', label: 'Xocalı rayonu' },
                        { value: 'Khojavend', label: 'Xocavənd rayonu' },
                        { value: 'Imishli', label: 'İmişli rayonu' },
                        { value: 'Ismayilli', label: 'İsmayıllı rayonu' },
                        { value: 'Kalbajar', label: 'Kəlbəcər rayonu' },
                        { value: 'Kangarli', label: 'Kəngərli rayonu' },
                        { value: 'Kurdamir', label: 'Kürdəmir rayonu' },
                        { value: 'Gakh', label: 'Qax rayonu' },
                        { value: 'Gazakh', label: 'Qazax rayonu' },
                        { value: 'Gabala', label: 'Qəbələ rayonu' },
                        { value: 'Gobustan', label: 'Qobustan rayonu' },
                        { value: 'Guba', label: 'Quba rayonu' },
                        { value: 'Gubadli', label: 'Qubadlı rayonu' },
                        { value: 'Gusar', label: 'Qusar rayonu' },
                        { value: 'Lachin', label: 'Laçın rayonu' },
                        { value: 'Lerik', label: 'Lerik rayonu' },
                        { value: 'Masalli', label: 'Masallı rayonu' },
                        { value: 'Neftchala', label: 'Neftçala rayonu' },
                        { value: 'Oghuz', label: 'Oğuz rayonu' },
                        { value: 'Ordubad', label: 'Ordubad rayonu' },
                        { value: 'Saatli', label: 'Saatlı rayonu' },
                        { value: 'Sabirabad', label: 'Sabirabad rayonu' },
                        { value: 'Salyan', label: 'Salyan rayonu' },
                        { value: 'Samukh', label: 'Samux rayonu' },
                        { value: 'Sadarak', label: 'Sədərək rayonu' },
                        { value: 'Siyazan', label: 'Siyəzən rayonu' },
                        { value: 'Shabran', label: 'Şabran rayonu' },
                        { value: 'Shahbuz', label: 'Şahbuz rayonu' },
                        { value: 'Shamakhi', label: 'Şamaxı rayonu' },
                        { value: 'Shamkir', label: 'Şəmkir rayonu' },
                        { value: 'Sharur', label: 'Şərur rayonu' },
                        { value: 'Shusha', label: 'Şuşa rayonu' },
                        { value: 'Tartar', label: 'Tərtər rayonu' },
                        { value: 'Tovuz', label: 'Tovuz rayonu' },
                        { value: 'Ujar', label: 'Ucar rayonu' },
                        { value: 'Yardimli', label: 'Yardımlı rayonu' },
                        { value: 'Zaqatala', label: 'Zaqatala rayonu' },
                        { value: 'Zangilan', label: 'Zəngilan rayonu' },
                        { value: 'Zardab', label: 'Zərdab rayonu' },
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="country" className={fieldLabelClass}>
                      {'Ölkə'}
                    </label>
                    <p className={fieldHintClass}>{'Ölkə (standart: Azərbaycan)'}</p>
                    <Input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country || 'Azərbaycan'}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-base"
                      placeholder={'Azərbaycan'}
                      readOnly
                    />
                  </div>
                </div>
              )}

              {/* Compensation Section */}
              <div className="space-y-5">
                <h3 className="text-lg font-medium text-slate-900 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                  Kompensasiya detalları
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="compensationType" className={fieldLabelClass}>
                      Kompensasiya növü *
                    </label>
                    <p className={fieldHintClass}>İştirakçılar necə kompensasiya olunacaq?</p>
                    <Select
                      id="compensationType"
                      name="compensationType"
                      required
                      value={formData.compensationType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-base"
                      placeholder={'Kompensasiya növünü seçin...'}
                      options={[
                        { value: 'salary', label: 'İllik maaş' },
                        { value: 'hourly', label: 'Saatlıq ödəniş' },
                        { value: 'stipend', label: 'Stipend/Müavinət' },
                        { value: 'volunteer', label: 'Könüllü (ödənişsiz)' },
                        { value: 'negotiable', label: 'Razılaşma yolu ilə' }
                      ]}
                    />
                  </div>

                  {formData.compensationType && formData.compensationType !== 'volunteer' && (
                    <div className="space-y-2">
                      <label htmlFor="compensationAmount" className={fieldLabelClass}>
                        Məbləğ (USD)
                      </label>
                      <p className={fieldHintClass}>Kompensasiya məbləğini daxil edin</p>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-base">$</span>
                        <Input
                          type="text"
                          id="compensationAmount"
                          name="compensationAmount"
                          value={formData.compensationAmount}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-3 text-base"
                          placeholder="50,000 və ya 15/saat"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Duration Section */}
              <div className="space-y-5">
                <h3 className="text-lg font-medium text-slate-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Müddət və vaxt planı
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="durationType" className={fieldLabelClass}>
                      Müddət növü *
                    </label>
                    <p className={fieldHintClass}>Bu fürsət nə qədər davam edəcək?</p>
                    <Select
                      id="durationType"
                      name="durationType"
                      required
                      value={formData.durationType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-base"
                      placeholder={'Müddət növünü seçin...'}
                      options={[
                        { value: 'permanent', label: 'Daimi' },
                        { value: 'fixed', label: 'Müddətli' },
                        { value: 'project', label: 'Layihə əsaslı' },
                        { value: 'temporary', label: 'Müvəqqəti' }
                       ]}
                     />
                  </div>

                  {(formData.durationType === 'fixed' || formData.durationType === 'project' || formData.durationType === 'temporary') && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="contractLength" className={fieldLabelClass}>
                          Müqavilə müddəti
                        </label>
                        <p className={fieldHintClass}>Müqavilə nə qədər davam edir?</p>
                        <Input
                          type="number"
                          id="contractLength"
                          name="contractLength"
                          value={formData.contractLength}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 text-base"
                          placeholder="12"
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="contractUnit" className={fieldLabelClass}>
                          Zaman vahidi
                        </label>
                        <p className={fieldHintClass}>Zaman vahidini seçin</p>
                        <Select
                          id="contractUnit"
                          name="contractUnit"
                          value={formData.contractUnit}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 text-base"
                          options={[
                            { value: 'weeks', label: 'Həftə' },
                            { value: 'months', label: 'Ay' },
                            { value: 'years', label: 'İl' }
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>


            </div>
          </div>

          {/* Application Details Card */}
          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Send className="w-5 h-5 mr-2.5" />
                Müraciət detalları
              </h2>
              <p className="mt-2 text-gray-600">Namizədlər bu fürsətə necə müraciət etməlidir?</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Application Method */}
              <div className="space-y-4">
                <label className={fieldLabelClass}>
                  Müraciət üsulu *
                </label>
                <p className="mb-4 text-sm text-slate-600">Namizədlərin müraciət formasını seçin</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="applicationMethod"
                      value="link"
                      checked={formData.applicationMethod === 'link'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`rounded-2xl border p-5 transition-all duration-200 ${ formData.applicationMethod === 'link'
                      ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40' }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${ formData.applicationMethod === 'link'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300' }`}>
                          {formData.applicationMethod === 'link' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{'Müraciət Linki'}</h3>
                          <p className="text-sm text-slate-600">{'Namizədləri xarici müraciət formasına yönləndirir'}</p>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="applicationMethod"
                      value="email"
                      checked={formData.applicationMethod === 'email'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`rounded-2xl border p-5 transition-all duration-200 ${ formData.applicationMethod === 'email'
                      ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40' }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${ formData.applicationMethod === 'email'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300' }`}>
                          {formData.applicationMethod === 'email' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{'Müraciət E-poçtu'}</h3>
                          <p className="text-sm text-slate-600">{'Müraciətləri e-poçt vasitəsilə qəbul edin'}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Application Link/Email Input */}
              {formData.applicationMethod === 'link' && (
                <div className="space-y-2">
                    <label htmlFor="applicationLink" className={fieldLabelClass}>
                    {'Müraciət Linki *'}
                  </label>
                  <p className={fieldHintClass}>{'Namizədləri xarici müraciət formasına yönləndirir'}</p>
                  <Input
                    type="url"
                    id="applicationLink"
                    name="applicationLink"
                    required
                    value={formData.applicationLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base"
                    placeholder={'https://sizin-teshkilat.org/apply'}
                  />
                </div>
              )}

              {formData.applicationMethod === 'email' && (
                <div className="space-y-2">
                  <label htmlFor="applicationEmail" className={fieldLabelClass}>
                    {'Müraciət E-poçtu *'}
                  </label>
                  <p className={fieldHintClass}>{'Müraciətləri e-poçt vasitəsilə qəbul edin'}</p>
                  <Input
                    type="email"
                    id="applicationEmail"
                    name="applicationEmail"
                    required
                    value={formData.applicationEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-base"
                    placeholder={'applications@sizin-teshkilat.org'}
                  />
                </div>
              )}

              {/* Application Deadline */}
              <div className="space-y-2">
                <label htmlFor="applicationDeadline" className={fieldLabelClass}>
                  Müraciət üçün son tarix *
                </label>
                <p className={fieldHintClass}>Müraciətlər son olaraq nə vaxta qədər qəbul edilir?</p>
                <Input
                  type="date"
                  id="applicationDeadline"
                  name="applicationDeadline"
                  required
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-base"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Application Instructions */}
              <div className="space-y-2">
                <label htmlFor="applicationInstructions" className={fieldLabelClass}>
                  Müraciət təlimatı *
                </label>
                <p className={fieldHintClass}>Namizədlər üçün necə müraciət etməli olduqlarını və nə daxil etməli olduqlarını aydın yazın</p>
                <TextArea
                  id="applicationInstructions"
                  name="applicationInstructions"
                  required
                  rows={6}
                  value={formData.applicationInstructions}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-base resize-none"
                  placeholder={`Zəhmət olmasa müraciətinizə aşağıdakıları daxil edin:
• Sizin CV/Özünüzü təqdim məktubu
• Marağınızı izah edən motivasiya məktubu
• Portfolio və ya müvafiq iş nümunələri (əgər varsa)
• 2-3 istinad üçün əlaqə məlumatı

Müraciətlər PDF formatında və mövzu sətri ilə təqdim edilməlidir: [Vəzifə Başlığı] - [Adınız]` }
                />
              </div>
            </div>
          </div>

          {/* Responsibilities Card */}
          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2.5" />
                Əsas məsuliyyətlər
              </h2>
              <p className="mt-2 text-gray-600">Bu şəxs hansı işlərə cavabdeh olacaq?</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {formData.responsibilities.map((responsibility, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4">
                      <div className="mt-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-sm font-semibold text-blue-700">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <TextArea
                          value={responsibility}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'responsibilities')}
                          className="w-full px-4 py-3 text-base resize-none"
                          placeholder={'Əsas məsuliyyəti təsvir edin...'}
                          rows={2}
                        />
                      </div>
                      {formData.responsibilities.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeArrayItem(index, 'responsibilities')}
                          variant="ghost"
                          size="sm"
                          className={`${removeChipButtonClass} opacity-0 group-hover:opacity-100`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={() => addArrayItem('responsibilities')}
                  variant="outline"
                  className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl border border-dashed border-blue-200 px-5 py-3 text-blue-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Daha bir məsuliyyət əlavə et</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Requirements Card */}
          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2.5" />
                Tələblər
              </h2>
              <p className="mt-2 text-gray-600">Bu rol üçün əsas tələblər nələrdir?</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4">
                      <div className="mt-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-sm font-semibold text-blue-700">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <TextArea
                          value={requirement}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'requirements')}
                          className="w-full px-4 py-3 text-base resize-none"
                          placeholder={'Zəruri tələbi təsvir edin...'}
                          rows={2}
                        />
                      </div>
                      {formData.requirements.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeArrayItem(index, 'requirements')}
                          variant="ghost"
                          size="sm"
                          className={`${removeChipButtonClass} opacity-0 group-hover:opacity-100`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={() => addArrayItem('requirements')}
                  variant="outline"
                  className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl border border-dashed border-blue-200 px-5 py-3 text-blue-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Daha bir tələb əlavə et</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Qualifications Card */}
          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2.5" />
                Üstünlük verilən keyfiyyətlər
              </h2>
              <p className="mt-2 text-gray-600">Hansı keyfiyyətlər namizədi fərqləndirər?</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {formData.qualifications.map((qualification, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4">
                      <div className="mt-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-sm font-semibold text-blue-700">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <TextArea
                          value={qualification}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'qualifications')}
                          className="w-full px-4 py-3 text-base resize-none"
                          placeholder={'Üstünlük verilən kvalifikasiyanı təsvir edin...'}
                          rows={2}
                        />
                      </div>
                      {formData.qualifications.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeArrayItem(index, 'qualifications')}
                          variant="ghost"
                          size="sm"
                          className={`${removeChipButtonClass} opacity-0 group-hover:opacity-100`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={() => addArrayItem('qualifications')}
                  variant="outline"
                  className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl border border-dashed border-blue-200 px-5 py-3 text-blue-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Daha bir keyfiyyət əlavə et</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Benefits Card - Only for Jobs */}
          {formData.type === 'job' && (
            <div className={sectionCardClass}>
              <div className={sectionHeaderClass}>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2.5" />
                  Müavinətlər və üstünlüklər
                </h2>
                <p className="mt-2 text-gray-600">Hansı müavinət və üstünlüklər təklif edirsiniz?</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="group relative">
                      <div className="flex items-start gap-4">
                        <div className="mt-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <span className="text-sm font-semibold text-blue-700">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <TextArea
                            value={benefit}
                            onChange={(e) => handleArrayChange(index, e.target.value, 'benefits')}
                            className="w-full px-4 py-3 text-base resize-none"
                            placeholder={'Müavinət və ya üstünlüyü təsvir edin...'}
                            rows={2}
                          />
                        </div>
                        {formData.benefits.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeArrayItem(index, 'benefits')}
                            variant="ghost"
                            size="sm"
                            className={`${removeChipButtonClass} opacity-0 group-hover:opacity-100`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    onClick={() => addArrayItem('benefits')}
                    variant="outline"
                    className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl border border-dashed border-blue-200 px-5 py-3 text-blue-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">Daha bir müavinət əlavə et</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Tags Card */}
          <div className={sectionCardClass}>
            <div className={sectionHeaderClass}>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2.5" />
                Teqlər və açar sözlər
              </h2>
              <p className="mt-2 text-gray-600">Namizədlərin fürsəti tapması üçün teqlər əlavə edin</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-center gap-4">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-xs font-bold text-blue-700">#</span>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={tag}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'tags')}
                          className="w-full px-4 py-3 text-base"
                          placeholder={'məs., uzaqdan-iş, qeyri-kommersiya, sosial-təsir'}
                        />
                      </div>
                      {formData.tags.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeArrayItem(index, 'tags')}
                          variant="ghost"
                          size="sm"
                          className={`${removeChipButtonClass} opacity-0 group-hover:opacity-100`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={() => addArrayItem('tags')}
                  variant="outline"
                  className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl border border-dashed border-blue-200 px-5 py-3 text-blue-600 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Daha bir teq əlavə et</span>
                </Button>
              </div>
              
                  <div className="mt-6 rounded-xl bg-gray-50 p-4">
                    <p className="mb-2 text-sm text-gray-600">💡 <strong>Təklif olunan teqlər:</strong></p>
                <div className="flex flex-wrap gap-2">
                  {['uzaqdan-is', 'qeyri-kommersiya', 'sosial-tesir', 'baslangic-seviyye', 'tam-stat', 'yarim-stat', 'cevik-saatlar', 'sehiyye', 'tehsil', 'etraf-muhit'].map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      onClick={() => { if (!formData.tags.includes(suggestion)) { setFormData(prev => ({ ...prev,
                            tags: [...prev.tags.filter(tag => tag.trim() !== ''), suggestion] })) } }}
                      variant="outline"
                      size="sm"
                      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
                    >
                      #{suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div className={sectionCardClass}>
            <div className="p-6">
              <div className="text-center mb-8">
                <h3 className="mb-2 text-xl font-semibold text-gray-900">{'Fürsətinizi yerləşdirməyə hazırsınız?'}</h3>
                <p className="text-gray-600">{'Məlumatlarınızı yoxlayın və vakansiyanızı yayımlayaraq istedadlarla əlaqə qurmağa başlayın.'}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="outline"
                  size="lg"
                  className="rounded-xl"
                >
                  {'Ləğv et'}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  loading={loading}
                  icon={Send}
                  iconPosition="left"
                  className="rounded-xl"
                >
                  {loading ? 'Vakansiya yaradılır...' : 'Vakansiyanı Yayımla'}
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">Vakansiyanı yayımlamaqla xidmət şərtləri və məxfilik siyasətini qəbul etmiş olursunuz.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  ) }