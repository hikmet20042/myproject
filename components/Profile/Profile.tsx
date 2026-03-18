import { Settings } from "lucide-react";
import { Button } from '@/components/ui';
import Image from 'next/image';

interface UserProfile { user: { id: string
    email: string
    name: string
    image: string
    role: string
    emailVerified: string
    createdAt: string }
  profile: { bio: string
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
    socialMedia?: { facebook: string
      twitter: string
      instagram: string
      linkedin: string
      youtube: string
      website: string }
    // Organization-specific fields
    registrationNumber?: string
    focusAreas?: string[]
    status?: string
    contactPerson?: string } | null
  isOrganization?: boolean }

interface FormData { name: string
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
  socialMedia: { facebook: string
    twitter: string
    instagram: string
    linkedin: string
    youtube: string
    website: string }
  // Organization-specific fields
  registrationNumber: string
  focusAreas: string[]
  status: string
  contactPerson: string }

interface ProfileProps { loading: boolean
  setEditing: (editing: boolean) => void
  editing: boolean
  formData: FormData
  profile: UserProfile
  setFormData: (formData: FormData | ((prev: FormData) => FormData)) => void
  handleSaveProfile: () => void }

export default function Profile({ loading, setEditing, editing, formData, profile, setFormData, handleSaveProfile }: ProfileProps) { return (
    <div className="bg-white shadow-md rounded-2xl border-2 border-blue-100 overflow-hidden">
      <div className="relative px-6 py-6 bg-gradient-to-r from-blue-50 via-cyan-50 to-emerald-50 border-b-2 border-blue-100">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5"></div>

        <div className="relative flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{'Profil Məlumatları'}</h2>
          </div>
          {!loading && (
            <Button
              onClick={() => setEditing(!editing)}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              {editing ? 'Ləğv et' : 'Profili Redaktə Et'}
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-6">
              <div className="h-20 w-20 bg-slate-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-32"></div>
                <div className="h-3 bg-slate-200 rounded w-48"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-8 bg-slate-200 rounded"></div>
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
                      src={ formData.avatar ||
                        profile.profile?.avatarUrl ||
                        profile.profile?.avatar ||
                        profile.user.image ||
                        '/default-avatar.png' }
                      alt={'Profil Şəkli'}
                      fill
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {'Profil Şəkli'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => { const file = e.target.files?.[0];
                      if (file) { const uploadFormData = new FormData();
                        uploadFormData.append('file', file);
                        uploadFormData.append('alt', 'Profil şəkli');
                        uploadFormData.append('description', 'İstifadəçi profil avatarı');
                        uploadFormData.append('context', 'profile'); // Use blob storage for privacy

                        try { const response = await fetch('/api/upload', { method: 'POST',
                            body: uploadFormData, });
                          const data = await response.json();
                          if (data.url) { // Store the blob URL instead of file path
                            setFormData(prev => ({ ...prev, avatar: data.url })); } else { console.error('Upload failed:', data.error);
                            alert(`Yükləmə uğursuz oldu: ${data.error || 'Naməlum'}`) } } catch (error) { console.error('Upload failed:', error);
                          alert('Yükləmə uğursuz oldu. Yenidən cəhd et.') } } }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">{'PNG, JPG, GIF. Maksimum 10MB. Şəkillər təhlükəsiz saxlanılır.'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{'Tam Ad'}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{'E-poçt ünvanı'}</label>
                  <input
                    type="email"
                    value={profile.user.email}
                    disabled
                    className="mt-1 block w-full border-blue-200 rounded-md shadow-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{'Yer'}</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{'Veb-sayt'}</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{'Telefon'}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{'Doğum Tarixi'}</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{'Cins'}</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{'Cinsi seçin'}</option>
                    <option value="male">{'Kişi'}</option>
                    <option value="female">{'Qadın'}</option>
                    <option value="other">{'Digər'}</option>
                    <option value="prefer-not-to-say">{'Demək istəmirəm'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{'Peşə'}</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{'Təşkilat'}</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{'Haqqında'}</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{'Maraq sahələri'}</label>
                <input
                  type="text"
                  value={formData.interests || ''}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  placeholder={'məsələn, Gender bərabərliyi, Qadın hüquqları, Aktivizm'}
                  className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Organization-specific fields */}
              {profile.isOrganization && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{'Qeydiyyat nömrəsi'}</label>
                      <input
                        type="text"
                        value={formData.registrationNumber || ''}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{'Status'}</label>
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{'Status seçin'}</option>
                        <option value="active">{'Aktiv'}</option>
                        <option value="pending">{'Gözləmədə'}</option>
                        <option value="suspended">{'Müvəqqəti dayandırılıb'}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{'Kontakt şəxs'}</label>
                    <input
                      type="text"
                      value={formData.contactPerson || ''}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{'Fəaliyyət sahələri'}</label>
                    <input
                      type="text"
                      value={formData.focusAreas?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, focusAreas: e.target.value.split(',').map(area => area.trim()).filter(area => area) })}
                      placeholder={'məs., Təhsil, Səhiyyə, Ətraf mühit'}
                      className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{'Çoxlu sahələri vergül ilə ayırın'}</p>
                  </div>
                </>
              )}
              {/* Social Media Accounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">{'Sosial media hesabları'}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{'Facebook'}</label>
                    <input
                      type="url"
                      value={formData.socialMedia?.facebook || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev,
                        socialMedia: { ...prev.socialMedia,
                          facebook: e.target.value } }))}
                      placeholder="https://facebook.com/istifadeciadiniz"
                      className="block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{'Twitter'}</label>
                    <input
                      type="url"
                      value={formData.socialMedia?.twitter || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev,
                        socialMedia: { ...prev.socialMedia,
                          twitter: e.target.value } }))}
                      placeholder="https://twitter.com/istifadeciadiniz"
                      className="block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{'Instagram'}</label>
                    <input
                      type="url"
                      value={formData.socialMedia?.instagram || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev,
                        socialMedia: { ...prev.socialMedia,
                          instagram: e.target.value } }))}
                      placeholder="https://instagram.com/istifadeciadiniz"
                      className="block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{'LinkedIn'}</label>
                    <input
                      type="url"
                      value={formData.socialMedia?.linkedin || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev,
                        socialMedia: { ...prev.socialMedia,
                          linkedin: e.target.value } }))}
                      placeholder="https://linkedin.com/in/istifadeciadiniz"
                      className="block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{'YouTube'}</label>
                    <input
                      type="url"
                      value={formData.socialMedia?.youtube || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev,
                        socialMedia: { ...prev.socialMedia,
                          youtube: e.target.value } }))}
                      placeholder="https://youtube.com/channel/..."
                      className="block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{'Digər sosial linklər'}</label>
                <input
                  type="text"
                  value={formData.socialLinks}
                  onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value })}
                  placeholder={'məs., https://website.com, digər sosial platformalar'}
                  className="mt-1 block w-full border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setEditing(false)}
                  variant="outline"
                >
                  {'Ləğv et'}
                </Button>
                <Button
                  onClick={handleSaveProfile}
                >
                  {'Dəyişiklikləri Saxla'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Avatar Display Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 border-2 border-blue-100">
                <div className="shrink-0 group">
                  <div className="relative">
                    {/* Gradient ring effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full ring-4 ring-white overflow-hidden">
                      <Image
                        className="object-cover"
                        src={ profile.profile?.avatarUrl ||
                          profile.profile?.avatar ||
                          profile.user.image ||
                          '/default-avatar.png' }
                        alt={'Profil'}
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
                <div className="group p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{'Yer'}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.location || 'Göstərilməyib'}</p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{'Veb-sayt'}</label>
                  <p className="text-base font-semibold text-gray-900">
                    {profile.profile?.website ? (
                      <a href={profile.profile.website} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-700 underline">
                        {profile.profile.website}
                      </a>
                    ) : (
                      'Göstərilməyib'
                    )}
                  </p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 hover:border-cyan-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{'Telefon'}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.phone || 'Göstərilməyib'}</p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{'Doğum Tarixi'}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.dateOfBirth || 'Göstərilməyib'}</p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{'Cins'}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.gender || 'Göstərilməyib'}</p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{'Peşə'}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.occupation || 'Göstərilməyib'}</p>
                </div>
                <div className="group p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100 hover:border-cyan-300 transition-all duration-300 hover:shadow-lg md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{'Təşkilat'}</label>
                  <p className="text-base font-semibold text-gray-900">{profile.profile?.organization || 'Göstərilməyib'}</p>
                </div>
              </div>

              {profile.profile?.interests && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 border-2 border-blue-100">
                  <label className="block text-sm font-bold text-gray-700 mb-3">{'Maraq sahələri'}</label>
                  <p className="text-base text-gray-800 leading-relaxed">{profile.profile.interests}</p>
                </div>
              )}

              {profile.profile?.socialMedia && Object.values(profile.profile.socialMedia).some(link => link) && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 border-2 border-blue-100">
                  <label className="block text-sm font-bold text-gray-700 mb-4">{'Sosial media hesabları'}</label>
                  <div className="flex flex-wrap gap-3">
                    {profile.profile.socialMedia.facebook && (
                      <a href={profile.profile.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="group px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl">
                        {'Facebook'}
                      </a>
                    )}
                    {profile.profile.socialMedia.twitter && (
                      <a href={profile.profile.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="group px-4 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-sm hover:bg-sky-600 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl">
                        {'Twitter'}
                      </a>
                    )}
                    {profile.profile.socialMedia.instagram && (
                      <a href={profile.profile.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="group px-4 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 text-white font-semibold text-sm hover:from-blue-600 hover:to-emerald-700 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl">
                        {'Instagram'}
                      </a>
                    )}
                    {profile.profile.socialMedia.linkedin && (
                      <a href={profile.profile.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="group px-4 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl">
                        {'LinkedIn'}
                      </a>
                    )}
                    {profile.profile.socialMedia.youtube && (
                      <a href={profile.profile.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="group px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl">
                        {'YouTube'}
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
  ) }