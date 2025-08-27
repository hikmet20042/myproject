'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, ExternalLink, Clock, Tag, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Event {
  _id: string
  title: string
  description: string
  category: string
  eventType: 'event' | 'training' | 'workshop' | 'conference' | 'seminar'
  eventDate: string
  endDate?: string
  location: {
    type: 'online' | 'physical' | 'hybrid'
    address?: string
    city?: string
    country?: string
    onlineLink?: string
  }
  applicationLink?: string
  applicationDeadline?: string
  maxParticipants?: number
  currentParticipants: number
  tags: string[]
  imageUrl?: string
  createdBy: {
    _id: string
    name: string
    ngoProfile?: {
      organizationName: string
    }
  }
  organizationName?: string
  isApproved: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
  // Training-specific fields
  duration?: string
  schedule?: {
    startTime: string
    endTime: string
    timezone?: string
  }
  prerequisites?: string[]
  learningOutcomes?: string[]
  certification?: {
    provided: boolean
    type?: string
    accreditedBy?: string
  }
  cost?: {
    isFree: boolean
    amount?: number
    currency?: string
    scholarshipAvailable?: boolean
  }
  targetAudience?: string[]
  syllabus?: {
    modules: Array<{
      title: string
      description: string
      duration: string
    }>
  }
}

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const url = '/api/events?status=approved&limit=50';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        setError('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'all', 'Advocacy', 'Awareness', 'Capacity Building', 'Community Outreach', 
    'Conference', 'Education', 'Emergency Response', 'Fundraising', 'Health', 
    'Human Rights', 'Legal Aid', 'Networking', 'Policy', 'Research', 'Training', 
    'Workshop', 'Youth Development', 'Other'
  ];
  const locations = ['all', 'Baku', 'Ganja', 'Sumgayit', 'Online', 'Other'];
  const months = [
    'all', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const eventTypes = ['all', 'event', 'training', 'workshop', 'conference', 'seminar'];

  // Filter events based on search and filters
  const filteredData = events.filter(event => {
    const organizationName = event.organizationName || event.createdBy?.ngoProfile?.organizationName || event.createdBy?.name || 'Unknown Organization';
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    
    // Event type filter
    const matchesEventType = selectedEventType === 'all' || event.eventType === selectedEventType;
    
    // Location filter - check location type and city
    const locationString = event.location.type === 'online' ? 'online' : 
                          event.location.city || event.location.address || 'unknown';
    const matchesLocation = selectedLocation === 'all' || 
                           locationString.toLowerCase().includes(selectedLocation.toLowerCase());
    
    // Month filter
    const eventDate = new Date(event.eventDate);
    const eventMonth = isNaN(eventDate.getTime()) ? -1 : eventDate.getMonth();
    const matchesMonth = selectedMonth === 'all' || eventMonth === -1 ||
                        (selectedMonth === 'January' && eventMonth === 0) ||
                        (selectedMonth === 'February' && eventMonth === 1) ||
                        (selectedMonth === 'March' && eventMonth === 2) ||
                        (selectedMonth === 'April' && eventMonth === 3) ||
                        (selectedMonth === 'May' && eventMonth === 4) ||
                        (selectedMonth === 'June' && eventMonth === 5) ||
                        (selectedMonth === 'July' && eventMonth === 6) ||
                        (selectedMonth === 'August' && eventMonth === 7) ||
                        (selectedMonth === 'September' && eventMonth === 8) ||
                        (selectedMonth === 'October' && eventMonth === 9) ||
                        (selectedMonth === 'November' && eventMonth === 10) ||
                        (selectedMonth === 'December' && eventMonth === 11);
    
    return matchesSearch && matchesCategory && matchesEventType && matchesLocation && matchesMonth;
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
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
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
              Events
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Discover upcoming events, workshops, and programs to enhance your social justice advocacy skills.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding py-16">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2"
                />
              </div>

              {/* Category Filter */}
              <Select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={categories.map(category => ({
                  value: category,
                  label: category === 'all' ? 'All Categories' : category
                }))}
                placeholder="All Categories"
                selectSize="md"
              />

              {/* Location Filter */}
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

              {/* Month Filter */}
              <Select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                options={months.map(month => ({
                  value: month,
                  label: month === 'all' ? 'All Months' : month
                }))}
                placeholder="All Months"
                selectSize="md"
              />

              {/* Event Type Filter */}
              <Select 
                  value={selectedEventType} 
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  options={eventTypes.map(type => ({
                    value: type,
                    label: type === 'all' ? 'All Types' : type
                  }))}
                  placeholder="All Types"
                  selectSize="md"
                />

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLocation('all');
                  setSelectedMonth('all');
                  setSelectedEventType('all');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchEvents}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Events Grid */}
          {!loading && !error && (
            <>
              {filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg mb-4">No events found matching your criteria.</p>
                  <p className="text-gray-500">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredData.map((event) => {
                    const organizationName = event.organizationName || event.createdBy?.ngoProfile?.organizationName || event.createdBy?.name || 'Unknown Organization';
                    const hasDeadline = event.applicationDeadline;
                    const deadlinePassed = hasDeadline ? isDeadlinePassed(event.applicationDeadline!) : false;
                    const deadlineNear = hasDeadline ? isDeadlineNear(event.applicationDeadline!) : false;

                    return (
                      <div key={event._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                        {/* Event Image */}
                        {event.imageUrl && (
                          <div className="h-48 bg-gray-200 overflow-hidden">
                            <img
                              src={event.imageUrl}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="p-6">
                          {/* Event Type Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(event.category)}`}>
                              {event.category}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {event.eventType ? event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1) : 'Event'}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                            {event.title}
                          </h3>

                          {/* Description */}
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {event.description}
                          </p>

                          {/* Event Details */}
                          <div className="space-y-2 mb-4">
                            {/* Date */}
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2 text-primary" />
                              <span>{formatDateRange(event.eventDate, event.endDate)}</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mr-2 text-primary" />
                              <span>
                                {event.location.type === 'online' ? 'Online' : 
                                 event.location.city ? `${event.location.city}, ${event.location.country || 'Azerbaijan'}` :
                                 event.location.address || 'Location TBD'}
                              </span>
                            </div>

                            {/* Organization */}
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="w-4 h-4 mr-2 text-primary" />
                              <span>{organizationName}</span>
                            </div>

                            {/* Participants */}
                            {event.maxParticipants && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Tag className="w-4 h-4 mr-2 text-primary" />
                                <span>{event.currentParticipants}/{event.maxParticipants} participants</span>
                              </div>
                            )}

                            {/* Application Deadline */}
                            {hasDeadline && (
                              <div className="flex items-center text-sm">
                                <Clock className="w-4 h-4 mr-2 text-primary" />
                                <span className={`${
                                  deadlinePassed ? 'text-red-600' :
                                  deadlineNear ? 'text-orange-600' :
                                  'text-gray-600'
                                }`}>
                                  Deadline: {formatDate(event.applicationDeadline!)}
                                  {deadlinePassed && ' (Passed)'}
                                  {deadlineNear && ' (Soon)'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {event.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                              {event.tags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{event.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Link href={`/resources/events/${event._id}`} className="flex-1">
                              <Button variant="primary" size="sm" className="w-full">
                                View Details
                              </Button>
                            </Link>
                            {event.applicationLink && !deadlinePassed && (
                              <Link
                                href={event.applicationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </Link>
            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Results Count */}
          {!loading && !error && filteredData.length > 0 && (
            <div className="text-center mt-8 text-gray-600">
              Showing {filteredData.length} of {events.length} events
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary text-white py-16">
        <div className="section-padding">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Want to Host an Event?</h2>
            <p className="text-xl text-gray-100 mb-8 leading-relaxed">
              Share your event with our community and help advance gender equality and social justice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/events/create">
                <Button variant="secondary" size="lg">
                  <Calendar className="w-5 h-5" />
                  Create Event
                </Button>
              </Link>
              <Link href="/submit">
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-primary">
                  <ExternalLink className="w-5 h-5" />
                  Submit Content
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}