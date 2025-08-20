import Link from 'next/link';

export default function ResourcesPage() {
  const resourceCategories = [
    {
      title: "Educational Materials",
      description: "Access comprehensive toolkits, courses, videos, and downloadable guides for social justice advocacy and education.",
      href: "/resources/materials",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "blue"
    },
    {
      title: "NGO Directory",
      description: "Discover and connect with non-governmental organizations working on social justice initiatives in your area.",
      href: "/resources/ngos",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "green"
    },
    {
      title: "Job Opportunities",
      description: "Find employment, volunteering, and internship opportunities with organizations focused on social justice.",
      href: "/resources/vacancies",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
        </svg>
      ),
      color: "purple"
    },
    {
      title: "Events & Trainings",
      description: "Discover upcoming events, workshops, and training programs to enhance your social justice advocacy skills.",
      href: "/resources/events",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "orange"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header */}
      <section className="bg-primary text-white py-20 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Social Justice Resources
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Comprehensive resources, tools, and opportunities to support social justice advocacy and community engagement.
            </p>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {resourceCategories.map((category, index) => (
                <Link
                  key={index}
                  href={category.href}
                  className="group card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-start">
                    <div className={`w-16 h-16 bg-${category.color}-100 rounded-lg flex items-center justify-center mr-6 flex-shrink-0 text-${category.color}-600 group-hover:bg-${category.color}-200 transition-colors duration-200`}>
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-200">
                        {category.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        {category.description}
                      </p>
                      <div className="flex items-center text-primary font-medium group-hover:text-primary-dark transition-colors duration-200">
                        Explore
                        <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-16 bg-white">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Quick Access
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/resources/materials"
                className="btn-primary text-center py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Browse Materials
              </Link>
              <Link
                href="/resources/ngos"
                className="btn-secondary text-center py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Find NGOs
              </Link>
              <Link
                href="/resources/vacancies"
                className="btn-primary text-center py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                View Jobs
              </Link>
              <Link
                href="/resources/events"
                className="btn-secondary text-center py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Upcoming Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Support Section */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto">
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
                    If you or someone you know is experiencing injustice or needs immediate support, help is available 24/7. 
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
                      Support Hotline: +994 12 555 1234
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}