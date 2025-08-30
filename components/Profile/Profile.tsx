import { Settings } from "lucide-react";
import { Button } from '@/components/ui';
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
    dateOfBirth: string
    gender: string
    occupation: string
    organization: string
    interests: string
    avatar: string
    avatarUrl?: string
    socialLinks: string
    socialMedia?: {
      facebook: string
      twitter: string
      instagram: string
      linkedin: string
      youtube: string
      website: string
    }
  } | null
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

export default function Profile({loading,setEditing,editing,formData, profile,setFormData, handleSaveProfile}: ProfileProps){
    return(
         <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  {!loading && (
                    <Button
                      onClick={() => setEditing(!editing)}
                      size="sm"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {editing ? 'Cancel' : 'Edit Profile'}
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
                              alt="Profile"
                              fill
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profile Picture
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
                                    alert('Upload failed: ' + (data.error || 'Unknown error'));
                                  }
                                } catch (error) {
                                  console.error('Upload failed:', error);
                                  alert('Upload failed. Please try again.');
                                }
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB. Images are stored securely in the database.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            value={profile.user.email}
                            disabled
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Location</label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Website</label>
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                          <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Gender</label>
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Occupation</label>
                          <input
                            type="text"
                            value={formData.occupation}
                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Organization</label>
                          <input
                            type="text"
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                          rows={4}
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Interests</label>
                        <input
                          type="text"
                          value={formData.interests}
                          onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                          placeholder="e.g., Gender equality, Women's rights, Activism"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      {/* Social Media Accounts */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">Social Media Accounts</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Facebook</label>
                            <input
                              type="url"
                              value={formData.socialMedia?.facebook || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                              }))}
                              placeholder="https://facebook.com/username"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Twitter</label>
                            <input
                              type="url"
                              value={formData.socialMedia?.twitter || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                              }))}
                              placeholder="https://twitter.com/username"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Instagram</label>
                            <input
                              type="url"
                              value={formData.socialMedia?.instagram || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                              }))}
                              placeholder="https://instagram.com/username"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn</label>
                            <input
                              type="url"
                              value={formData.socialMedia?.linkedin || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                socialMedia: { ...prev.socialMedia, linkedin: e.target.value }
                              }))}
                              placeholder="https://linkedin.com/in/username"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">YouTube</label>
                            <input
                              type="url"
                              value={formData.socialMedia?.youtube || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                              }))}
                              placeholder="https://youtube.com/channel/..."
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Other Social Links</label>
                        <input
                          type="text"
                          value={formData.socialLinks}
                          onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value })}
                          placeholder="e.g., https://website.com, other social platforms"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <Button
                          onClick={() => setEditing(false)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Avatar Display Section */}
                      <div className="flex items-center space-x-6">
                        <div className="shrink-0">
                          <div className="relative h-20 w-20">
                            <Image
                              className="rounded-full object-cover"
                              src={
                                profile.profile?.avatarUrl ||
                                profile.profile?.avatar ||
                                profile.user.image ||
                                '/default-avatar.png'
                              }
                              alt="Profile"
                              fill
                            />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{profile.user.name}</h3>
                          <p className="text-sm text-gray-500">{profile.user.email}</p>
                          {profile.profile?.bio && (
                            <p className="mt-1 text-sm text-gray-600">{profile.profile.bio}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Location</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Website</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {profile.profile?.website ? (
                              <a href={profile.profile.website} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-500">
                                {profile.profile.website}
                              </a>
                            ) : (
                              'Not specified'
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.phone || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.dateOfBirth || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Gender</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.gender || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Occupation</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.occupation || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Organization</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile?.organization || 'Not specified'}</p>
                        </div>
                      </div>

                      {profile.profile?.interests && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Interests</label>
                          <p className="mt-1 text-sm text-gray-900">{profile.profile.interests}</p>
                        </div>
                      )}
                      {profile.profile?.socialMedia && Object.values(profile.profile.socialMedia).some(link => link) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Social Media</label>
                          <div className="mt-1 flex flex-wrap gap-3">
                            {profile.profile.socialMedia.facebook && (
                              <a href={profile.profile.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 text-sm">
                                Facebook
                              </a>
                            )}
                            {profile.profile.socialMedia.twitter && (
                              <a href={profile.profile.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                                Twitter
                              </a>
                            )}
                            {profile.profile.socialMedia.instagram && (
                              <a href={profile.profile.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-500 text-sm">
                                Instagram
                              </a>
                            )}
                            {profile.profile.socialMedia.linkedin && (
                              <a href={profile.profile.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-600 text-sm">
                                LinkedIn
                              </a>
                            )}
                            {profile.profile.socialMedia.youtube && (
                              <a href={profile.profile.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-500 text-sm">
                                YouTube
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