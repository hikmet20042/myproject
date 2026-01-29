import { Settings } from "lucide-react";
import { Button } from '@/components/ui';
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image';

interface UserProfile {
  user: {
    id: string
    email: string
    name: string
    image: string
    role: string
    emailVerified: string
    createdAt: string
  }
  profile: {
    bio: string
    location: string
    website: string
    phone: string
    dateOfBirth?: string
    gender?: string
    occupation?: string
    organization: string
    interests?: string
    avatar?: string
    avatarUrl?: string
    socialLinks?: string
    socialMedia?: {
      facebook: string
      twitter: string
      instagram: string
      linkedin: string
      youtube: string
      website: string
    }
    // NGO-specific fields
    registrationNumber?: string
    focusAreas?: string[]
    status?: string
    contactPerson?: string
  } | null
  isNGO?: boolean
}

interface FormData {
  name: string
  bio: string
  location: string
  website: string
  phone: string
  dateOfBirth: string
  gender: string
  occupation: string
  organization: string
  interests: string
  avatar: string
  socialLinks: string
  socialMedia: {
    facebook: string
    twitter: string
    instagram: string
    linkedin: string
    youtube: string
    website: string
  }
  // NGO-specific fields
  registrationNumber: string
  focusAreas: string[]
  status: string
  contactPerson: string
}

interface ProfileProps {
  loading: boolean
  setEditing: (editing: boolean) => void
  editing: boolean
  formData: FormData
  profile: UserProfile
  setFormData: (formData: FormData | ((prev: FormData) => FormData)) => void
  handleSaveProfile: () => void
}

export default function Profile({ loading, setEditing, editing, formData, profile, setFormData, handleSaveProfile }: ProfileProps) {
  const { t } = useLanguage()
  return (
    <div className="bg-white shadow-xl rounded-2xl border-2 border-gray-100 overflow-hidden">
      <div className="relative px-6 py-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-gray-100">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>

        <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('profile.profileInformation')}</h2>
          </div>
          {!loading && (
            <Button
              onClick={() => setEditing(!editing)}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              {editing ? t('profile.cancel') : t('profile.editProfile')}
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-6">
              <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          editing ? (
            <div className="space-y-6">
              {/* Avatar Upload Section */}
              <div className="flex items-center space-x-6">
                <div className="shrink-0">
                  <div className="relative h-20 w-20">
                    <Image
                      className="rounded-full object-cover"
                      src={
                        formData.avatar ||
                        profile.profile?.avatarUrl ||
                        profile.profile?.avatar ||
                        profile.user.image ||
                        '/default-avatar.png'
                      }
                      alt={t('profile.profilePicture')}
                      fill
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.profilePicture')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const uploadFormData = new FormData();
                        uploadFormData.append('file', file);
                        uploadFormData.append('alt', 'Profile picture');
                        uploadFormData.append('description', 'User profile avatar');
                        uploadFormData.append('context', 'profile'); // Use blob storage for privacy

                        try {
                          const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: uploadFormData,
                          });
                          const data = await response.json();
                          if (data.url) {
                            // Store the blob URL instead of file path
                            setFormData(prev => ({ ...prev, avatar: data.url }));
                          } else {
                            console.error('Upload failed:', data.error);
                            alert(t('profile.uploadFailedWithError', { error: data.error || t('common.unknown') }))
                          }
                        } catch (error) {
                          console.error('Upload failed:', error);
                          alert(t('profile.uploadFailed'))
                        }
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('profile.avatarGuidelines')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('auth.fullName')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('auth.emailAddress')}</label>
                  <input
                    type="email"
                    value={profile.user.email}
                    disabled
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('profile.location')}</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('profile.website')}</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('profile.contactPhone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('profile.dateOfBirth')}</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('profile.gender')}</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('profile.selectGender')}</option>
                    <option value="male">{t('profile.gender_male')}</option>
                    <option value="female">{t('profile.gender_female')}</option>
                    <option value="other">{t('profile.gender_other')}</option>
                    <option value="prefer-not-to-say">{t('profile.gender_prefer_not')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('profile.occupation')}</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('profile.organization')}</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.bio')}</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.interests')}</label>
                <input
                  type="text"
                  value={formData.interests || ''}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  placeholder={t('profile.interestsPlaceholder')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* NGO-specific fields */}
              {profile.isNGO && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('profile.registrationNumber')}</label>
                      <input
                        type="text"
                        value={formData.registrationNumber || ''}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('profile.status')}</label>
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{t('profile.selectStatus')}</option>
                        <option value="active">{t('profile.status_active')}</option>
                        <option value="pending">{t('profile.status_pending')}</option>
                        <option value="suspended">{t('profile.status_suspended')}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('profile.contactPerson')}</label>
                    <input
                      type="text"
                      value={formData.contactPerson || ''}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('profile.focusAreas')}</label>
                    <input
                      type="text"
                      value={formData.focusAreas?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, focusAreas: e.target.value.split(',').map(area => area.trim()).filter(area => area) })}
                      placeholder={t('profile.focusAreasPlaceholder')}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('profile.focusAreasHint')}</p>
                  </div>
                </>
              )}
              {/* Social Media Accounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">{t('profile.socialMedia')}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('profile.social_facebook')}</label>
                    <input
                      type="url"
                      value={formData.socialMedia?.facebook || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialMedia: {
                          ...prev.socialMedia,
                          facebook: e.target.value
                        }
                      }))}
                      placeholder="https://facebook.com/username"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('profile.social_twitter')}</label>
                    <input
                      type="url"
                      value={formData.socialMedia?.twitter || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialMedia: {
                          ...prev.socialMedia,
                          twitter: e.target.value
                        }
                      }))}
                      placeholder="https://twitter.com/username"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('profile.social_instagram')}</label>
                    <input
                      type="url"
                      value={formData.socialMedia?.instagram || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialMedia: {
                          ...prev.socialMedia,
                          instagram: e.target.value
                        }
                      }))}
                      placeholder="https://instagram.com/username"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('profile.social_linkedin')}</label>
                    <input
                      type="url"
                      value={formData.socialMedia?.linkedin || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialMedia: {
                          ...prev.socialMedia,
                          linkedin: e.target.value
                        }
                      }))}
                      placeholder="https://linkedin.com/in/username"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{t('profile.social_youtube')}</label>
                    <input
                      type="url"
                      value={formData.socialMedia?.youtube || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialMedia: {
                          ...prev.socialMedia,
                          youtube: e.target.value
                        }
                      }))}
                      placeholder="https://youtube.com/channel/..."
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.otherSocialLinks')}</label>
                <input
                  type="text"
                  value={formData.socialLinks}
                  onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value })}
                  placeholder={t('profile.otherSocialLinksPlaceholder')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setEditing(false)}
                  variant="outline"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSaveProfile}
                >
                  {t('dashboard.profile.saveChanges')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Avatar Display Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-100">
                <div className="shrink-0 group">
                  <div className="relative">
                    {/* Gradient ring effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full ring-4 ring-white overflow-hidden">
                      <Image
                        className="object-cover"
                        src={
                          profile.profile?.avatarUrl ||
                          profile.profile?.avatar ||
                          profile.user.image ||
                          '/default-avatar.png'
                        }
                        alt={t('titles.profile')}
                        fill
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{profile.user.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{profile.user.email}</p>
                  {profile.profile?.bio && (
                    <p className="text-base text-gray-700 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
                      {profile.profile.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.location')}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.location || t('profile.notSpecified')}</p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.website')}</label>
                  <p className="text-base font-semibold text-gray-900">
                    {profile.profile?.website ? (
                      <a href={profile.profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline">
                        {profile.profile.website}
                      </a>
                    ) : (
                      t('profile.notSpecified')
                    )}
                  </p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.contactPhone')}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.phone || t('profile.notSpecified')}</p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-pink-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.dateOfBirth')}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.dateOfBirth || t('profile.notSpecified')}</p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.gender')}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.gender || t('profile.notSpecified')}</p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.occupation')}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.occupation || t('profile.notSpecified')}</p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.organization')}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.organization || t('profile.notSpecified')}</p>
                </div>
              </div>

              {profile.profile?.interests && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 border-2 border-pink-100">
                  <label className="block text-sm font-bold text-gray-700 mb-3">{t('profile.interests')}</label>
                  <p className="text-base text-gray-800 leading-relaxed">{profile.profile.interests}</p>
                </div>
              )}

              {profile.profile?.socialMedia && Object.values(profile.profile.socialMedia).some(link => link) && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-100">
                  <label className="block text-sm font-bold text-gray-700 mb-4">{t('profile.socialMedia')}</label>
                  <div className="flex flex-wrap gap-3">
                    {profile.profile.socialMedia.facebook && (
                      <a href={profile.profile.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="group px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl">
                        {t('profile.social_facebook')}
                      </a>
                    )}
                    {profile.profile.socialMedia.twitter && (
                      <a href={profile.profile.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="group px-4 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-sm hover:bg-sky-600 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl">
                        {t('profile.social_twitter')}
                      </a>
                    )}
                    {profile.profile.socialMedia.instagram && (
                      <a href={profile.profile.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="group px-4 py-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white font-semibold text-sm hover:from-pink-600 hover:to-purple-700 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl">
                        {t('profile.social_instagram')}
                      </a>
                    )}
                    {profile.profile.socialMedia.linkedin && (
                      <a href={profile.profile.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="group px-4 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl">
                        {t('profile.social_linkedin')}
                      </a>
                    )}
                    {profile.profile.socialMedia.youtube && (
                      <a href={profile.profile.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="group px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl">
                        {t('profile.social_youtube')}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}