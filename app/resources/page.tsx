import Link from 'next/link';
import { BookOpen, Users, Briefcase, Calendar, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

export default function ResourcesPage() {
  const resourceCategories = [
    {
      title: "Educational Materials",
      description: "Access comprehensive toolkits, courses, videos, and downloadable guides for social justice advocacy and education.",
      href: "/resources/materials",
      icon: <BookOpen className="w-8 h-8" />,
      color: "primary"
    },
    {
      title: "NGO Directory",
      description: "Discover and connect with non-governmental organizations working on social justice initiatives in your area.",
      href: "/resources/ngos",
      icon: <Users className="w-8 h-8" />,
      color: "accent"
    },
    {
      title: "Job Opportunities",
      description: "Find employment, volunteering, and internship opportunities with organizations focused on social justice.",
      href: "/resources/vacancies",
      icon: <Briefcase className="w-8 h-8" />,
      color: "primary"
    },
    {
      title: "Events",
      description: "Discover upcoming events, workshops, and programs to enhance your social justice advocacy skills.",
      href: "/resources/events",
      icon: <Calendar className="w-8 h-8" />,
      color: "accent"
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
                  className="group block"
                >
                  <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <div className={`w-16 h-16 ${category.color === 'primary' ? 'bg-primary/10 text-primary group-hover:bg-primary/20' : 'bg-accent/20 text-primary group-hover:bg-accent/30'} rounded-lg flex items-center justify-center mr-6 flex-shrink-0 transition-colors duration-200`}>
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
                            <ChevronRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
              <Link href="/resources/materials">
                 <Button className="text-center py-3 px-6">
                   Browse Materials
                 </Button>
               </Link>
              <Link href="/resources/ngos">
                 <Button variant="outline" className="text-center py-3 px-6">
                   Find NGOs
                 </Button>
               </Link>
              <Link href="/resources/vacancies">
                 <Button className="text-center py-3 px-6">
                   Find Vacancies
                 </Button>
               </Link>
              <Link href="/resources/events">
                 <Button variant="outline" className="text-center py-3 px-6">
                   Upcoming Events
                 </Button>
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Support Section */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-red-50 border-l-4 border-red-500">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
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
                      <Button className="bg-red-600 hover:bg-red-700 text-white">
                        <a href="tel:112">
                          Emergency: 112
                        </a>
                      </Button>
                      <Button variant="outline" className="bg-red-100 hover:bg-red-200 text-red-800 border-red-300">
                        <a href="tel:+994125551234">
                          Support Hotline: +994 12 555 1234
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}