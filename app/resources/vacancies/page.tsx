'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function VacanciesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');

  // Sample vacancy data - this will be replaced with real data from the database
  const vacancies = [
    {
      id: 1,
      title: "Human Rights Advocate",
      organization: "Human Rights Watch Azerbaijan",
      type: "Full-time",
      location: "Baku",
      experience: "2-5 years",
      salary: "Competitive",
      deadline: "2024-02-15",
      description: "Join our team to research, document, and advocate for human rights issues in Azerbaijan. You will work on investigating violations, writing reports, and engaging with government officials and civil society.",
      requirements: [
        "Bachelor's degree in Law, Political Science, or related field",
        "2+ years experience in human rights or advocacy work",
        "Fluency in Azerbaijani and English",
        "Strong research and writing skills"
      ],
      applicationProcess: {
        applicationLink: "https://www.hrw.org/careers"
      },
      applicationLink: "https://www.hrw.org/careers", // Fallback for old structure
      postedDate: "2024-01-15",
      verified: true
    },
    {
      id: 2,
      title: "Volunteer Coordinator",
      organization: "Women's Rights Center",
      type: "Volunteer",
      location: "Baku",
      experience: "Entry level",
      salary: "Volunteer",
      deadline: "2024-02-28",
      description: "Help coordinate volunteer activities and community outreach programs. This is a great opportunity for students or early-career professionals to gain experience in nonprofit management.",
      requirements: [
        "High school diploma or equivalent",
        "Interest in women's rights and social justice",
        "Good organizational and communication skills",
        "Availability for 10-15 hours per week"
      ],
      applicationProcess: {
        email: "volunteer@wrc.az"
      },
      applicationLink: "mailto:volunteer@wrc.az", // Fallback for old structure
      postedDate: "2024-01-20",
      verified: true
    },
    {
      id: 3,
      title: "Social Media Intern",
      organization: "Youth for Change",
      type: "Internship",
      location: "Remote",
      experience: "Entry level",
      salary: "Stipend",
      deadline: "2024-02-10",
      description: "Support our digital advocacy efforts by creating content, managing social media accounts, and engaging with our online community. Perfect for students studying communications, marketing, or related fields.",
      requirements: [
        "Currently enrolled in university",
        "Experience with social media platforms",
        "Basic graphic design skills preferred",
        "Passion for social justice causes"
      ],
      applicationProcess: {
        applicationLink: "https://forms.google.com/intern-application"
      },
      applicationLink: "https://forms.google.com/intern-application", // Fallback for old structure
      postedDate: "2024-01-10",
      verified: false
    }
  ];

  const types = ['all', 'Full-time', 'Part-time', 'Volunteer', 'Internship', 'Contract'];
  const locations = ['all', 'Baku', 'Ganja', 'Sumgayit', 'Remote', 'Other'];
  const experienceLevels = ['all', 'Entry level', '1-2 years', '2-5 years', '5+ years'];

  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch = vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacancy.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacancy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || vacancy.type === selectedType;
    const matchesLocation = selectedLocation === 'all' || vacancy.location === selectedLocation;
    const matchesExperience = selectedExperience === 'all' || vacancy.experience === selectedExperience;
    
    return matchesSearch && matchesType && matchesLocation && matchesExperience;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Full-time': return 'bg-green-100 text-green-800';
      case 'Part-time': return 'bg-blue-100 text-blue-800';
      case 'Volunteer': return 'bg-purple-100 text-purple-800';
      case 'Internship': return 'bg-orange-100 text-orange-800';
      case 'Contract': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isDeadlinePassed = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header */}
      <section className="bg-primary text-white py-20 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Job Opportunities
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Find employment, volunteering, and internship opportunities with organizations focused on social justice.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Jobs
                </label>
                <Input
                  type="text"
                  id="search"
                  placeholder="Search by title, organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  options={types.map(type => ({
                    value: type,
                    label: type === 'all' ? 'All Types' : type
                  }))}
                  placeholder="All Types"
                  selectSize="md"
                />
              </div>

              {/* Location Filter */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  options={locations.map(location => ({
                    value: location,
                    label: location === 'all' ? 'All Locations' : location
                  }))}
                  placeholder="All Locations"
                  selectSize="md"
                />
              </div>

              {/* Experience Filter */}
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  Experience
                </label>
                <Select
                  value={selectedExperience}
                  onChange={(e) => setSelectedExperience(e.target.value)}
                  options={experienceLevels.map(level => ({
                    value: level,
                    label: level === 'all' ? 'All Levels' : level
                  }))}
                  placeholder="All Levels"
                  selectSize="md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            {/* Results Count */}
            <div className="mb-8">
              <p className="text-gray-600">
                Showing {filteredVacancies.length} of {vacancies.length} opportunities
              </p>
            </div>

            {/* Job Cards */}
            <div className="space-y-6">
              {filteredVacancies.map(vacancy => (
                <div key={vacancy.id} className={`card hover:shadow-xl transition-all duration-300 ${isDeadlinePassed(vacancy.deadline) ? 'opacity-60' : ''}`}>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {vacancy.title}
                          </h3>
                          <p className="text-lg text-gray-700 mb-3">
                            {vacancy.organization}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${getTypeColor(vacancy.type)}`}>
                              {vacancy.type}
                            </span>
                            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-medium">
                              📍 {vacancy.location}
                            </span>
                            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-medium">
                              💼 {vacancy.experience}
                            </span>
                            {vacancy.salary && (
                              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-medium">
                                💰 {vacancy.salary}
                              </span>
                            )}
                            {vacancy.verified && (
                              <span className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {vacancy.description}
                      </p>

                      {vacancy.requirements && vacancy.requirements.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">
                            Requirements:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {vacancy.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Posted: {new Date(vacancy.postedDate).toLocaleDateString()}</span>
                          <span className={`font-medium ${
                            isDeadlinePassed(vacancy.deadline) 
                              ? 'text-red-600' 
                              : isDeadlineNear(vacancy.deadline) 
                                ? 'text-orange-600' 
                                : 'text-gray-600'
                          }`}>
                            Deadline: {new Date(vacancy.deadline).toLocaleDateString()}
                            {isDeadlineNear(vacancy.deadline) && !isDeadlinePassed(vacancy.deadline) && (
                              <span className="ml-1 text-orange-600">⚠️ Soon</span>
                            )}
                            {isDeadlinePassed(vacancy.deadline) && (
                              <span className="ml-1 text-red-600">❌ Expired</span>
                            )}
                          </span>
                        </div>
                        
                        {!isDeadlinePassed(vacancy.deadline) && (
                          <div>
                            {/* Application Process */}
                            {vacancy.applicationProcess?.applicationLink && (
                              <a
                                href={vacancy.applicationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="primary" className="inline-flex items-center">
                                  Apply Now
                                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </Button>
                              </a>
                            )}
                            {vacancy.applicationProcess?.email && (
                              <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                  To apply, send your CV to:
                                </p>
                                <a
                                  href={`mailto:${vacancy.applicationProcess.email}?subject=Application for ${vacancy.title}`}
                                >
                                  <Button variant="primary" className="inline-flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {vacancy.applicationProcess.email}
                                  </Button>
                                </a>
                              </div>
                            )}
                            {/* Fallback for old data structure */}
                            {!vacancy.applicationProcess && vacancy.applicationLink && (
                              <a
                                href={vacancy.applicationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="primary" className="inline-flex items-center">
                                  Apply Now
                                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </Button>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredVacancies.length === 0 && (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Opportunities Found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or filters to find more opportunities.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                    setSelectedLocation('all');
                    setSelectedExperience('all');
                  }}
                  variant="primary"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Post Opportunity Section */}
      <section className="py-16 bg-white">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Have an Opportunity to Share?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              If you're an approved NGO, you can post job opportunities, volunteer positions, and internships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button variant="primary" className="inline-flex items-center">
                  Login to Post
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
              <Link href="/auth/register?type=ngo">
                <Button variant="secondary" className="inline-flex items-center">
                  Register as NGO
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}