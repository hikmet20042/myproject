'use client'

import { ButtonLink } from '@/components/ui'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { Badge } from '@/components/ui/Badge'
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
  Users,
  Mail,
  Globe } from 'lucide-react'

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
    <div className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-blue-100/60 blur-3xl" />

        <div className="section-padding relative z-10">
          <div className="mx-auto max-w-5xl text-center">
            <Badge variant="primary" size="md" icon={Sparkles} className="border border-slate-200 bg-white shadow-sm mb-8">
              icma360 Haqqında
            </Badge>

            <h1 className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              {'icma360 Haqqında'}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              {'Gəncləri sosial təşəbbüslər, vakansiyalar, tədbirlər və inkişaf imkanları ilə birləşdirən rəqəmsal platformadır.'}
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {isOrganizationUser ? (
                <>
                  <ButtonLink href={localePath('/dashboard/events/create')} variant="secondary" size="lg">
                    {'Tədbir Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="outline" size="lg">
                    {'Vakansiya Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/dashboard/profile')} variant="outline" size="lg">
                    {'Təşkilat Paneli'}
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href={localePath('/submit')} variant="secondary" size="lg">
                    {'Bloq Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/resources')} variant="outline" size="lg">
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
                <h2 className="text-3xl font-black text-slate-900 md:text-4xl">{'Gənclərin Üzləşdiyi Problemlər'}</h2>
                <p className="mx-auto mt-2 max-w-3xl text-slate-600">{'Azərbaycanda gənclər Təşkilatlardəki fürsətlər, təlimlər, könüllü proqramlar və vakansiyalar haqqında vahid və etibarlı məlumat mənbəyi tapa bilmirlər.'}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 md:p-8">
                  <div className="flex items-center mb-5">
                    <div className="w-11 h-11 rounded-md bg-red-100 flex items-center justify-center mr-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{'Əsas Çətinliklər'}</h3>
                  </div>
                  <div className="space-y-3 text-slate-600">
                    {[
                      { title: 'Dağınıq Məlumat', text: 'Fürsətlər haqqında məlumatlar müxtəlif platformalarda səpələnib və sistemli şəkildə təqdim olunmur. Bu da gənclərin özlərinə uyğun proqramları tapmağını çətinləşdirir.' },
                      { title: 'Zəif Əlaqə', text: 'Təşkilatlar və gənclər arasında bilavasitə əlaqə qurmaq mümkün olmadığı üçün gənclərin sosial təşəbbüslərə qoşulması çətinləşir.' },
                      { title: 'Məhdud Paylaşım İmkanları', text: 'Təcrübələrini və uğur hekayələrini paylaşmaq üçün xüsusi platforma olmadığından gənclər bir-birindən öyrənə və motivasiya əldə edə bilmirlər.' },
                      { title: 'Resurslara Çıxışda Problemlər', text: 'Şəxsi və peşəkar inkişaf materiallarına çıxış məhdud olduğu üçün gənclərin potensialını reallaşdırmaq çətinləşdirir.' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 mr-3" />
                        <p className="text-sm md:text-base"><strong className="text-slate-900">{item.title}:</strong> {item.text}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 md:p-8">
                  <div className="flex items-center mb-5">
                    <div className="w-11 h-11 rounded-md bg-emerald-100 flex items-center justify-center mr-3">
                      <Lightbulb className="w-5 h-5 text-emerald-700" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{'Bizim Həllimiz'}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm md:text-base text-emerald-800 font-bold">{'icma360 - gəncləri Təşkilatlar, vakansiyalar, tədbirlər və inkişaf resursları ilə bir araya gətirən vahid platformadır:'}</p>
                    </div>
                    <ul className="space-y-2.5">
                      {[
                        'Vakansiya, tədbir və bloqları kateqoriyalara görə axtarın',
                        'Təşkilatlar və icma təşəbbüsləri ilə birbaşa əlaqə saxlayın',
                        'Öz təcrübələrinizi paylaşın və başqalarının yazılarından öyrənin',
                        'Pulsuz təhsil və inkişaf materiallarından istifadə edin'
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center text-sm text-slate-700 md:text-base">
                          <XCircle className="w-4 h-4 text-emerald-600 mr-2.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>
            </div>

            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900 md:text-4xl">{'Platformanın İmkanları'}</h2>
                <p className="mx-auto mt-2 max-w-3xl text-slate-600">{'Gəncləri fürsətlər, icma və təhsil resursları ilə bir araya gətirən mərkəzi məkan.'}</p>
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
                  <Card key={idx} className="p-6">
                    <div className={`w-11 h-11 rounded-md ${solution.tone === 'green' ? 'bg-emerald-100' : 'bg-blue-100'} flex items-center justify-center mb-4`}>
                      <solution.icon className={`w-5 h-5 ${solution.tone === 'green' ? 'text-emerald-700' : 'text-blue-700'}`} />
                    </div>
                    <h3 className="mb-2 text-lg font-black text-slate-900">{solution.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-slate-600">{solution.desc}</p>
                    <div className="rounded-md p-3 bg-slate-50">
                      <div className="space-y-2">
                        {solution.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-center">
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${solution.tone === 'green' ? 'bg-emerald-600' : 'bg-blue-600'}`} />
                            <span className={`text-xs ${solution.tone === 'green' ? 'text-emerald-800' : 'text-blue-800'}`}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900 md:text-4xl">{'Nə üçün icma360?'}</h2>
                <p className="mx-auto mt-2 max-w-3xl text-slate-600">{'Gənclər və təşkilatlar arasında körpü rolunu oynayaraq şəffaf və əlçatan bir ekosistem yaradırıq.'}</p>
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
                  <Card key={idx} className="p-6 md:p-8">
                    <div className="flex items-center mb-5">
                      <div className={`w-11 h-11 rounded-md ${purpose.tone === 'green' ? 'bg-emerald-100' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                        <purpose.icon className={`w-5 h-5 ${purpose.tone === 'green' ? 'text-emerald-700' : 'text-blue-700'}`} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">{purpose.title}</h3>
                    </div>
                    <ul className="space-y-2.5 text-slate-700">
                      {purpose.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start text-sm md:text-base">
                          <CheckCircle className={`w-4 h-4 mt-0.5 mr-2.5 flex-shrink-0 ${purpose.tone === 'green' ? 'text-emerald-600' : 'text-blue-600'}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>

            <section className="relative overflow-hidden rounded-xl border border-blue-200/60 bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-600 px-6 py-10 text-white shadow-elevated sm:px-10 sm:py-12 lg:px-14">
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
                  <div className="rounded-md border border-white/20 bg-white/10 p-6 backdrop-blur">
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

                  <div className="rounded-md border border-white/20 bg-white/10 p-6 backdrop-blur">
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

                <div className="mt-8 rounded-md border border-white/20 bg-white/10 p-5 text-sm text-blue-100 sm:text-base">
                  <strong className="text-white">{'Öhdəliyimiz'}</strong> {'icma360 platforması gəncləri sosial təşəbbüslər, vakansiyalar, tədbirlər və inkişaf imkanları ilə birləşdirən rəqəmsal platformadır. İstifadəçi məlumatlarının məxfiliyini və təhlükəsizliyini təmin etməyə sadiqik. Platformada təqdim olunan bütün məlumatlar ictimai və rəsmi mənbələrdən əldə edilir və heç vaxt kommersiya məqsədilə istifadə edilmir. İcma360 yalnız təhsil və icma inkişafı məqsədləri üçün nəzərdə tutulub və istifadəçilərdən toplanan məlumatlar ən yüksək məxfilik standartlarına uyğun olaraq qorunur.'}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="bg-slate-50/60 py-16 md:py-20">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 md:text-4xl">{'Biz Kimik'}</h2>
              <p className="mx-auto mt-3 max-w-3xl text-base text-slate-600 md:text-lg">{'icma360 Azərbaycanda gənclər üçün pulsuz imkan platformasıdır. Missiyamız gəncləri iş, təcrübə, təlim, könüllülük və tədbir imkanları ilə birləşdirməkdir.'}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{'Platforma'}</h3>
                    <p className="text-sm text-slate-600">{'icma360.org — Azərbaycanda gənclər üçün iş, təcrübə, təlim və könüllülük imkanlarını bir yerdə təqdim edən rəqəmsal platformadır.'}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{'Əlaqə'}</h3>
                    <p className="text-sm text-slate-600">{'Suallarınız və təklifləriniz üçün bizimlə əlaqə saxlayın:'}</p>
                    <a href="mailto:info@icma360.org" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block">info@icma360.org</a>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{'Məxfilik'}</h3>
                    <p className="text-sm text-slate-600">{'İstifadəçi məlumatlarının qorunması bizim prioritetimizdir. Ətraflı məlumat üçün:'}</p>
                    <a href={localePath('/privacy')} className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block">Məxfilik Siyasəti</a>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 md:text-4xl">{'İcmaya Qoşul'}</h2>
              <p className="mx-auto mt-3 max-w-3xl text-base text-slate-600 md:text-lg">{'Aktiv və gücləndirilmiş gənc nəslinin bir parçası ol. Birlikdə Azərbaycanda fürsət və əməkdaşlıq mühiti yaradaq.'}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 mb-10">
              {trustIndicators.map((item, idx) => (
                <Card key={idx} className="p-5 text-center">
                  <item.icon className="mx-auto mb-3 h-7 w-7 text-primary" />
                  <span className="text-sm font-bold text-slate-900 sm:text-base">{item.title}</span>
                  <p className="mt-2 text-xs text-slate-600 sm:text-sm">{item.description}</p>
                </Card>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {isOrganizationUser ? (
                <>
                  <ButtonLink href={localePath('/dashboard/events/create')} variant="secondary" size="lg">
                    {'Tədbir Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/dashboard/vacancies/create')} variant="outline" size="lg">
                    {'Vakansiya Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/dashboard/profile')} variant="outline" size="lg">
                    {'Təşkilat Paneli'}
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href={localePath('/submit')} variant="secondary" size="lg">
                    {'Bloq Paylaş'}
                  </ButtonLink>
                  <ButtonLink href={localePath('/resources')} variant="outline" size="lg">
                    {'Fürsətləri Kəşf Et'}
                  </ButtonLink>
                </>
              )}
              <ButtonLink href="#top" variant="ghost" size="md" icon={ArrowRight} iconPosition="right" shadow="none">
                {'İndi Kəşf Et'}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  ) }
