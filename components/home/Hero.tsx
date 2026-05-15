'use client'

import Link from 'next/link'
import { Compass, Building2, Target, Sparkles, Search, Briefcase, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface HeroProps {
  localePath: (path: string) => string
  isOrganizationUser: boolean
  stats: {
    totalEvents: number
    totalVacancies: number
    totalOrganizations: number
    totalBlogs: number
  }
}

export const Hero = ({ localePath, isOrganizationUser, stats }: HeroProps) => {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 lg:pt-32 lg:pb-40">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-300 opacity-20 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-300 opacity-20 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] mix-blend-overlay" />
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm backdrop-blur-md mb-8">
              <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Gənclər üçün ən yeni platforma</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-6 text-slate-900 leading-[1.05]">
              Fürsətləri tap, <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                təşkilatlarla əlaqə qur,
              </span> <br />
              təsirini böyüt.
            </h1>

            <p className="max-w-2xl text-lg md:text-xl text-slate-600 font-medium mb-10 leading-relaxed">
              Vakansiyalar, tədbirlər və aktiv gənclər təşkilatları bir səhifədə. Karyerana və inkişafına dərhal başla!
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href={localePath('/resources')}>
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-full px-8 py-7 text-lg shadow-xl shadow-blue-500/20 hover:scale-105 transition-all bg-gradient-to-r from-blue-600 to-indigo-600 font-bold"
                  icon={Compass}
                  iconPosition="left"
                >
                  İmkanları kəşf et
                </Button>
              </Link>
              {isOrganizationUser ? (
                <Link href={localePath('/dashboard')}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8 py-7 text-lg bg-white/70 backdrop-blur-md border-2 border-slate-200 hover:border-slate-300 transition-all font-bold text-slate-700"
                    icon={Building2}
                    iconPosition="left"
                  >
                    Təşkilat paneli
                  </Button>
                </Link>
              ) : (
                <Link href={localePath('/submit/blog')}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8 py-7 text-lg bg-white/70 backdrop-blur-md border-2 border-slate-200 hover:border-slate-300 transition-all font-bold text-slate-700"
                    icon={Target}
                    iconPosition="left"
                  >
                    Hekayəni paylaş
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Right Side Abstract Visuals - Restored */}
          <div className="relative hidden w-full perspective-[1000px] lg:flex lg:justify-center">
            <div className="relative h-[500px] w-[450px] rounded-[3.5rem] bg-gradient-to-br from-white/90 to-white/40 p-2 shadow-2xl backdrop-blur-xl border border-white/60 transform rotate-y-[-12deg] rotate-x-[8deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out group">
              
              {/* 3D Floating Elements */}
              <div className="absolute -left-10 top-12 h-28 w-28 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-500 p-4 shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-500 hover:scale-110 border border-white/40 flex justify-center items-center z-20">
                <Briefcase className="h-12 w-12 text-white drop-shadow-lg" />
              </div>

              <div className="absolute -right-8 bottom-20 h-32 w-32 rounded-full bg-gradient-to-bl from-purple-500 to-pink-500 p-4 shadow-2xl transform -rotate-6 group-hover:rotate-0 transition-all duration-500 hover:scale-110 border border-white/40 flex justify-center items-center z-20">
                <Calendar className="h-14 w-14 text-white drop-shadow-lg" />
              </div>

              <div className="absolute left-[20%] -top-10 h-24 w-24 rounded-[2.5rem] bg-gradient-to-b from-cyan-400 to-teal-500 p-4 shadow-xl transform rotate-[25deg] group-hover:rotate-12 transition-all duration-500 hover:scale-110 border border-white/40 flex justify-center items-center z-20">
                <Users className="h-10 w-10 text-white drop-shadow-lg" />
              </div>

              {/* Inner Glass Card */}
              <div className="h-full w-full rounded-[3rem] bg-white/40 border border-white/50 backdrop-blur-sm p-10 flex flex-col justify-center shadow-inner relative overflow-hidden">
                 <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                 <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                 
                 <div className="relative z-10 text-center space-y-10">
                    <div className="space-y-2">
                      <p className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 drop-shadow-sm">{stats.totalVacancies}+</p>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Aktiv Vakansiya</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-700 drop-shadow-sm">{stats.totalEvents}+</p>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Aktiv Tədbir</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 drop-shadow-sm">{stats.totalBlogs}+</p>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">İcma Bloqu</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

