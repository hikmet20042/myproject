import Image from 'next/image';

export default function Resources() {
  return (
  <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header */}
  <section className="bg-primary text-white py-20 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Educational Materials
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Comprehensive educational materials, toolkits, courses, and resources 
              to support social justice advocacy and education.
            </p>
          </div>
        </div>
      </section>

      {/* Main Resources */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto space-y-16">
            
            {/* UN Women Toolkit Section */}
            <div>
              <h2 className="text-3xl font-bold text-primary mb-8 flex items-center">
                <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
                UN Women Toolkit
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        HeForShe Toolkit
                      </h3>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium mb-3">
                        UN Women Official
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Comprehensive toolkit for engaging men and boys as advocates for gender equality. 
                    Includes practical guides, campaign materials, and implementation strategies.
                  </p>
                  <a
                    href="https://www.heforshe.org/en/take-action"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center"
                  >
                    Access Toolkit
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                <div className="card">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Women's Economic Empowerment
                      </h3>
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium mb-3">
                        UN Women Training
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    Training modules and resources for promoting women's economic participation 
                    and entrepreneurship in developing countries.
                  </p>
                  <a
                    href="https://www.unwomen.org/en/digital-library/training-materials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center"
                  >
                    View Training Materials
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Online Courses Section */}
            <div>
              <h2 className="text-3xl font-bold text-primary mb-8 flex items-center">
                <svg className="w-8 h-8 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                Online Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Coursera-Logo_600x600.svg/1200px-Coursera-Logo_600x600.svg.png" alt="Coursera" width={32} height={32} className="w-8 h-8 mr-3" />
                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                      Free Course
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Gender and Development
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    Explore how gender affects development outcomes and learn evidence-based approaches 
                    to promoting gender equality in development programs.
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>University of Edinburgh</span>
                    <span>6 weeks</span>
                  </div>
                  <a
                    href="https://www.coursera.org/learn/gender-development"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center inline-flex items-center justify-center"
                  >
                    Enroll Free
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                <div className="card hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Coursera-Logo_600x600.svg/1200px-Coursera-Logo_600x600.svg.png" alt="Coursera" width={32} height={32} className="w-8 h-8 mr-3" />
                    <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                      Certificate
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Human Rights Law
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    Understanding international human rights law and its application to gender equality, 
                    women's rights, and protection from discrimination.
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Lund University</span>
                    <span>8 weeks</span>
                  </div>
                  <a
                    href="https://www.coursera.org/learn/human-rights"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center inline-flex items-center justify-center"
                  >
                    Start Learning
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                <div className="card hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Coursera-Logo_600x600.svg/1200px-Coursera-Logo_600x600.svg.png" alt="Coursera" width={32} height={32} className="w-8 h-8 mr-3" />
                    <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium">
                      Specialization
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Women's Entrepreneurship
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    Learn strategies for supporting women entrepreneurs and creating inclusive 
                    business environments that promote gender equality.
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>University of Virginia</span>
                    <span>4 courses</span>
                  </div>
                  <a
                    href="https://www.coursera.org/specializations/entrepreneurship"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center inline-flex items-center justify-center"
                  >
                    View Specialization
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Video Resources Section */}
            <div>
              <h2 className="text-3xl font-bold text-primary mb-8 flex items-center">
                <svg className="w-8 h-8 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Educational Videos
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Understanding Gender-Based Violence
                  </h3>
                  <div className="aspect-video rounded-lg overflow-hidden mb-4">
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://www.youtube.com/embed/KQQVcBGvWrk"
                      title="Understanding Gender-Based Violence"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    This educational video from UN Women explains the different forms of gender-based violence, 
                    its root causes, and the importance of prevention strategies. Learn about recognizing warning 
                    signs and supporting survivors.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="card">
                    <div className="flex items-start">
                      <div className="w-20 h-16 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Content Warning
                        </h4>
                        <p className="text-gray-600 text-sm">
                          This video discusses sensitive topics related to gender-based violence. 
                          Viewer discretion is advised.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Additional Video Resources
                    </h4>
                    <ul className="space-y-3">
                      <li>
                        <a
                          href="https://www.youtube.com/watch?v=hg3umXU_qWc"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center"
                        >
                          HeForShe Campaign Launch
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.youtube.com/watch?v=D3O1MC1AqhM"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center"
                        >
                          Women's Economic Empowerment
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.youtube.com/watch?v=bhOo-bAz3g8"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center"
                        >
                          Gender Equality in Education
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Downloadable Resources Section */}
            <div>
              <h2 className="text-3xl font-bold text-primary mb-8 flex items-center">
                <svg className="w-8 h-8 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Downloadable Guides
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium">
                      PDF Guide
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Gender-Based Violence Prevention Toolkit
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    Comprehensive 50-page guide with evidence-based strategies for preventing gender-based violence 
                    in communities, workplaces, and educational institutions.
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>WHO/UN Women</span>
                    <span>2.3 MB</span>
                  </div>
                  <a
                    href="https://www.who.int/publications/i/item/9789241564007"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center inline-flex items-center justify-center"
                  >
                    Download PDF
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                </div>

                <div className="card hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                      PDF Handbook
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Women's Legal Rights in Azerbaijan
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    Legal handbook covering women's rights under Azerbaijani law, including domestic violence 
                    protections, workplace rights, and legal remedies.
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Ministry of Justice AZ</span>
                    <span>1.8 MB</span>
                  </div>
                  <button
                    className="btn-secondary w-full text-center inline-flex items-center justify-center"
                    disabled
                  >
                    Coming Soon
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>

                <div className="card hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                      PDF Report
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Global Gender Gap Report 2024
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    World Economic Forum's comprehensive analysis of gender parity across 146 countries, 
                    including Azerbaijan's progress and rankings.
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>World Economic Forum</span>
                    <span>4.2 MB</span>
                  </div>
                  <a
                    href="https://www.weforum.org/publications/global-gender-gap-report-2024/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center inline-flex items-center justify-center"
                  >
                    Download Report
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Emergency Support Section */}
            <div className="card bg-red-50 border-l-4 border-red-500">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-red-900 mb-3">
                    Need Immediate Help?
                  </h3>
                  <p className="text-red-800 mb-4 leading-relaxed">
                    If you or someone you know is experiencing gender-based violence, help is available 24/7. 
                    Contact emergency services or specialized support organizations.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="tel:112"
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 text-center"
                    >
                      Emergency: 112
                    </a>
                    <a
                      href="tel:+994125551234"
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-6 py-3 rounded-lg font-medium transition-colors duration-200 text-center"
                    >
                      Women's Support: +994 12 555 1234
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}