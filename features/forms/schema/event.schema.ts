import type { ContentFormSchema } from '@/features/forms/schema/types'
import type { EventTypeValue } from '@/lib/events/eventConfig'

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

export type EventDetailsData = {
  category: string
  eventType: EventTypeValue
  maxParticipants: string
  tags: string
  audienceAgeMin: string
  audienceAgeMax: string
}

export const eventDetailsSchema: ContentFormSchema<EventDetailsData> = {
  id: 'event-details',
  fields: [
    {
      name: 'category',
      type: 'select',
      rules: { required: true },
      ui: {
        label: 'Kateqoriya *',
        placeholder: 'Kateqoriya seçin...',
        containerClassName: 'space-y-2',
        inputClassName: 'w-full',
      },
      options: [
        { value: 'workshop', label: 'Vörkşop' },
        { value: 'conference', label: 'Konfrans' },
        { value: 'seminar', label: 'Seminar' },
        { value: 'art_performance', label: 'Art performans' },
        { value: 'cultural_event', label: 'Mədəni tədbir' },
        { value: 'fundraising', label: 'Fundreyzinq' },
        { value: 'community_gathering', label: 'İcma toplantısı' },
        { value: 'awareness_campaign', label: 'Məlumatlandırma kampaniyası' },
        { value: 'protest_rally', label: 'Etiraz aksiyası' },
        { value: 'educational_event', label: 'Təhsil tədbiri' },
        { value: 'networking', label: 'Networking' },
        { value: 'celebration', label: 'Qeyd etmə' },
        { value: 'other', label: 'Digər' },
      ],
    },
    {
      name: 'maxParticipants',
      type: 'number',
      rules: { required: false, minLength: 1, maxLength: 99999 },
      ui: {
        label: 'Maksimum iştirakçı sayı',
        placeholder: 'məs., 30',
        containerClassName: 'space-y-2',
        inputClassName: 'w-full',
      },
    },
    {
      name: 'tags',
      type: 'text',
      rules: { required: false, maxLength: 500 },
      ui: {
        label: 'Teqlər',
        placeholder: 'Teqləri vergüllə ayır',
        helperText: 'Məsələn: gənclər, təhsil, texnologiya',
        containerClassName: 'space-y-2',
        inputClassName: 'w-full',
      },
    },
  ],
}

export type EventApplicationData = {
  applicationLink: string
  applicationDeadline: string
}

export const eventApplicationSchema: ContentFormSchema<EventApplicationData> = {
  id: 'event-application',
  fields: [
    {
      name: 'applicationLink',
      type: 'text',
      rules: { required: true, maxLength: 500 },
      ui: {
        label: 'Müraciət linki *',
        placeholder: 'https://forms.google.com/...',
        containerClassName: 'space-y-2',
        inputClassName: 'w-full',
      },
    },
    {
      name: 'applicationDeadline',
      type: 'date',
      rules: { required: false },
      ui: {
        label: 'Müraciət son tarixi',
        placeholder: 'İxtiyari',
        containerClassName: 'space-y-2',
        inputClassName: 'w-full',
      },
    },
  ],
}

export type EventAudienceData = {
  audienceAgeMin: string
  audienceAgeMax: string
}

export const eventAudienceSchema: ContentFormSchema<EventAudienceData> = {
  id: 'event-audience',
  fields: [
    {
      name: 'audienceAgeMin',
      type: 'number',
      rules: { required: true, minLength: 1, maxLength: 2 },
      ui: {
        label: 'Minimum yaş *',
        placeholder: '18',
        containerClassName: 'space-y-2',
        inputClassName: 'w-full',
      },
    },
    {
      name: 'audienceAgeMax',
      type: 'number',
      rules: { required: true, minLength: 1, maxLength: 2 },
      ui: {
        label: 'Maksimum yaş *',
        placeholder: '35',
        containerClassName: 'space-y-2',
        inputClassName: 'w-full',
      },
    },
  ],
}

// Complex event section types (validated ad-hoc in EventForm, not via ContentFormSchema):
// - sessions: EventSession[]       — array of {date, startTime, endTime}
// - location: {type, address, city, country, onlineLink}  — nested object
// - requirements: string[]         — dynamic list
// - participantBenefits: string[]  — dynamic list
// - certificationProvided: boolean — toggle
// - imageUrl: string               — image upload
