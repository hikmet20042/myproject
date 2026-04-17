'use client'

import { ButtonLink } from '@/components/ui'
import { useLocalizedPath } from '@/hooks/useLocalizedPath'
import { useSession } from '@/lib/auth/client'
import { Shield,
  AlertTriangle,
  Lightbulb,
  Database,
  Cpu,
  BarChart3,
  Eye,
  BookOpen,
  Sparkles,
  CheckCircle,
  XCircle,
  ArrowRight,
  Users } from 'lucide-react'

export default function About() { const localePath = useLocalizedPath()
  const { data: session } = useSession()
  const isOrganizationUser = session?.user?.accountType === 'organization'
  const dataLimitations = [
    'Paylaşılan hər hekayə birgə inkişafa töhfə verir',
    'Tapılan hər fürsət yeni imkanlar açır',
    'Qurulan hər əlaqə icmamızı gücləndirir',
    'Birlikdə Azərbaycanda fürsət ekosistemi yaradırıq'
  ]

  const ethicalSafeguards = [
    'Fürsətləri kəşf etmək üçün qeydiyyatdan keç',
    'Öz proqramlarını təqdim etmək üçün Təşkilat olaraq daxil ol',
    'Öz bloqlarını yaz və başqalarına ilham ver',
    'Aktiv və gücləndirilmiş gənc icmasının bir hissəsi ol'
  ]

  const trustIndicators = [
    { icon: Users, title: 'Böyüyən İcma', description: 'Hər həftə yeni gənclər və Təşkilatlar icmamıza qoşulur.' },
    { icon: Shield, title: 'Məxfilik Təminatı', description: 'İstifadəçi məlumatları ən yüksək təhlükəsizlik standartları ilə qorunur.' },
    { icon: Sparkles, title: 'Davamlı İnkişaf', description: 'İcmanın rəylərinə əsasən platformanı mütəmadi olaraq təkmilləşdiririk.' }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(214_32%_91%)_1px,transparent_1px),linear-gradient(to_bottom,hsl(214_32%_91%)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/10 blur-3xl" />

        <div className="section-padding relative z-10">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 mb-8">
              <Sparkles size={14} className="text-accent" />
              {'icma360 Haqqında'}
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
              {'icma360 Haqqında'}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-gray-600 leading-relaxed">
              {'Gəncləri sosial təşəbbüslər, vakansiyalar, tədbirlər və inkişaf imkanları ilə birləşdirən rəqəmsal platformadır.'}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {isOrganizationUser ? (
                <>
                  <ButtonLink href={localePath('/dashboard/events/create')} variant="secondary" size="lg" hoverEffect="scale">
                    {'Tədbir Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="outline" size="lg" hoverEffect="scale">
                    {'Vakansiya Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/dashboard/profile')} variant="outline" size="lg" hoverEffect="scale">
                    {'Təşkilat Paneli'}
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href={localePath('/submit')} variant="secondary" size="lg" hoverEffect="scale">
                    {'Bloq Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/resources')} variant="outline" size="lg" hoverEffect="scale">
                    {'Fürsətləri Kəşf Et'}
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="section-padding">
          <div className="max-w-7xl mx-auto space-y-16 md:space-y-20">
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{'Gənclərin Üzləşdiyi Problemlər'}</h2>
                <p className="mt-2 text-gray-600 max-w-3xl mx-auto">{'Azərbaycanda gənclər Təşkilatlardəki fürsətlər, təlimlər, könüllü proqramlar və vakansiyalar haqqında vahid və etibarlı məlumat mənbəyi tapa bilmirlər.'}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-5">
                    <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center mr-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{'Əsas Çətinliklər'}</h3>
                  </div>
                  <div className="space-y-3 text-gray-600">
                    {[
                      { title: 'Dağınıq Məlumat', text: 'Fürsətlər haqqında məlumatlar müxtəlif platformalarda səpələnib və sistemli şəkildə təqdim olunmur. Bu da gənclərin özlərinə uyğun proqramları tapmağını çətinləşdirir.' },
                      { title: 'Zəif Əlaqə', text: 'Təşkilatlar və gənclər arasında bilavasitə əlaqə qurmaq mümkün olmadığı üçün gənclərin sosial təşəbbüslərə qoşulması çətinləşir.' },
                      { title: 'Məhdud Paylaşım İmkanları', text: 'Təcrübələrini və uğur hekayələrini paylaşmaq üçün xüsusi platforma olmadığından gənclər bir-birindən öyrənə və motivasiya əldə edə bilmirlər.' },
                      { title: 'Resurslara Çıxışda Problemlər', text: 'Şəxsi və peşəkar inkişaf materiallarına çıxış məhdud olduğu üçün gənclərin potensialını reallaşdırmaq çətinləşir.' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 mr-3" />
                        <p className="text-sm md:text-base"><strong className="text-gray-900">{item.title}:</strong> {item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-5">
                    <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center mr-3">
                      <Lightbulb className="w-5 h-5 text-amber-700" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{'Bizim Həllimiz'}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm md:text-base text-amber-800 font-medium">{'icma360 - gəncləri Təşkilatlar, vakansiyalar, tədbirlər və inkişaf resursları ilə bir araya gətirən vahid platformadır:'}</p>
                    </div>
                    <ul className="space-y-2.5">
                      {[
                        'Vakansiya, tədbir və bloqları kateqoriyalara görə axtarın',
                        'Təşkilatlar və icma təşəbbüsləri ilə birbaşa əlaqə saxlayın',
                        'Öz təcrübələrinizi paylaşın və başqalarının yazılarından öyrənin',
                        'Pulsuz təhsil və inkişaf materiallarından istifadə edin'
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center text-sm md:text-base text-gray-700">
                          <XCircle className="w-4 h-4 text-amber-600 mr-2.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{'Platformanın İmkanları'}</h2>
                <p className="mt-2 text-gray-600 max-w-3xl mx-auto">{'Gəncləri fürsətlər, icma və təhsil resursları ilə bir araya gətirən mərkəzi məkan.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: Database,
                    title: 'Vakansiya və Tədbir Mərkəzi',
                    desc: 'Azərbaycanda fəaliyyət göstərən Təşkilatlardən iş elanları, təcrübə proqramları, könüllülük imkanları və tədbirlər haqqında məlumat əldə edin.',
                    tone: 'blue',
                    features: ['Növ, tarix və yer üzrə güclü filtrləmə', 'Maraqlandığınız vakansiya və tədbirləri yadda saxlayın', 'Maraqlarınıza uyğun fərdiləşdirilmiş bildirişlər'] },
                  { icon: Cpu,
                    title: 'İcma Bloqu',
                    desc: 'Gənclərin öz fikirlərini, hekayələrini və təcrübələrini paylaşdığı, həmyaşıdlarla əlaqə qurduğu sosial məkandır.',
                    tone: 'green',
                    features: ['Öz yazılarınızı icma ilə paylaşın', 'Başqalarının bloqlarına reaksiya və şərh əlavə edin', 'Dəstəkləyici icma şəbəkəsi qurun'] },
                  { icon: BarChart3,
                    title: 'Təhsil Materialları',
                    desc: 'Şəxsi inkişaf, sosial fəaliyyət və karyera inkişafı üçün pulsuz tədris və informasiya materiallarına çıxış.',
                    tone: 'blue',
                    features: ['Bacarıq inkişafı və karyera resursları', 'Təlim və seminar elanları', 'Açıq təhsil materialları kitabxanası'] }
                ].map((solution, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow">
                    <div className={`w-11 h-11 rounded-xl ${solution.tone === 'green' ? 'bg-emerald-100' : 'bg-blue-100'} flex items-center justify-center mb-4`}>
                      <solution.icon className={`w-5 h-5 ${solution.tone === 'green' ? 'text-emerald-700' : 'text-blue-700'}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{solution.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{solution.desc}</p>
                    <div className={`rounded-xl p-3 ${solution.tone === 'green' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                      <div className="space-y-2">
                        {solution.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-center">
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${solution.tone === 'green' ? 'bg-emerald-600' : 'bg-blue-600'}`} />
                            <span className={`text-xs ${solution.tone === 'green' ? 'text-emerald-800' : 'text-blue-800'}`}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{'Nə üçün icma360?'}</h2>
                <p className="mt-2 text-gray-600 max-w-3xl mx-auto">{'Gənclər və təşkilatlar arasında körpü rolunu oynayaraq şəffaf və əlçatan bir ekosistem yaradırıq.'}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                  { icon: Eye,
                    title: 'Platformanın Təsiri',
                    tone: 'blue',
                    features: [
                      'Gənclər uyğun fürsətləri daha asan və sürətli tapır',
                      'Təşkilatlar gənc auditoriyaya daha effektiv çatır',
                      'İcmalar inkişaf üçün möhkəm baza qurur',
                      'Birlikdə davamlı sosial dəyişiklik yaradırıq'
                    ] },
                  { icon: BookOpen,
                    title: 'Prinsiplərimiz',
                    tone: 'green',
                    features: [
                      'Bütün məlumatlar ictimai və rəsmi mənbələrdən yoxlanılır',
                      'Məlumatlardan heç vaxt kommersiya məqsədilə istifadə edilmir',
                      'İstifadəçi məlumatları tam məxfi və təhlükəsiz saxlanılır',
                      'Platforma yalnız təhsil və icma inkişafı məqsədləri daşıyır'
                    ] }
                ].map((purpose, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-5">
                      <div className={`w-11 h-11 rounded-xl ${purpose.tone === 'green' ? 'bg-emerald-100' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                        <purpose.icon className={`w-5 h-5 ${purpose.tone === 'green' ? 'text-emerald-700' : 'text-blue-700'}`} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{purpose.title}</h3>
                    </div>
                    <ul className="space-y-2.5 text-gray-700">
                      {purpose.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start text-sm md:text-base">
                          <CheckCircle className={`w-4 h-4 mt-0.5 mr-2.5 flex-shrink-0 ${purpose.tone === 'green' ? 'text-emerald-600' : 'text-blue-600'}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <section className="relative overflow-hidden rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-12 lg:px-14">
              <div className="pointer-events-none absolute inset-0 opacity-30">
                <div className="absolute -top-20 -left-10 h-56 w-56 rounded-full bg-cyan-300/50 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="mx-auto max-w-3xl text-center">
                  <h3 className="text-2xl font-black sm:text-3xl lg:text-4xl">{'İcmanın Gücü'}</h3>
                  <p className="mt-4 text-sm text-blue-100 sm:text-base lg:text-lg">{'Platformanın məhdudiyyətlərini və məxfilik tədbirlərini açıq və şəffaf şəkildə bölüşürük.'}</p>
                </div>

                <div className="mt-10 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
                    <h4 className="flex items-center text-lg font-semibold sm:text-xl">
                      <AlertTriangle className="mr-3 h-5 w-5 text-amber-200" />
                      {'Təklif Etdiklərimiz'}
                    </h4>
                    <ul className="mt-5 space-y-3 text-sm leading-relaxed text-blue-100 sm:text-base">
                      {dataLimitations.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
                    <h4 className="flex items-center text-lg font-semibold sm:text-xl">
                      <Sparkles className="mr-3 h-5 w-5 text-cyan-200" />
                      {'Bizə Qoşul'}
                    </h4>
                    <ul className="mt-5 space-y-3 text-sm leading-relaxed text-blue-100 sm:text-base">
                      {ethicalSafeguards.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-200" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-5 text-sm text-blue-100 sm:text-base">
                  <strong className="text-white">{'Öhdəliyimiz'}</strong> {'icma360 platforması gəncləri sosial təşəbbüslər, vakansiyalar, tədbirlər və inkişaf imkanları ilə birləşdirən rəqəmsal platformadır. İstifadəçi məlumatlarının məxfiliyini və təhlükəsizliyini təmin etməyə sadiqik. Platformada təqdim olunan bütün məlumatlar ictimai və rəsmi mənbələrdən əldə edilir və heç vaxt kommersiya məqsədilə istifadə edilmir. İcma360 yalnız təhsil və icma inkişafı məqsədləri üçün nəzərdə tutulub və istifadəçilərdən toplanan məlumatlar ən yüksək məxfilik standartlarına uyğun olaraq qorunur.'}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-slate-50/60">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{'İcmaya Qoşul'}</h2>
              <p className="mt-3 text-base md:text-lg text-gray-600 max-w-3xl mx-auto">{'Aktiv və gücləndirilmiş gənc nəslinin bir parçası ol. Birlikdə Azərbaycanda fürsət və əməkdaşlıq mühiti yaradaq.'}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 mb-10">
              {trustIndicators.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm hover:shadow-md transition-shadow">
                  <item.icon className="mx-auto mb-3 h-7 w-7 text-primary" />
                  <span className="text-sm font-semibold text-gray-900 sm:text-base">{item.title}</span>
                  <p className="mt-2 text-xs text-gray-600 sm:text-sm">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {isOrganizationUser ? (
                <>
                  <ButtonLink href={localePath('/dashboard/events/create')} variant="secondary" size="lg" hoverEffect="scale">
                    {'Tədbir Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="outline" size="lg" hoverEffect="scale">
                    {'Vakansiya Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/dashboard/profile')} variant="outline" size="lg" hoverEffect="scale">
                    {'Təşkilat Paneli'}
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href={localePath('/submit')} variant="secondary" size="lg" hoverEffect="scale">
                    {'Bloq Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/resources')} variant="outline" size="lg" hoverEffect="scale">
                    {'Fürsətləri Kəşf Et'}
                  </ButtonLink>
                </>
              )}
              <a href="#top" className="inline-flex items-center gap-2 text-primary font-semibold hover:text-blue-700 transition-colors">
                {'İndi Kəşf Et'}
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  ) }