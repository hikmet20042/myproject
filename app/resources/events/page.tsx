'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState('events');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Sample events data
  const events = [
    {
      id: 1,
      title: "International Women's Day Celebration",
      organization: "Women's Rights Center",
      category: "Celebration",
      location: "Baku Cultural Center",
      date: "2024-03-08",
      time: "18:00",
      description: "Join us for an evening celebrating women's achievements and discussing ongoing challenges in gender equality. The event will feature keynote speakers, cultural performances, and networking opportunities.",
      applicationLink: "https://www.wrc.az/events/womens-day",
      applicationDeadline: "2024-03-05",
      capacity: 200,
      registered: 150,
      verified: true,
      image: null
    },
    {
      id: 2,
      title: "Human Rights Film Festival",
      organization: "Human Rights Watch Azerbaijan",
      category: "Festival",
      location: "Cinema Plus Ganjlik",
      date: "2024-02-20",
      time: "19:00",
      description: "A three-day film festival showcasing documentaries and films that highlight human rights issues around the world. Each screening will be followed by panel discussions with filmmakers and activists.",
      applicationLink: "https://www.hrw.org/film-festival",
      applicationDeadline: "2024-02-18",
      capacity: 300,
      registered: 89,
      verified: true,
      image: null
    },
    {
      id: 3,
      title: "Youth Climate Action Summit",
      organization: "Youth for Change",
      category: "Summit",
      location: "ADA University",
      date: "2024-04-22",
      time: "09:00",
      description: "Young activists and environmental advocates will gather to discuss climate change impacts and develop action plans for sustainable development in Azerbaijan.",
      applicationLink: "https://forms.google.com/climate-summit",
      applicationDeadline: "2024-04-15",
      capacity: 150,
      registered: 45,
      verified: false,
      image: null
    }
  ];

  // Sample trainings data
  const trainings = [
    {
      id: 1,
      title: "Digital Advocacy Training",
      organization: "Human Rights Watch Azerbaijan",
      category: "Digital Skills",
      location: "Online",
      startDate: "2024-02-15",
      endDate: "2024-02-17",
      time: "14:00-17:00",
      description: "Learn how to effectively use digital tools and social media for human rights advocacy. This three-day intensive training covers content creation, online campaign strategies, and digital security.",
      applicationLink: "https://www.hrw.org/training/digital-advocacy",
      applicationDeadline: "2024-02-10",
      capacity: 50,
      registered: 32,
      verified: true,
      requirements: [
        "Basic computer skills",
        "Access to internet and computer",
        "Interest in human rights advocacy"
      ],
      certificate: true
    },
    {
      id: 2,
      title: "Legal Aid Workshop",
      organization: "Women's Rights Center",
      category: "Legal Training",
      location: "WRC Training Center, Baku",
      startDate: "2024-03-10",
      endDate: "2024-03-12",
      time: "10:00-16:00",
      description: "Comprehensive training on providing legal aid to women facing discrimination and violence. Covers legal frameworks, counseling techniques, and case management.",
      applicationLink: "mailto:training@wrc.az",
      applicationDeadline: "2024-03-05",
      capacity: 30,
      registered: 18,
      verified: true,
      requirements: [
        "Law degree or legal background preferred",
        "Experience working with vulnerable populations",
        "Fluency in Azerbaijani"
      ],
      certificate: true
    },
    {
      id: 3,
      title: "Community Organizing Bootcamp",
      organization: "Youth for Change",
      category: "Leadership",
      location: "Ganja Youth Center",
      startDate: "2024-05-01",
      endDate: "2024-05-03",
      time: "09:00-18:00",
      description: "Intensive three-day bootcamp on community organizing, grassroots mobilization, and campaign planning. Perfect for emerging leaders and activists.",
      applicationLink: "https://forms.google.com/organizing-bootcamp",
      applicationDeadline: "2024-04-25",
      capacity: 40,
      registered: 12,
      verified: false,
      requirements: [
        "Age 18-30",
        "Commitment to attend all three days",
        "Basic English proficiency"
      ],
      certificate: false
    }
  ];

  const categories = ['all', 'Celebration', 'Festival', 'Summit', 'Workshop', 'Conference', 'Digital Skills', 'Legal Training', 'Leadership'];
  const locations = ['all', 'Baku', 'Ganja', 'Sumgayit', 'Online', 'Other'];
  const months = [
    'all', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentData = activeTab === 'events' ? events : trainings;

  const filteredData = currentData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || item.location.includes(selectedLocation);
    
    let matchesMonth = true;
    if (selectedMonth !== 'all') {
      const itemDate = new Date('date' in item ? (item as any).date : (item as any).startDate);
      const itemMonth = itemDate.toLocaleString('default', { month: 'long' });
      matchesMonth = itemMonth === selectedMonth;
    }
    
    return matchesSearch && matchesCategory && matchesLocation && matchesMonth;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      'Celebration': 'bg-pink-100 text-pink-800',
      'Festival': 'bg-purple-100 text-purple-800',
      'Summit': 'bg-blue-100 text-blue-800',
      'Workshop': 'bg-green-100 text-green-800',
      'Conference': 'bg-indigo-100 text-indigo-800',
      'Digital Skills': 'bg-cyan-100 text-cyan-800',
      'Legal Training': 'bg-amber-100 text-amber-800',
      'Leadership': 'bg-red-100 text-red-800'
    };
    return (colors as Record<string, string>)[category] || 'bg-gray-100 text-gray-800';
  };

  const isDeadlineNear = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const isDeadlinePassed = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (!end || start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate!)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header */}
      <section className="bg-primary text-white py-20 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Events & Trainings
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Discover upcoming events, workshops, and training programs to enhance your social justice advocacy skills.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-8 bg-white border-b">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 max-w-md">
              <button
                onClick={() => setActiveTab('events')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'events'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Events
              </button>
              <button
                onClick={() => setActiveTab('trainings')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'trainings'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Trainings
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  id="location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {locations.map(location => (
                    <option key={location} value={location}>
                      {location === 'all' ? 'All Locations' : location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                  Month
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {months.map(month => (
                    <option key={month} value={month}>
                      {month === 'all' ? 'All Months' : month}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            {/* Results Count */}
            <div className="mb-8">
              <p className="text-gray-600">
                Showing {filteredData.length} of {currentData.length} {activeTab}
              </p>
            </div>

            {/* Timeline View */}
            <div className="space-y-8">
              {filteredData.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Timeline Line */}
                  {index < filteredData.length - 1 && (
                    <div className="absolute left-8 top-16 w-0.5 h-full bg-gray-200 z-0"></div>
                  )}
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-6 top-8 w-4 h-4 bg-primary rounded-full border-4 border-white shadow-lg z-10"></div>
                  
                  {/* Content Card */}
                  <div className="ml-16 card hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {item.title}
                            </h3>
                            <p className="text-lg text-gray-700 mb-3">
                              {item.organization}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${getCategoryColor(item.category)}`}>
                                {item.category}
                              </span>
                              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-medium">
                                📍 {item.location}
                              </span>
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                                📅 {activeTab === 'events' ? formatDate((item as any).date) : formatDateRange((item as any).startDate, (item as any).endDate)}
                              </span>
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                                🕐 {item.time}
                              </span>
                              {item.verified && (
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
                          {item.description}
                        </p>

                        {/* Training Requirements */}
                        {activeTab === 'trainings' && (item as any).requirements && (item as any).requirements.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">
                              Requirements:
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                              {(item as any).requirements.map((req: string, index: number) => (
                                <li key={index}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>
                              {item.registered}/{item.capacity} registered
                            </span>
                            <span className={`font-medium ${
                              isDeadlinePassed(item.applicationDeadline) 
                                ? 'text-red-600' 
                                : isDeadlineNear(item.applicationDeadline) 
                                  ? 'text-orange-600' 
                                  : 'text-gray-600'
                            }`}>
                              Apply by: {formatDate(item.applicationDeadline)}
                              {isDeadlineNear(item.applicationDeadline) && !isDeadlinePassed(item.applicationDeadline) && (
                                <span className="ml-1 text-orange-600">⚠️ Soon</span>
                              )}
                              {isDeadlinePassed(item.applicationDeadline) && (
                                <span className="ml-1 text-red-600">❌ Closed</span>
                              )}
                            </span>
                            {activeTab === 'trainings' && (item as any).certificate && (
                              <span className="text-green-600 font-medium">🏆 Certificate provided</span>
                            )}
                          </div>
                          
                          {!isDeadlinePassed(item.applicationDeadline) && item.registered < item.capacity && (
                            <a
                              href={item.applicationLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary inline-flex items-center"
                            >
                              {activeTab === 'events' ? 'Register' : 'Apply'}
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                          
                          {item.registered >= item.capacity && (
                            <span className="btn-secondary opacity-50 cursor-not-allowed">
                              Full
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No {activeTab} Found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or filters to find more {activeTab}.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLocation('all');
                    setSelectedMonth('all');
                  }}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Create Event/Training Section */}
      <section className="py-16 bg-white">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Want to Create an Event or Training?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              If you're an approved NGO, you can create and manage events and training programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/login"
                className="btn-primary inline-flex items-center"
              >
                Login to Create
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/auth/register?type=ngo"
                className="btn-secondary inline-flex items-center"
              >
                Register as NGO
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}