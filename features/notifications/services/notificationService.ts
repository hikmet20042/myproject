import { createNotification } from './core'
import { notifyBlogStatus, notifyVacancyStatus, notifyAdminsAboutSubmission } from './notifyAdmin'
import {
  notifyBlogLike,
  notifyOrganizationFollow,
  notifyContentSaved,
  notifyContentLiked,
  notifyContentViewMilestone,
} from './notifyEngagement'
import {
  sendWelcomeNotification,
  notifyPasswordChanged,
  notifyEmailChangeInitiated,
  notifyEmailConfirmed,
} from './notifyAccount'
import { checkEventDeadlinesAndNotify, checkVacancyDeadlinesAndNotify } from './notifyCron'
import {
  notifyOrganizationFollowersAboutNewContent,
  notifyUsersAboutRelevantItem,
} from './notifyBroadcast'

export const NotificationService = {
  createNotification,
  notifyBlogStatus,
  notifyVacancyStatus,
  notifyAdminsAboutSubmission,
  notifyBlogLike,
  notifyOrganizationFollow,
  notifyContentSaved,
  notifyContentLiked,
  notifyContentViewMilestone,
  sendWelcomeNotification,
  notifyPasswordChanged,
  notifyEmailChangeInitiated,
  notifyEmailConfirmed,
  checkEventDeadlinesAndNotify,
  checkVacancyDeadlinesAndNotify,
  notifyOrganizationFollowersAboutNewContent,
  notifyUsersAboutRelevantItem,
}
