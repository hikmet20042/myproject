'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NGOsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Sample NGO data - this will be replaced with real data from the database
  const ngos = [
    {
      id: 1,
      name: "Human Rights Watch Azerbaijan",
      description: "Defending human rights and promoting justice through research, advocacy, and public education.",
      category: "Human Rights",
      location: "Baku",
      website: "https://www.hrw.org",
      email: "info@hrw.org",
      phone: "+994 12 555 0001",
      verified: true,
      logo: null
    },
    {
      id: 2,
      name: "Women's Rights Center",
      description: "Empowering women and promoting gender equality through legal aid, education, and advocacy programs.",
      category: "Women's Rights",
      location: "Baku",
      website: "https://www.wrc.az",
      email: "contact@wrc.az",
      phone: "+994 12 555 0002",
      verified: true,
      logo: null
    },
    {
      id: 3,
      name: "Youth for Change",
      description: "Mobilizing young people to create positive social change through community engagement and activism.",
      category: "Youth Development",
      location: "Ganja",
      website: "https://www.youthforchange.az",
      email: "info@youthforchange.az",
      phone: "+994 22 555 0003",
      verified: false,
      logo: null
    }
  ];

  const categories = ['all', 'Human Rights', 'Women\'s Rights', 'Youth Development', 'Education', 'Environment', 'Healthcare'];
  const locations = ['all', 'Baku', 'Ganja', 'Sumgayit', 'Mingachevir', 'Other'];

  const filteredNGOs = ngos.filter(ngo => {
    const matchesSearch = ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ngo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ngo.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || ngo.location === selectedLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200">
      {/* Header */}
      <section className="bg-primary text-white py-20 transition-colors duration-200">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              NGO Directory
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Discover and connect with non-governmental organizations working on social justice initiatives.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search NGOs
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name or description..."
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
            </div>
          </div>
        </div>
      </section>

      {/* NGO Listings */}
      <section className="py-16">
        <div className="section-padding">
          <div className="max-w-6xl mx-auto">
            {/* Results Count */}
            <div className="mb-8">
              <p className="text-gray-600">
                Showing {filteredNGOs.length} of {ngos.length} organizations
              </p>
            </div>

            {/* NGO Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredNGOs.map(ngo => (
                <div key={ngo.id} className="card hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start">
                      <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                        {ngo.logo ? (
                          <img src={ngo.logo} alt={ngo.name} className="w-12 h-12 rounded-lg" />
                        ) : (
                          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {ngo.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                            {ngo.category}
                          </span>
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-medium">
                            {ngo.location}
                          </span>
                          {ngo.verified && (
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
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {ngo.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    {ngo.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        <a href={ngo.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {ngo.website}
                        </a>
                      </div>
                    )}
                    {ngo.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${ngo.email}`} className="text-primary hover:underline">
                          {ngo.email}
                        </a>
                      </div>
                    )}
                    {ngo.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${ngo.phone}`} className="text-primary hover:underline">
                          {ngo.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button className="btn-primary flex-1">
                      Contact NGO
                    </button>
                    <button className="btn-secondary">
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredNGOs.length === 0 && (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No NGOs Found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or filters to find more organizations.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLocation('all');
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

      {/* Register as NGO Section */}
      <section className="py-16 bg-white">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Are you an NGO?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join our platform to connect with the community, share your work, and access additional features.
            </p>
            <Link
              href="/auth/register?type=ngo"
              className="btn-primary inline-flex items-center"
            >
              Register Your NGO
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}