export default function About() {
  return (
  <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header Section */}
  <section className="bg-primary text-white py-20 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Our Mission
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Bridging the data gap in gender equality through transparent technology, 
              education, and community engagement in Azerbaijan.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto space-y-16">
            
            {/* The Problem */}
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-primary mb-4">
                  The Data Challenge in Azerbaijan
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Understanding why reliable gender-based data is scarce and how we're working to address this critical gap.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Why Data is Unreliable
                    </h3>
                  </div>
                  <div className="space-y-4 text-gray-600">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm leading-relaxed">
                        <strong className="text-gray-900">Cultural stigma</strong> prevents many victims from reporting incidents to authorities, leading to significant underreporting.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm leading-relaxed">
                        <strong className="text-gray-900">Institutional gaps</strong> in data collection systems result in inconsistent recording and classification of gender-based violence cases.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm leading-relaxed">
                        <strong className="text-gray-900">Limited transparency</strong> in official statistics makes it difficult for researchers and advocates to access comprehensive data.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm leading-relaxed">
                        <strong className="text-gray-900">Resource constraints</strong> affect the ability to maintain systematic data collection and analysis across all regions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      The Impact
                    </h3>
                  </div>
                  <div className="space-y-4 text-gray-600">
                    <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                      <p className="text-sm leading-relaxed text-orange-800">
                        Without reliable data, it becomes nearly impossible to:
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Develop effective prevention strategies
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Allocate resources to areas of greatest need
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Measure progress toward gender equality goals
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Advocate for policy changes based on evidence
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Solution */}
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-primary mb-4">
                  Our Technology-Driven Approach
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  How we use AI and news analysis to create transparent, accessible data about gender equality issues.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    News Scraping
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    We systematically collect and analyze news reports from Azerbaijani media sources to identify 
                    publicly reported incidents of gender-based violence and discrimination.
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-left space-y-2 text-xs text-blue-800">
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        Multiple news sources daily
                      </div>
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        Real-time monitoring
                      </div>
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        Source verification
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    AI Classification
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Advanced machine learning algorithms analyze and categorize incidents by type, severity, 
                    location, and other relevant factors to create structured, searchable data.
                  </p>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-left space-y-2 text-xs text-green-800">
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        Natural language processing
                      </div>
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        Pattern recognition
                      </div>
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        Human oversight
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Data Visualization
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    We transform complex data into accessible charts, maps, and trends that help everyone 
                    understand the scope and patterns of gender equality challenges.
                  </p>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-left space-y-2 text-xs text-purple-800">
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                        Interactive charts
                      </div>
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                        Regional breakdowns
                      </div>
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                        Trend analysis
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Purpose */}
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-primary mb-4">
                  How Our Platform Serves the Community
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Transparency, education, and empowerment through accessible data and community engagement.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Transparent Statistics
                    </h3>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Open methodology - we explain exactly how data is collected and processed</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Source attribution - every data point is linked to its original news source</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Regular updates - data is refreshed continuously as new reports emerge</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Limitation disclosure - we clearly state what our data can and cannot tell us</span>
                    </li>
                  </ul>
                </div>

                <div className="card">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Education & Resources
                    </h3>
                  </div>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-indigo-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Comprehensive resource library with international best practices</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-indigo-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Access to training materials and online courses from leading institutions</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-indigo-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Community blog platform for sharing experiences and solutions</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-indigo-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Emergency resources and support service directories</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Limitations & Ethics */}
            <div className="card bg-amber-50 border-l-4 border-amber-500">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-900 mb-4">
                    Important Limitations & Ethical Considerations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-amber-800">
                    <div>
                      <h4 className="font-semibold mb-2">Data Limitations</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Only captures publicly reported incidents</li>
                        <li>• May not reflect true scale due to underreporting</li>
                        <li>• AI classification may contain biases or errors</li>
                        <li>• Regional coverage varies by media presence</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Ethical Standards</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• No personal information is collected or displayed</li>
                        <li>• Victim privacy and dignity are paramount</li>
                        <li>• Data is used only for awareness and research</li>
                        <li>• Platform complies with ethical AI principles</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                    <p className="text-sm text-amber-900">
                      <strong>Disclaimer:</strong> This data should complement, not replace, official statistics and professional expertise. 
                      Always verify critical information with authoritative sources and consult experts for decision-making.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <div className="card bg-primary text-white">
                <h3 className="text-2xl font-bold mb-4">Join the Movement</h3>
                <p className="text-lg text-gray-100 mb-6 max-w-2xl mx-auto">
                  Help us build a more informed, equitable society. Whether you're a researcher, advocate, 
                  policymaker, or concerned citizen, there are many ways to contribute to this mission.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/submit" 
                    className="bg-white text-primary hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Share Your Story
                  </a>
                  <a 
                    href="/resources" 
                    className="border border-white text-white hover:bg-white hover:text-primary px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Access Resources
                  </a>
                  <a 
                    href="/stats" 
                    className="border border-white text-white hover:bg-white hover:text-primary px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    View Statistics
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
