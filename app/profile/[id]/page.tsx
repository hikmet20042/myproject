'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface User {
  _id: string
  name: string
  email: string
  bio?: string
  location?: string
  website?: string
  socialMedia?: {
    twitter?: string
    linkedin?: string
    github?: string
  }
  joinedAt: string
}

interface Article {
  _id: string
  title: string
  abstract: string
  createdAt: string
  category: string
}

interface Story {
  _id: string
  title: string
  abstract: string
  createdAt: string
  category: string
}

export default function ProfilePage() {
  const params = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile
        const userResponse = await fetch(`/api/users/${params.id}`)
        if (!userResponse.ok) {
          throw new Error('User not found')
        }
        const userData = await userResponse.json()
        setUser(userData)

        // Fetch user's articles
        const articlesResponse = await fetch(`/api/articles?author=${params.id}`)
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json()
          setArticles(articlesData)
        }

        // Fetch user's stories
        const storiesResponse = await fetch(`/api/stories?author=${params.id}`)
        if (storiesResponse.ok) {
          const storiesData = await storiesResponse.json()
          setStories(storiesData)
        }
      } catch (err) {
        setError('Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchUserData()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The requested profile could not be found.'}</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-accent py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                <span className="text-3xl font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {user.name}
            </h1>
            
            {user.bio && (
              <p className="text-white/90 text-xl leading-relaxed mb-6">
                {user.bio}
              </p>
            )}
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {user.location && (
                <span className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full border border-white/30">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {user.location}
                </span>
              )}
              <span className="inline-flex items-center bg-accent/30 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full border border-accent/50">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 1m7-1l1 1m-6 0v6a2 2 0 002 2h2a2 2 0 002-2V8m-6 0H9m6 0h1" />
                </svg>
                Joined {new Date(user.joinedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {user.email && (
                <a href={`mailto:${user.email}`} className="inline-flex items-center bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact
                </a>
              )}
              {user.website && (
                <a 
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* About Section */}
                {user.bio && (
                  <Card className="bg-white rounded-xl shadow-lg">
                    <CardContent className="p-8">
                      <div className="flex items-center mb-6">
                        <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mr-4">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">About {user.name}</h2>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {user.bio}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Articles Section */}
                <Card className="bg-white rounded-xl shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-primary">Articles by {user.name}</h2>
                    </div>
                    
                    {articles.length > 0 ? (
                      <div className="grid gap-6">
                        {articles.map((article) => (
                          <div key={article._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <Badge className="bg-primary/10 text-primary">
                                {article.category}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(article.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                              <Link href={`/articles/${article._id}`} className="hover:text-primary transition-colors">
                                {article.title}
                              </Link>
                            </h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                              {article.abstract}
                            </p>
                            <Link 
                              href={`/articles/${article._id}`}
                              className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
                            >
                              Read More
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 text-lg">No articles published yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stories Section */}
                <Card className="bg-white rounded-xl shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-primary">Stories by {user.name}</h2>
                    </div>
                    
                    {stories.length > 0 ? (
                      <div className="grid gap-6">
                        {stories.map((story) => (
                          <div key={story._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <Badge className="bg-accent/20 text-primary">
                                {story.category}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(story.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                              <Link href={`/stories/${story._id}`} className="hover:text-primary transition-colors">
                                {story.title}
                              </Link>
                            </h3>
                            <p className="text-gray-600 leading-relaxed mb-4">
                              {story.abstract}
                            </p>
                            <Link 
                              href={`/stories/${story._id}`}
                              className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
                            >
                              Read More
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-gray-500 text-lg">No stories published yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Information */}
                <Card className="bg-white rounded-xl shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Contact Information</h3>
                    </div>
                    <div className="space-y-4">
                      {user.email && (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Email</p>
                            <a href={`mailto:${user.email}`} className="text-gray-900 hover:text-primary font-medium">
                              {user.email}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {user.website && (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Website</p>
                            <a 
                              href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-gray-900 hover:text-primary font-medium break-all"
                            >
                              {user.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media Links */}
                {user.socialMedia && Object.values(user.socialMedia).some(link => link) && (
                  <Card className="bg-white rounded-xl shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Social Media</h3>
                      </div>
                      <div className="space-y-3">
                        {user.socialMedia.twitter && (
                          <a 
                            href={user.socialMedia.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center p-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors group"
                          >
                            <svg className="w-5 h-5 text-sky-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                            <span className="text-sm font-medium text-sky-600 group-hover:text-sky-700">Twitter</span>
                          </a>
                        )}
                        
                        {user.socialMedia.linkedin && (
                          <a 
                            href={user.socialMedia.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                          >
                            <svg className="w-5 h-5 text-blue-700 mr-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800">LinkedIn</span>
                          </a>
                        )}
                        
                        {user.socialMedia.github && (
                          <a 
                            href={user.socialMedia.github} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                          >
                            <svg className="w-5 h-5 text-gray-700 mr-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-800">GitHub</span>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Profile Stats */}
                <Card className="bg-white rounded-xl shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Profile Stats</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Articles</span>
                        <span className="text-primary font-semibold">{articles.length}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Stories</span>
                        <span className="text-primary font-semibold">{stories.length}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Member Since</span>
                        <span className="text-primary font-semibold">
                          {new Date(user.joinedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}