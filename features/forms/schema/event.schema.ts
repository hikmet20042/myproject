import type { ContentFormSchema } from '@/features/forms/schema/types'

export type EventBasicInfoData = {
  title: string
  description: string
}

export const eventBasicInfoSchema: ContentFormSchema<EventBasicInfoData> = {
  id: 'event-basic-info',
  fields: [
    {
      name: 'title',
      type: 'text',
      rules: { required: true, minLength: 3, maxLength: 120 },
      ui: {
        label: 'Tədbir adı',
        placeholder: 'Tədbirin adını yaz',
        containerClassName: 'md:col-span-2 space-y-2',
        inputClassName: 'w-full',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      rules: { required: true, minLength: 20, maxLength: 2000 },
      ui: {
        label: 'Təsvir',
        placeholder: 'Tədbirin qısa təsvirini yaz',
        rows: 4,
        containerClassName: 'md:col-span-2 space-y-2',
        inputClassName: 'w-full',
      },
    },
  ],
}
