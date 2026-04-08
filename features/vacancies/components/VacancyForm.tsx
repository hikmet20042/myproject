'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, Plus, X, Briefcase, DollarSign, Clock, FileText, Send } from 'lucide-react'
import { Input, Select, Button, TextArea } from '@/components/ui'
import { useFormState } from '@/features/forms/useFormState'
import { validateVacancyForm } from '@/features/forms/validation/vacancy'
import { buildVacancySubmitPayload } from '@/features/forms/payloadBuilders/vacancy'
import ContentForm from '@/features/forms/ContentForm'
import {
  type VacancyBasicInfoData,
  vacancyBasicInfoSchema,
} from '@/features/forms/schema/vacancy.schema'
import {
  type VacancyArrayField,
  type VacancyFormData,
  type VacancyFormInitialData,
  type VacancyFormSubmitPayload,
  INITIAL_VACANCY_FORM_DATA,
} from '@/features/vacancies/components/vacancyForm.types'
import { useGlobalFeedback } from '@/lib/useGlobalFeedback'
import { useLocalizedPath } from '@/lib/useLocalizedPath'

export type { VacancyFormInitialData, VacancyFormSubmitPayload }

type VacancyFormProps = {
  initialData?: VacancyFormInitialData | null
  onSubmit: (payload: VacancyFormSubmitPayload) => Promise<void>
  isEditMode: boolean
}

export default function VacancyForm({ initialData, onSubmit, isEditMode }: VacancyFormProps) {
  const router = useRouter()
  const localePath = useLocalizedPath()
  const { showError } = useGlobalFeedback()
  const [loading, setLoading] = useState(false)
  const {
    formState: formData,
    setFormState: setFormData,
    handleInputChange,
    setFieldValue,
    setArrayItem,
    addArrayItem: addArrayValue,
    removeArrayItem: removeArrayValue,
  } = useFormState<VacancyFormData>(INITIAL_VACANCY_FORM_DATA)

  useEffect(() => {
    if (!isEditMode || !initialData) {
      setFormData(INITIAL_VACANCY_FORM_DATA)
      return
    }

    const resolvedWorkType =
      initialData.workType ||
      (initialData.location?.isRemote ? 'remote' : 'onsite')

    setFormData({
      title: initialData.title || '',
      type: initialData.type || 'job',
      description: initialData.description || '',
      category: initialData.category || '',
      workType: resolvedWorkType,
      city: initialData.location?.city || '',
      country: initialData.location?.country || '',
      applicationMethod: initialData.applicationProcess?.email ? 'email' : 'link',
      applicationLink: initialData.applicationProcess?.applicationLink || '',
      applicationEmail: initialData.applicationProcess?.email || '',
      applicationInstructions: initialData.applicationProcess?.instructions || '',
      applicationDeadline: initialData.applicationDeadline
        ? new Date(initialData.applicationDeadline).toISOString().split('T')[0]
        : '',
      requirements:
        Array.isArray(initialData.requirements) && initialData.requirements.length > 0
          ? initialData.requirements
          : [''],
      responsibilities:
        Array.isArray(initialData.responsibilities) && initialData.responsibilities.length > 0
          ? initialData.responsibilities
          : [''],
      qualifications:
        Array.isArray(initialData.qualifications) && initialData.qualifications.length > 0
          ? initialData.qualifications
          : [''],
      benefits:
        Array.isArray(initialData.compensation?.benefits) && initialData.compensation?.benefits.length > 0
          ? initialData.compensation.benefits
          : [''],
      tags:
        Array.isArray(initialData.tags) && initialData.tags.length > 0
          ? initialData.tags
          : [''],
      experienceLevel: initialData.experienceLevel || '',
      compensationType: initialData.compensation?.type || '',
      compensationAmount:
        typeof initialData.compensation?.amount === 'number'
          ? String(initialData.compensation.amount)
          : '',
      durationType: initialData.duration?.type || '',
      contractLength:
        typeof initialData.duration?.contractLength?.value === 'number'
          ? String(initialData.duration.contractLength.value)
          : '',
      contractUnit: initialData.duration?.contractLength?.unit || 'months',
    })
  }, [initialData, isEditMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateVacancyForm(formData)
    if (validationError) {
      showError(validationError)
      return
    }

    setLoading(true)
    try {
      const payload = buildVacancySubmitPayload(formData)
      await onSubmit(payload)
    } catch (error: any) {
      showError(error?.message || (isEditMode ? 'Vakansiya yenilənmədi' : 'Vakansiya yaradılmadı'))
    } finally {
      setLoading(false)
    }
  }

  const handleArrayChange = (
    index: number,
    value: string,
    field: VacancyArrayField,
  ) => {
    setArrayItem(field, index, value)
  }

  const addArrayItem = (field: VacancyArrayField) => {
    addArrayValue(field, '')
  }

  const removeArrayItem = (index: number, field: VacancyArrayField) => {
    removeArrayValue(field, index)
  }

  const handleBasicInfoSync = (data: VacancyBasicInfoData) => {
    setFieldValue('title', data.title || '')
    setFieldValue('description', data.description || '')
    setFieldValue('experienceLevel', data.experienceLevel || '')
    setFieldValue('category', data.category || '')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35" />
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-6 text-center shadow-sm backdrop-blur-sm sm:p-8">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="mb-3 text-3xl font-black text-gray-900 sm:text-4xl">
            {isEditMode ? 'Vakansiyanı redaktə et' : 'Yeni vakansiya yarat'}
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base">
            {isEditMode
              ? 'Məlumatları yeniləyin və vakansiyanı yenidən baxış üçün göndərin.'
              : 'Fərq yaradan fürsətləri paylaşın. İş elanları, könüllülük və təcrübə proqramlarını yerləşdirin və istedadlarla əlaqə yaradın.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Users className="w-6 h-6 mr-3" />
                {'Əsas Məlumatlar'}
              </h2>
              <p className="text-blue-100 mt-2">{'Təklif etdiyiniz mövzu haqqında bizə məlumat verin'}</p>
            </div>

            <div className="p-8 space-y-8">
              <ContentForm<VacancyBasicInfoData>
                schema={vacancyBasicInfoSchema}
                initialData={{
                  title: formData.title,
                  description: formData.description,
                  experienceLevel: formData.experienceLevel,
                  category: formData.category,
                }}
                onChange={handleBasicInfoSync}
                onSubmit={async (data) => {
                  handleBasicInfoSync(data)
                }}
                showSubmitButton={false}
                asForm={false}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              />

              <div className="space-y-2">
                <label htmlFor="type" className="block text-lg font-semibold text-gray-800">
                  {'Fürsət Növü *'}
                </label>
                <p className="text-sm text-gray-600 mb-3">{'Bu hansı növ fürsətdir?'}</p>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-primary transition-all duration-200"
                >
                  <option value="job">{'Ödənişli İş Vəzifəsi'}</option>
                  <option value="volunteer">{'Könüllü Fürsəti'}</option>
                  <option value="internship">{'Təcrübə Proqramı'}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <MapPin className="w-6 h-6 mr-3" />
                Yer və iş detalları
              </h2>
              <p className="text-blue-100 mt-2">Bu fürsət harada baş tutacaq?</p>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <label htmlFor="workType" className="block text-lg font-semibold text-gray-800">
                  İş formatı *
                </label>
                <p className="text-sm text-gray-600 mb-3">İş necə təşkil olunacaq?</p>
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
                    { value: 'hybrid', label: 'Hibrid (uzaqdan + ofis)' },
                  ]}
                />
              </div>

              {(formData.workType === 'onsite' || formData.workType === 'hybrid') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="city" className="block text-lg font-semibold text-gray-800">
                      {'Yer'} *
                    </label>
                    <p className="text-sm text-gray-600 mb-3">{'Bu fürsətin yerləşdiyi şəhər və ya rayonu seçin'}</p>
                    <Select
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-lg"
                      placeholder={'Yer seçin...'}
                      options={[
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
                    <label htmlFor="country" className="block text-lg font-semibold text-gray-800">
                      {'Ölkə'}
                    </label>
                    <p className="text-sm text-gray-600 mb-3">{'Ölkə (standart: Azərbaycan)'}</p>
                    <Input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country || 'Azərbaycan'}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-lg"
                      placeholder={'Azərbaycan'}
                      readOnly
                    />
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                  Kompensasiya detalları
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="compensationType" className="block text-lg font-semibold text-gray-800">
                      Kompensasiya növü *
                    </label>
                    <p className="text-sm text-gray-600 mb-3">İştirakçılar necə kompensasiya olunacaq?</p>
                    <Select
                      id="compensationType"
                      name="compensationType"
                      required
                      value={formData.compensationType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 text-lg"
                      placeholder={'Kompensasiya növünü seçin...'}
                      options={[
                        { value: 'salary', label: 'İllik maaş' },
                        { value: 'hourly', label: 'Saatlıq ödəniş' },
                        { value: 'stipend', label: 'Stipend/Müavinət' },
                        { value: 'volunteer', label: 'Könüllü (ödənişsiz)' },
                        { value: 'negotiable', label: 'Razılaşma yolu ilə' },
                      ]}
                    />
                  </div>

                  {formData.compensationType && formData.compensationType !== 'volunteer' && (
                    <div className="space-y-2">
                      <label htmlFor="compensationAmount" className="block text-lg font-semibold text-gray-800">
                        Məbləğ (USD)
                      </label>
                      <p className="text-sm text-gray-600 mb-3">Kompensasiya məbləğini daxil edin</p>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                        <Input
                          type="text"
                          id="compensationAmount"
                          name="compensationAmount"
                          value={formData.compensationAmount}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-4 text-lg"
                          placeholder="50,000 və ya 15/saat"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-cyan-600" />
                  Müddət və vaxt planı
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="durationType" className="block text-lg font-semibold text-gray-800">
                      Müddət növü *
                    </label>
                    <p className="text-sm text-gray-600 mb-3">Bu fürsət nə qədər davam edəcək?</p>
                    <Select
                      id="durationType"
                      name="durationType"
                      required
                      value={formData.durationType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 text-lg"
                      placeholder={'Müddət növünü seçin...'}
                      options={[
                        { value: 'permanent', label: 'Daimi' },
                        { value: 'fixed', label: 'Müddətli' },
                        { value: 'project', label: 'Layihə əsaslı' },
                        { value: 'temporary', label: 'Müvəqqəti' },
                      ]}
                    />
                  </div>

                  {(formData.durationType === 'fixed' ||
                    formData.durationType === 'project' ||
                    formData.durationType === 'temporary') && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="contractLength" className="block text-lg font-semibold text-gray-800">
                          Müqavilə müddəti
                        </label>
                        <p className="text-sm text-gray-600 mb-3">Müqavilə nə qədər davam edir?</p>
                        <Input
                          type="number"
                          id="contractLength"
                          name="contractLength"
                          value={formData.contractLength}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 text-lg"
                          placeholder="12"
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="contractUnit" className="block text-lg font-semibold text-gray-800">
                          Zaman vahidi
                        </label>
                        <p className="text-sm text-gray-600 mb-3">Zaman vahidini seçin</p>
                        <Select
                          id="contractUnit"
                          name="contractUnit"
                          value={formData.contractUnit}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 text-lg"
                          options={[
                            { value: 'weeks', label: 'Həftə' },
                            { value: 'months', label: 'Ay' },
                            { value: 'years', label: 'İl' },
                          ]}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Send className="w-6 h-6 mr-3" />
                Müraciət detalları
              </h2>
              <p className="text-blue-100 mt-2">Namizədlər bu fürsətə necə müraciət etməlidir?</p>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-800">
                  Müraciət üsulu *
                </label>
                <p className="text-sm text-gray-600 mb-4">Namizədlərin müraciət formasını seçin</p>
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
                    <div
                      className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                        formData.applicationMethod === 'link'
                          ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-100'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            formData.applicationMethod === 'link'
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {formData.applicationMethod === 'link' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{'Müraciət Linki'}</h3>
                          <p className="text-sm text-gray-600">{'Namizədləri xarici müraciət formasına yönləndirir'}</p>
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
                    <div
                      className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                        formData.applicationMethod === 'email'
                          ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-100'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            formData.applicationMethod === 'email'
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {formData.applicationMethod === 'email' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{'Müraciət E-poçtu'}</h3>
                          <p className="text-sm text-gray-600">{'Müraciətləri e-poçt vasitəsilə qəbul edin'}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {formData.applicationMethod === 'link' && (
                <div className="space-y-2">
                  <label htmlFor="applicationLink" className="block text-lg font-semibold text-gray-800">
                    {'Müraciət Linki *'}
                  </label>
                  <p className="text-sm text-gray-600 mb-3">{'Namizədləri xarici müraciət formasına yönləndirir'}</p>
                  <Input
                    type="url"
                    id="applicationLink"
                    name="applicationLink"
                    required
                    value={formData.applicationLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 text-lg"
                    placeholder={'https://sizin-teshkilat.org/apply'}
                  />
                </div>
              )}

              {formData.applicationMethod === 'email' && (
                <div className="space-y-2">
                  <label htmlFor="applicationEmail" className="block text-lg font-semibold text-gray-800">
                    {'Müraciət E-poçtu *'}
                  </label>
                  <p className="text-sm text-gray-600 mb-3">{'Müraciətləri e-poçt vasitəsilə qəbul edin'}</p>
                  <Input
                    type="email"
                    id="applicationEmail"
                    name="applicationEmail"
                    required
                    value={formData.applicationEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 text-lg"
                    placeholder={'applications@sizin-teshkilat.org'}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="applicationDeadline" className="block text-lg font-semibold text-gray-800">
                  Müraciət üçün son tarix *
                </label>
                <p className="text-sm text-gray-600 mb-3">Müraciətlər son olaraq nə vaxta qədər qəbul edilir?</p>
                <Input
                  type="date"
                  id="applicationDeadline"
                  name="applicationDeadline"
                  required
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 text-lg"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="applicationInstructions" className="block text-lg font-semibold text-gray-800">
                  Müraciət təlimatı *
                </label>
                <p className="text-sm text-gray-600 mb-3">Namizədlər üçün necə müraciət etməli olduqlarını və nə daxil etməli olduqlarını aydın yazın</p>
                <TextArea
                  id="applicationInstructions"
                  name="applicationInstructions"
                  required
                  rows={6}
                  value={formData.applicationInstructions}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 text-lg resize-none"
                  placeholder={`Zəhmət olmasa müraciətinizə aşağıdakıları daxil edin:
• Sizin CV/Özünüzü təqdim məktubu
• Marağınızı izah edən motivasiya məktubu
• Portfolio və ya müvafiq iş nümunələri (əgər varsa)
• 2-3 istinad üçün əlaqə məlumatı

Müraciətlər PDF formatında və mövzu sətri ilə təqdim edilməlidir: [Vəzifə Başlığı] - [Adınız]`}
                />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-blue-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FileText className="w-6 h-6 mr-3" />
                Əsas məsuliyyətlər
              </h2>
              <p className="text-blue-100 mt-2">Bu şəxs hansı işlərə cavabdeh olacaq?</p>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {formData.responsibilities.map((responsibility, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-2">
                        <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <TextArea
                          value={responsibility}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'responsibilities')}
                          className="w-full px-4 py-3 text-lg resize-none"
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
                          className="flex-shrink-0 w-8 h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
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
                  className="w-full mt-6 px-6 py-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Daha bir məsuliyyət əlavə et</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-blue-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Users className="w-6 h-6 mr-3" />
                Tələblər
              </h2>
              <p className="text-blue-100 mt-2">Bu rol üçün əsas tələblər nələrdir?</p>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-2">
                        <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <TextArea
                          value={requirement}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'requirements')}
                          className="w-full px-4 py-3 text-lg resize-none"
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
                          className="flex-shrink-0 w-8 h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
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
                  className="w-full mt-6 px-6 py-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Daha bir tələb əlavə et</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-blue-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Calendar className="w-6 h-6 mr-3" />
                Üstünlük verilən keyfiyyətlər
              </h2>
              <p className="text-blue-100 mt-2">Hansı keyfiyyətlər namizədi fərqləndirər?</p>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {formData.qualifications.map((qualification, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mt-2">
                        <span className="text-emerald-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <TextArea
                          value={qualification}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'qualifications')}
                          className="w-full px-4 py-3 text-lg resize-none"
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
                          className="flex-shrink-0 w-8 h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
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
                  className="w-full mt-6 px-6 py-4 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Daha bir keyfiyyət əlavə et</span>
                </Button>
              </div>
            </div>
          </div>

          {formData.type === 'job' && (
            <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-blue-700 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <DollarSign className="w-6 h-6 mr-3" />
                  Müavinətlər və üstünlüklər
                </h2>
                <p className="text-blue-100 mt-2">Hansı müavinət və üstünlüklər təklif edirsiniz?</p>
              </div>

              <div className="p-8">
                <div className="space-y-4">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="group relative">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mt-2">
                          <span className="text-amber-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <TextArea
                            value={benefit}
                            onChange={(e) => handleArrayChange(index, e.target.value, 'benefits')}
                            className="w-full px-4 py-3 text-lg resize-none"
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
                            className="flex-shrink-0 w-8 h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
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
                    className="w-full mt-6 px-6 py-4 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">Daha bir müavinət əlavə et</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-blue-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <MapPin className="w-6 h-6 mr-3" />
                Teqlər və açar sözlər
              </h2>
              <p className="text-blue-100 mt-2">Namizədlərin fürsəti tapması üçün teqlər əlavə edin</p>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs">#</span>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={tag}
                          onChange={(e) => handleArrayChange(index, e.target.value, 'tags')}
                          className="w-full px-4 py-3 text-lg"
                          placeholder={'məs., uzaqdan-iş, qeyri-kommersiya, sosial-təsir'}
                        />
                      </div>
                      {formData.tags.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeArrayItem(index, 'tags')}
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 w-8 h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
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
                  className="w-full mt-6 px-6 py-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Daha bir teq əlavə et</span>
                </Button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">💡 <strong>Təklif olunan teqlər:</strong></p>
                <div className="flex flex-wrap gap-2">
                  {['uzaqdan-is', 'qeyri-kommersiya', 'sosial-tesir', 'baslangic-seviyye', 'tam-stat', 'yarim-stat', 'cevik-saatlar', 'sehiyye', 'tehsil', 'etraf-muhit'].map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        if (!formData.tags.includes(suggestion)) {
                          setFormData((prev) => ({
                            ...prev,
                            tags: [...prev.tags.filter((item) => item.trim() !== ''), suggestion],
                          }))
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                    >
                      #{suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {isEditMode ? 'Dəyişiklikləri yadda saxlamağa hazırsınız?' : 'Fürsətinizi yerləşdirməyə hazırsınız?'}
                </h3>
                <p className="text-gray-600">
                  {isEditMode
                    ? 'Məlumatlarınızı yoxlayın və yenilənmiş vakansiyanı göndərin.'
                    : 'Məlumatlarınızı yoxlayın və vakansiyanızı yayımlayaraq istedadlarla əlaqə qurmağa başlayın.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  type="button"
                  onClick={() => router.push(localePath('/dashboard/vacancies'))}
                  variant="outline"
                  size="lg"
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
                >
                  {loading
                    ? isEditMode
                      ? 'Vakansiya yenilənir...'
                      : 'Vakansiya yaradılır...'
                    : isEditMode
                      ? 'Yenilikləri yadda saxla'
                      : 'Vakansiyanı Yayımla'}
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
  )
}
