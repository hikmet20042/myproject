import { notFound } from 'next/navigation'
import Image from 'next/image';
import dbConnect from '@/lib/mongoose'
import User from '@/lib/models/User'
import UserProfile from '@/lib/models/UserProfile'
import Article from '@/lib/models/Article'

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  await dbConnect();
  const user = await User.findById(params.id).lean();
  if (!user || Array.isArray(user)) return notFound();
  const profile = await UserProfile.findOne({ userId: user._id }).lean();
  const articles = await Article.find({ author: user._id, status: 'approved' }).sort({ publishedAt: -1 }).lean();

  return (
    <div className="section-padding py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border border-gray-300"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <div className="text-gray-500 text-sm">{user.email}</div>
          </div>
        </div>
        {profile && !Array.isArray(profile) && (
          <div className="mb-8">
            <h2 className="font-semibold mb-1">About</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{(profile as any).bio || 'No bio provided.'}</p>
          </div>
        )}
        <div>
          <h2 className="font-semibold mb-3">Articles by {user.name}</h2>
          {articles.length === 0 ? (
            <div className="text-gray-500">No articles published yet.</div>
          ) : (
            <ul className="space-y-4">
              {articles.map((a: any) => (
                <li key={a._id}>
                  <a href={`/articles/${a._id}`} className="text-lg font-medium text-primary hover:underline">
                    {a.title}
                  </a>
                  <div className="text-xs text-gray-500">
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
