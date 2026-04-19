export const EVENT_TYPE_VALUES = [
  'training_workshop',
  'webinar',
  'training_course',
  'bootcamp',
  'panel_discussion',
  'camp',
  'forum',
  'conference',
  'flashmob',
  'meetup',
] as const

export type EventTypeValue = (typeof EVENT_TYPE_VALUES)[number]

export const EVENT_TYPE_LABELS: Record<EventTypeValue, string> = {
  training_workshop: 'Təlim / Workshop',
  webinar: 'Vebinar',
  training_course: 'Təlim kursu',
  bootcamp: 'Bootcamp',
  panel_discussion: 'Panel müzakirə',
  camp: 'Düşərgə',
  forum: 'Forum',
  conference: 'Konfrans',
  flashmob: 'Fleşmob',
  meetup: 'Meetup',
}

export const AZERBAIJAN_CITIES = [
  'Bakı',
  'Gəncə',
  'Sumqayıt',
  'Mingəçevir',
  'Lənkəran',
  'Şəki',
  'Şirvan',
  'Naxçıvan',
  'Quba',
  'Xaçmaz',
  'Qəbələ',
  'Şamaxı',
  'Yevlax',
  'Bərdə',
  'Ağcabədi',
  'Zaqatala',
  'Balakən',
  'Ağdaş',
  'Salyan',
  'Masallı',
] as const

export type EventSession = {
  date: string
  startTime: string
  endTime: string
}
