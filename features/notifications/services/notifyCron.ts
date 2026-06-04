import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createNotification } from './core'

const DEBUG_NOTIFICATIONS = process.env.NEXT_PUBLIC_DEBUG_NOTIFICATIONS === 'true'

export async function checkEventDeadlinesAndNotify() {
  try {
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const supabase = createSupabaseAdminClient()

    const { data: saveRows } = await supabase
      .from('content_saves')
      .select('user_id, content_id')
      .eq('content_type', 'event')

    const savesByUser = new Map<string, string[]>()
    for (const row of saveRows || []) {
      const userId = row.user_id as string | undefined
      const eventId = row.content_id as string | undefined
      if (!userId || !eventId) continue
      const list = savesByUser.get(userId) || []
      list.push(eventId)
      savesByUser.set(userId, list)
    }

    for (const [userId, savedEvents] of Array.from(savesByUser.entries())) {
      const { data: upcomingEvents } = await supabase
        .from('events')
        .select('id, slug, title, application_deadline')
        .in('id', savedEvents)
        .eq('status', 'approved')
        .gte('application_deadline', now.toISOString())
        .lte('application_deadline', threeDaysFromNow.toISOString())

      if (!upcomingEvents || upcomingEvents.length === 0) {
        continue
      }

      const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const { data: recentNotifications } = await supabase
        .from('notifications')
        .select('data')
        .eq('user_id', userId)
        .eq('type', 'event_deadline')
        .gte('created_at', since)

      const notifiedEventIds = new Set(
        (recentNotifications || [])
          .map((notification) => (notification.data as any)?.eventId)
          .filter(Boolean),
      )

      for (const event of upcomingEvents) {
        if (notifiedEventIds.has(event.id)) {
          continue
        }

        const deadlineDate = event.application_deadline
          ? new Date(event.application_deadline)
          : null
        const daysUntilDeadline = deadlineDate
          ? Math.ceil(
              (deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
            )
          : 0

        if (daysUntilDeadline !== 2) {
          continue
        }

        await createNotification({
          userId: userId,
          type: 'event_deadline',
          title: 'Tədbir müraciət son tarixi yaxınlaşır',
          message: `"${event.title}" tədbiri üçün müraciət son tarixi ${daysUntilDeadline} gün içindədir`,
          actionUrl: `/resources/events/${event.slug || event.id}`,
          data: {
            eventId: event.id,
            eventSlug: event.slug || null,
            eventTitle: event.title,
            deadline: event.application_deadline,
            daysUntilDeadline,
          },
        })
      }
    }

    return {
      success: true,
      usersChecked: savesByUser.size,
    }
  } catch (error) {
    if (DEBUG_NOTIFICATIONS) console.error('Error checking event deadlines:', error)
    throw error
  }
}

export async function checkVacancyDeadlinesAndNotify() {
  try {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const supabase = createSupabaseAdminClient()

    const { data: saveRows } = await supabase
      .from('content_saves')
      .select('user_id, content_id')
      .eq('content_type', 'vacancy')

    const savesByUser = new Map<string, string[]>()
    for (const row of saveRows || []) {
      const userId = row.user_id as string | undefined
      const vacancyId = row.content_id as string | undefined
      if (!userId || !vacancyId) continue
      const list = savesByUser.get(userId) || []
      list.push(vacancyId)
      savesByUser.set(userId, list)
    }

    let totalNotified = 0

    for (const [userId, savedVacancies] of Array.from(savesByUser.entries())) {
      const { data: upcomingVacancies } = await supabase
        .from('vacancies')
        .select('id, slug, title, application_deadline')
        .in('id', savedVacancies)
        .eq('status', 'approved')
        .gte('application_deadline', now.toISOString())
        .lte('application_deadline', sevenDaysFromNow.toISOString())

      if (!upcomingVacancies || upcomingVacancies.length === 0) {
        continue
      }

      const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const { data: recentNotifications } = await supabase
        .from('notifications')
        .select('data')
        .eq('user_id', userId)
        .eq('type', 'vacancy_deadline')
        .gte('created_at', since)

      const notifiedVacancyIds = new Set(
        (recentNotifications || [])
          .map((notification) => (notification.data as any)?.vacancyId)
          .filter(Boolean),
      )

      for (const vacancy of upcomingVacancies) {
        if (notifiedVacancyIds.has(vacancy.id)) {
          continue
        }

        const deadlineDate = vacancy.application_deadline
          ? new Date(vacancy.application_deadline)
          : null
        const daysUntilDeadline = deadlineDate
          ? Math.ceil(
              (deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
            )
          : 0

        const result = await createNotification({
          userId: userId,
          type: 'vacancy_deadline',
          title: 'Vakansiya müraciət son tarixi yaxınlaşır',
          message: `"${vacancy.title}" vakansiyası üçün müraciət son tarixi ${daysUntilDeadline} gün içindədir`,
          actionUrl: `/resources/vacancies/${vacancy.slug || vacancy.id}`,
          data: {
            vacancyId: vacancy.id,
            vacancySlug: vacancy.slug || null,
            vacancyTitle: vacancy.title,
            deadline: vacancy.application_deadline,
            daysUntilDeadline,
          },
        })

        if (result) totalNotified++
      }
    }

    return {
      usersChecked: savesByUser.size,
      vacanciesNotified: totalNotified,
    }
  } catch (error) {
    if (DEBUG_NOTIFICATIONS) console.error('Error checking vacancy deadlines:', error)
    throw error
  }
}
