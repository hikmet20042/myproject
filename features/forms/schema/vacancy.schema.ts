import type { ContentFormSchema } from '@/features/forms/schema/types'
import type { VacancyFormData } from '@/features/vacancies/types/form'

export type VacancyBasicInfoData = Pick<
  VacancyFormData,
  'title' | 'description' | 'category' | 'experienceLevel'
>

export const vacancyBasicInfoSchema: ContentFormSchema<VacancyBasicInfoData> = {
  id: 'vacancy-basic-info',
  fields: [
    {
      name: 'title',
      type: 'text',
      rules: { required: true, minLength: 3, maxLength: 120 },
      ui: {
        label: 'Vəzifə Başlığı *',
        placeholder: 'məs., Proqram Meneceri, Könüllü Koordinatoru, Marketinq İnternəsi',
        helperText: 'Hansı rolu doldurmaq istəyirsiniz?',
        containerClassName: 'space-y-2 lg:col-span-2',
        inputClassName:
          'w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-primary transition-all duration-200',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      rules: { required: true, minLength: 20, maxLength: 2000 },
      ui: {
        label: 'Vəzifə Təsviri *',
        placeholder:
          'Namizədlərə rolu, təşkilatınızın missiyasını və yaradacaqları təsiri izah edin...',
        helperText: 'Rolu, təşkilatınızı və bu fürsətin nə üçün vacib olduğunu təsvir edin',
        rows: 6,
        containerClassName: 'space-y-2 lg:col-span-2',
        inputClassName:
          'w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-primary transition-all duration-200 resize-none',
      },
    },
    {
      name: 'experienceLevel',
      type: 'select',
      rules: { required: true },
      ui: {
        label: 'Təcrübə Səviyyəsi *',
        helperText: 'Hansı səviyyədə təcrübə tələb olunur?',
        placeholder: 'Təcrübə səviyyəsini seçin...',
        containerClassName: 'space-y-2',
        inputClassName:
          'w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200',
      },
      options: [
        { value: 'entry', label: 'Başlanğıc Səviyyə (0-2 il)' },
        { value: 'mid', label: 'Orta Səviyyə (2-5 il)' },
        { value: 'senior', label: 'Yüksək Səviyyə (5+ il)' },
        { value: 'any', label: 'Hər hansı Səviyyə Qəbul olunur' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      rules: { required: true },
      ui: {
        label: 'Kateqoriya *',
        helperText: 'Bu vəzifəni ən yaxşı hansı sahə təsvir edir?',
        placeholder: 'Kateqoriya seçin...',
        containerClassName: 'space-y-2',
        inputClassName:
          'w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200',
      },
      options: [
        { value: 'Program Management', label: 'Proqram idarəçiliyi' },
        { value: 'Project Coordination', label: 'Layihə koordinasiyası' },
        { value: 'Research & Analysis', label: 'Araşdırma və analiz' },
        { value: 'Communications & Media', label: 'Kommunikasiya və media' },
        { value: 'Fundraising & Development', label: 'Fundreyzinq və inkişaf' },
        { value: 'Legal & Advocacy', label: 'Hüquq və vəkillik' },
        { value: 'Finance & Administration', label: 'Maliyyə və inzibatçılıq' },
        { value: 'Human Resources', label: 'İnsan resursları' },
        { value: 'IT & Technology', label: 'İT və texnologiya' },
        { value: 'Field Operations', label: 'Sahə əməliyyatları' },
        { value: 'Community Outreach', label: 'İcma ilə iş' },
        { value: 'Education & Training', label: 'Təhsil və təlim' },
        { value: 'Healthcare & Medical', label: 'Səhiyyə və tibb' },
        { value: 'Social Work', label: 'Sosial iş' },
        { value: 'Environmental', label: 'Ətraf Mühit' },
        { value: 'Emergency Response', label: 'Fövqəladə cavab' },
        { value: 'Monitoring & Evaluation', label: 'Monitorinq və qiymətləndirmə' },
        { value: 'Grant Writing', label: 'Qrant yazımı' },
        { value: 'Marketing & Design', label: 'Marketinq və dizayn' },
        { value: 'Other', label: 'Digər' },
      ],
    },
  ],
}
