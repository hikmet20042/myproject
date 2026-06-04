import { createNotification } from './core'

export async function sendWelcomeNotification(
  userId: string,
  userType: 'user' | 'organization',
) {
  const title = 'icma360-a xoş gəlmisiniz!'
  const message =
    userType === 'organization'
      ? 'Təşkilat qeydiyyatınız üçün təşəkkür edirik. Təşkilat funksiyalarına daxil olmaq üçün e-poçtunuzu təsdiqləyin və admin təsdiqini gözləyin.'
      : 'İcmamıza qoşulduğunuz üçün təşəkkür edirik. Başlamaq üçün e-poçtunuzu təsdiqləyin.'

  return createNotification({
    userId,
    type: 'welcome',
    title,
    message,
    actionUrl: '/profile',
    data: { userType },
  })
}

export async function notifyPasswordChanged(userId: string) {
  return createNotification({
    userId,
    type: 'password_changed',
    title: 'Parol dəyişdirildi',
    message: 'Hesabınızın parolu uğurla yeniləndi.',
    actionUrl: '/profile/settings',
    data: {},
  })
}

export async function notifyEmailChangeInitiated(
  userId: string,
  oldEmail: string,
  newEmail: string,
) {
  return createNotification({
    userId,
    type: 'email_change_initiated',
    title: 'E-poçt dəyişdirilir',
    message: `E-poçt ünvanınızı ${oldEmail} → ${newEmail} olaraq dəyişmək üçün təsdiq linki göndərildi. Yeni e-poçtunuzu yoxlayın.`,
    actionUrl: '/profile/settings',
    data: { oldEmail, newEmail },
  })
}

export async function notifyEmailConfirmed(userId: string, email: string) {
  return createNotification({
    userId,
    type: 'email_confirmed',
    title: 'E-poçt təsdiqləndi',
    message: `E-poçt ünvanınız (${email}) uğurla təsdiqləndi. İndi bütün funksiyalardan istifadə edə bilərsiniz.`,
    actionUrl: '/profile',
    data: { email },
  })
}
