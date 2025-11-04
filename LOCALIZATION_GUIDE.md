# Localization Replacement Guide

Total strings to replace: **274**

## Quick Reference

Replace hardcoded strings with: `{t('key')}`

Make sure each component has:
```typescript
import { useLanguage } from '@/contexts/LanguageContext'

const { t } = useLanguage()
```

## String Replacement Map


### AUTHOR

- `"Author"` → `{t('author')}`

### BUTTONS

- `"Apply Now"` → `{t('buttons.apply_now')}`
- `"Apply for Event"` → `{t('buttons.apply_for_event')}`
- `"Back"` → `{t('buttons.back')}`
- `"Back to Admin Dashboard"` → `{t('buttons.back_to_admin_dashboard')}`
- `"Back to Admin Panel"` → `{t('buttons.back_to_admin_panel')}`
- `"Back to Events"` → `{t('buttons.back_to_events')}`
- `"Back to Home"` → `{t('buttons.back_to_home')}`
- `"Back to NGOs"` → `{t('buttons.back_to_ngos')}`
- `"Blog Updated Successfully!"` → `{t('buttons.blog_updated_successfully')}`
- `"Breadcrumb"` → `{t('buttons.breadcrumb')}`
- `"Browse Blogs"` → `{t('buttons.browse_blogs')}`
- `"Browse Events"` → `{t('buttons.browse_events')}`
- `"Check back soon for new opportunities!"` → `{t('buttons.check_back_soon_for_new_opportunities')}`
- `"Check back soon for trusted NGO partners"` → `{t('buttons.check_back_soon_for_trusted_ngo_partners')}`
- `"Choose how candidates should submit their applications"` → `{t('buttons.choose_how_candidates_should_submit_their_applicat')}`
- `"Created:"` → `{t('buttons.created')}`
- `"Delete"` → `{t('buttons.delete')}`
- `"Delete Event"` → `{t('buttons.delete_event')}`
- `"Edit Your Blog"` → `{t('buttons.edit_your_blog')}`
- `"Editing Blog"` → `{t('buttons.editing_blog')}`
- `"Explore Categories"` → `{t('buttons.explore_categories')}`
- `"Explore Now"` → `{t('buttons.explore_now')}`
- `"Explore Opportunities"` → `{t('buttons.explore_opportunities')}`
- `"How should candidates apply for this opportunity?"` → `{t('buttons.how_should_candidates_apply_for_this_opportunity')}`
- `"Join Online"` → `{t('buttons.join_online')}`
- `"Join Our"` → `{t('buttons.join_our')}`
- `"Join Our Community"` → `{t('buttons.join_our_community')}`
- `"Join The Movement"` → `{t('buttons.join_the_movement')}`
- `"Join workshops, trainings, and conferences"` → `{t('buttons.join_workshops_trainings_and_conferences')}`
- `"Last Updated:"` → `{t('buttons.last_updated')}`
- `"Mark as Read"` → `{t('buttons.mark_as_read')}`
- `"Mark as Unread"` → `{t('buttons.mark_as_unread')}`
- `"Marketing & Design"` → `{t('buttons.marketing_design')}`
- `"Name is hidden when submitting anonymously."` → `{t('buttons.name_is_hidden_when_submitting_anonymously')}`
- `"Next: Write your content"` → `{t('buttons.next_write_your_content')}`
- `"Pending Review"` → `{t('buttons.pending_review')}`
- `"Please sign in to join the conversation"` → `{t('buttons.please_sign_in_to_join_the_conversation')}`
- `"Preview"` → `{t('buttons.preview')}`
- `"Provide clear instructions for candidates on how to apply and what to include"` → `{t('buttons.provide_clear_instructions_for_candidates_on_how_t')}`
- `"Read More"` → `{t('buttons.read_more')}`
- `"Read Stories"` → `{t('buttons.read_stories')}`
- `"Read Story"` → `{t('buttons.read_story')}`
- `"Redirecting to edit flow..."` → `{t('buttons.redirecting_to_edit_flow')}`
- `"Save"` → `{t('buttons.save')}`
- `"Sign In"` → `{t('buttons.sign_in')}`
- `"Sign in to react"` → `{t('buttons.sign_in_to_react')}`
- `"Submit anonymously"` → `{t('buttons.submit_anonymously')}`
- `"This action cannot be undone. All data will be permanently deleted."` → `{t('buttons.this_action_cannot_be_undone_all_data_will_be_perm')}`
- `"This video discusses sensitive topics related to gender-based violence. 
                            Viewer discretion is advised."` → `{t('buttons.this_video_discusses_sensitive_topics_related_to_g')}`
- `"To apply, send your CV to:"` → `{t('buttons.to_apply_send_your_cv_to')}`
- `"Update your personal experience or community blog"` → `{t('buttons.update_your_personal_experience_or_community_blog')}`
- `"Updated in real-time"` → `{t('buttons.updated_in_real-time')}`
- `"View All Jobs"` → `{t('buttons.view_all_jobs')}`
- `"View Details"` → `{t('buttons.view_details')}`
- `"View My Profile"` → `{t('buttons.view_my_profile')}`
- `"View Organization Profile"` → `{t('buttons.view_organization_profile')}`
- `"View Partners"` → `{t('buttons.view_partners')}`
- `"View project on GitHub"` → `{t('buttons.view_project_on_github')}`
- `"Visit Website"` → `{t('buttons.visit_website')}`
- `"Visit our resources"` → `{t('buttons.visit_our_resources')}`
- `"When should applications be submitted by?"` → `{t('buttons.when_should_applications_be_submitted_by')}`
- `"You are editing an existing blog. Any changes will update the original blog."` → `{t('buttons.you_are_editing_an_existing_blog_any_changes_will_')}`
- `"Your blog has been updated and submitted for review. You'll receive a notification once it's approved."` → `{t('buttons.your_blog_has_been_updated_and_submitted_for_revie')}`

### CANCEL

- `"Cancel"` → `{t('cancel')}`

### CATEGORY

- `"Category"` → `{t('category')}`

### CLOSE

- `"Close"` → `{t('close')}`

### CONTENT

- `"Add tags to help candidates find this opportunity"` → `{t('content.add_tags_to_help_candidates_find_this_opportunity')}`
- `"Be inspired by experiences from our community"` → `{t('content.be_inspired_by_experiences_from_our_community')}`
- `"Change language"` → `{t('content.change_language')}`
- `"Clear category filter"` → `{t('content.clear_category_filter')}`
- `"Clear event type filter"` → `{t('content.clear_event_type_filter')}`
- `"Clear experience filter"` → `{t('content.clear_experience_filter')}`
- `"Clear month filter"` → `{t('content.clear_month_filter')}`
- `"Clear search"` → `{t('content.clear_search')}`
- `"Clear type filter"` → `{t('content.clear_type_filter')}`
- `"Debug info:"` → `{t('content.debug_info')}`
- `"Enter the compensation amount"` → `{t('content.enter_the_compensation_amount')}`
- `"How long is the contract?"` → `{t('content.how_long_is_the_contract')}`
- `"How long will this opportunity last?"` → `{t('content.how_long_will_this_opportunity_last')}`
- `"How will participants be compensated?"` → `{t('content.how_will_participants_be_compensated')}`
- `"How will the work be conducted?"` → `{t('content.how_will_the_work_be_conducted')}`
- `"IT & Technology"` → `{t('content.it_technology')}`
- `"Learn more"` → `{t('content.learn_more')}`
- `"NGO Not Found"` → `{t('content.ngo_not_found')}`
- `"NGOs working for positive change"` → `{t('content.ngos_working_for_positive_change')}`
- `"Need help?"` → `{t('content.need_help')}`
- `"New events are added regularly!"` → `{t('content.new_events_are_added_regularly')}`
- `"No blogs published yet"` → `{t('content.no_blogs_published_yet')}`
- `"No comments yet"` → `{t('content.no_comments_yet')}`
- `"No content"` → `{t('content.no_content')}`
- `"No partner organizations yet"` → `{t('content.no_partner_organizations_yet')}`
- `"No stories shared yet"` → `{t('content.no_stories_shared_yet')}`
- `"No upcoming events at the moment"` → `{t('content.no_upcoming_events_at_the_moment')}`
- `"No vacancies available at the moment"` → `{t('content.no_vacancies_available_at_the_moment')}`
- `"Organized by"` → `{t('content.organized_by')}`
- `"PDF Guide"` → `{t('content.pdf_guide')}`
- `"PDF Handbook"` → `{t('content.pdf_handbook')}`
- `"PDF Report"` → `{t('content.pdf_report')}`
- `"Platform for Youth Empowerment"` → `{t('content.platform_for_youth_empowerment')}`
- `"Search events"` → `{t('content.search_events')}`
- `"Search vacancies"` → `{t('content.search_vacancies')}`
- `"Searching for:"` → `{t('content.searching_for')}`
- `"Select the time unit"` → `{t('content.select_the_time_unit')}`
- `"Tag suggestions:"` → `{t('content.tag_suggestions')}`
- `"What are the essential requirements for this role?"` → `{t('content.what_are_the_essential_requirements_for_this_role')}`
- `"What benefits and perks do you offer?"` → `{t('content.what_benefits_and_perks_do_you_offer')}`
- `"What will this person be responsible for?"` → `{t('content.what_will_this_person_be_responsible_for')}`
- `"Where will this opportunity take place?"` → `{t('content.where_will_this_opportunity_take_place')}`
- `"Which city is this opportunity based in?"` → `{t('content.which_city_is_this_opportunity_based_in')}`
- `"Which country is this opportunity in?"` → `{t('content.which_country_is_this_opportunity_in')}`
- `"Your Gateway to"` → `{t('content.your_gateway_to')}`

### EDIT

- `"Edit"` → `{t('edit')}`

### EMAIL

- `"Email"` → `{t('email')}`

### EVENTTYPE

- `"Event Type"` → `{t('eventType')}`

### LABELS

- `"Address"` → `{t('labels.address')}`
- `"Capacity"` → `{t('labels.capacity')}`
- `"City"` → `{t('labels.city')}`
- `"City:"` → `{t('labels.city_1')}`
- `"Clear location filter"` → `{t('labels.clear_location_filter')}`
- `"Country"` → `{t('labels.country')}`
- `"Country:"` → `{t('labels.country_1')}`
- `"End Date"` → `{t('labels.end_date')}`
- `"Event Date"` → `{t('labels.event_date')}`
- `"Location & Address"` → `{t('labels.location_address')}`
- `"Tags & Keywords"` → `{t('labels.tags_keywords')}`
- `"Title"` → `{t('labels.title')}`
- `"Website"` → `{t('labels.website')}`
- `"Your Name"` → `{t('labels.your_name')}`
- `"Your name"` → `{t('labels.your_name_1')}`

### MESSAGES

- `"Access comprehensive resources tailored for your journey"` → `{t('messages.access_comprehensive_resources_tailored_for_your_j')}`
- `"Be part of something bigger. Share your journey, discover opportunities, and connect with organizations creating real change."` → `{t('messages.be_part_of_something_bigger_share_your_journey_dis')}`
- `"Be the first to share your experience!"` → `{t('messages.be_the_first_to_share_your_experience')}`
- `"Be the first to share your thoughts!"` → `{t('messages.be_the_first_to_share_your_thoughts')}`
- `"By publishing this vacancy, you agree to our terms of service and privacy policy."` → `{t('messages.by_publishing_this_vacancy_you_agree_to_our_terms_')}`
- `"Choose a compelling title that captures your story's essence"` → `{t('messages.choose_a_compelling_title_that_captures_your_story')}`
- `"Discover Resources"` → `{t('messages.discover_resources')}`
- `"Discover exciting job opportunities waiting for you"` → `{t('messages.discover_exciting_job_opportunities_waiting_for_yo')}`
- `"Discover inspiring voices from our community"` → `{t('messages.discover_inspiring_voices_from_our_community')}`
- `"Discover jobs, events, training programs, and connect with organizations making real impact in your community."` → `{t('messages.discover_jobs_events_training_programs_and_connect')}`
- `"Please provide a reason for rejecting this event:"` → `{t('messages.please_provide_a_reason_for_rejecting_this_event')}`
- `"What qualifications would make a candidate stand out?"` → `{t('messages.what_qualifications_would_make_a_candidate_stand_o')}`
- `"Your identity will be protected. Only "Anonymous" will be shown."` → `{t('messages.your_identity_will_be_protected_only_anonymous_wil')}`

### STATUS

- `"Approved"` → `{t('status.approved')}`
- `"Approved:"` → `{t('status.approved_1')}`
- `"Featured"` → `{t('status.featured')}`
- `"Loading NGO details..."` → `{t('status.loading_ngo_details')}`
- `"Loading blog data..."` → `{t('status.loading_blog_data')}`
- `"Loading comments..."` → `{t('status.loading_comments')}`
- `"Loading inspiring stories..."` → `{t('status.loading_inspiring_stories')}`
- `"Loading profile..."` → `{t('status.loading_profile')}`
- `"Loading..."` → `{t('status.loading')}`
- `"Pending"` → `{t('status.pending')}`
- `"Rejected"` → `{t('status.rejected')}`
- `"Rejected:"` → `{t('status.rejected_1')}`
- `"Status"` → `{t('status')}`
- `"Verified"` → `{t('status.verified')}`
- `"Verified Platform"` → `{t('status.verified_platform')}`

### TAGS

- `"Tags"` → `{t('tags')}`

### TITLES

- `"Add Another Benefit"` → `{t('titles.add_another_benefit')}`
- `"Add Another Qualification"` → `{t('titles.add_another_qualification')}`
- `"Add Another Requirement"` → `{t('titles.add_another_requirement')}`
- `"Add Another Responsibility"` → `{t('titles.add_another_responsibility')}`
- `"Add Another Tag"` → `{t('titles.add_another_tag')}`
- `"Admin Comment:"` → `{t('titles.admin_comment')}`
- `"Anonymous"` → `{t('titles.anonymous')}`
- `"Application Deadline"` → `{t('titles.application_deadline')}`
- `"Application Details"` → `{t('titles.application_details')}`
- `"Application Link"` → `{t('titles.application_link')}`
- `"Benefits & Perks"` → `{t('titles.benefits_perks')}`
- `"Blog Content"` → `{t('titles.blog_content')}`
- `"Blog Details"` → `{t('titles.blog_details')}`
- `"Blog Guidelines"` → `{t('titles.blog_guidelines')}`
- `"Blogs"` → `{t('titles.blogs')}`
- `"Career"` → `{t('titles.career')}`
- `"Certificate"` → `{t('titles.certificate')}`
- `"Certification"` → `{t('titles.certification')}`
- `"Communications & Media"` → `{t('titles.communications_media')}`
- `"Community Driven"` → `{t('titles.community_driven')}`
- `"Community Outreach"` → `{t('titles.community_outreach')}`
- `"Community Stories"` → `{t('titles.community_stories')}`
- `"Community Story"` → `{t('titles.community_story')}`
- `"Community Voices"` → `{t('titles.community_voices')}`
- `"Compensation Details"` → `{t('titles.compensation_details')}`
- `"Contact"` → `{t('titles.contact')}`
- `"Contact Information"` → `{t('titles.contact_information')}`
- `"Contact Person"` → `{t('titles.contact_person')}`
- `"Content Warning"` → `{t('titles.content_warning')}`
- `"Contract Length"` → `{t('titles.contract_length')}`
- `"Cost"` → `{t('titles.cost')}`
- `"Coursera"` → `{t('titles.coursera')}`
- `"Duration"` → `{t('titles.duration')}`
- `"Duration & Timeline"` → `{t('titles.duration_timeline')}`
- `"Education & Training"` → `{t('titles.education_training')}`
- `"Emergency Response"` → `{t('titles.emergency_response')}`
- `"Empowering Change Together"` → `{t('titles.empowering_change_together')}`
- `"Environmental"` → `{t('titles.environmental')}`
- `"Established"` → `{t('titles.established')}`
- `"Event Description"` → `{t('titles.event_description')}`
- `"Event Details"` → `{t('titles.event_details')}`
- `"Event Not Found"` → `{t('titles.event_not_found')}`
- `"Events & Training"` → `{t('titles.events_training')}`
- `"Field Operations"` → `{t('titles.field_operations')}`
- `"Finance & Administration"` → `{t('titles.finance_administration')}`
- `"Find What You"` → `{t('titles.find_what_you')}`
- `"Focus Areas"` → `{t('titles.focus_areas')}`
- `"Follow Us"` → `{t('titles.follow_us')}`
- `"Free Course"` → `{t('titles.free_course')}`
- `"Fundraising & Development"` → `{t('titles.fundraising_development')}`
- `"Global"` → `{t('titles.global')}`
- `"Grant Writing"` → `{t('titles.grant_writing')}`
- `"Growing Community"` → `{t('titles.growing_community')}`
- `"Healthcare & Medical"` → `{t('titles.healthcare_medical')}`
- `"Human Resources"` → `{t('titles.human_resources')}`
- `"Jump Right In"` → `{t('titles.jump_right_in')}`
- `"Key Responsibilities"` → `{t('titles.key_responsibilities')}`
- `"Launch Your"` → `{t('titles.launch_your')}`
- `"Learn More"` → `{t('titles.learn_more')}`
- `"Learning Outcomes"` → `{t('titles.learning_outcomes')}`
- `"Legal & Advocacy"` → `{t('titles.legal_advocacy')}`
- `"Like"` → `{t('titles.like')}`
- `"Live Platform Stats"` → `{t('titles.live_platform_stats')}`
- `"Location & Work Details"` → `{t('titles.location_work_details')}`
- `"Member Since"` → `{t('titles.member_since')}`
- `"Monitoring & Evaluation"` → `{t('titles.monitoring_evaluation')}`
- `"Need"` → `{t('titles.need')}`
- `"Network"` → `{t('titles.network')}`
- `"Online Link:"` → `{t('titles.online_link')}`
- `"Opportunities"` → `{t('titles.opportunities')}`
- `"Organization Info"` → `{t('titles.organization_info')}`
- `"Organizations"` → `{t('titles.organizations')}`
- `"Other"` → `{t('titles.other')}`
- `"Our Mission"` → `{t('titles.our_mission')}`
- `"Our Purpose"` → `{t('titles.our_purpose')}`
- `"Our Solution"` → `{t('titles.our_solution')}`
- `"Participants"` → `{t('titles.participants')}`
- `"Partner Network"` → `{t('titles.partner_network')}`
- `"Preferred Qualifications"` → `{t('titles.preferred_qualifications')}`
- `"Prerequisites"` → `{t('titles.prerequisites')}`
- `"Profile"` → `{t('titles.profile')}`
- `"Profile Not Found"` → `{t('titles.profile_not_found')}`
- `"Profile Stats"` → `{t('titles.profile_stats')}`
- `"Program Management"` → `{t('titles.program_management')}`
- `"Project Coordination"` → `{t('titles.project_coordination')}`
- `"Promise"` → `{t('titles.promise')}`
- `"Quick Access"` → `{t('titles.quick_access')}`
- `"Real"` → `{t('titles.real')}`
- `"Registration"` → `{t('titles.registration')}`
- `"Registration Details"` → `{t('titles.registration_details')}`
- `"Registration Number"` → `{t('titles.registration_number')}`
- `"Reject"` → `{t('titles.reject')}`
- `"Reject Event"` → `{t('titles.reject_event')}`
- `"Reply"` → `{t('titles.reply')}`
- `"Requirements"` → `{t('titles.requirements')}`
- `"Requirements:"` → `{t('titles.requirements_1')}`
- `"Research & Analysis"` → `{t('titles.research_analysis')}`
- `"Schedule"` → `{t('titles.schedule')}`
- `"Share Story"` → `{t('titles.share_story')}`
- `"Share Your Story"` → `{t('titles.share_your_story')}`
- `"Social Media"` → `{t('titles.social_media')}`
- `"Social Work"` → `{t('titles.social_work')}`
- `"Specialization"` → `{t('titles.specialization')}`
- `"Start Your Journey"` → `{t('titles.start_your_journey')}`
- `"Status Information"` → `{t('titles.status_information')}`
- `"Stories"` → `{t('titles.stories')}`
- `"Syllabus"` → `{t('titles.syllabus')}`
- `"Target Audience"` → `{t('titles.target_audience')}`
- `"The Challenge"` → `{t('titles.the_challenge')}`
- `"Time Unit"` → `{t('titles.time_unit')}`
- `"Training Details"` → `{t('titles.training_details')}`
- `"Trusted"` → `{t('titles.trusted')}`
- `"Upskill &"` → `{t('titles.upskill')}`
- `"Write Your Content"` → `{t('titles.write_your_content')}`
- `"Your Submission"` → `{t('titles.your_submission')}`

## Files Requiring Updates


### app\about\page.tsx

**Strings to replace:** 5

- Line 66: `"Our Mission"` → `{t('titles.our_mission')}`
- Line 96: `"The Challenge"` → `{t('titles.the_challenge')}`
- Line 179: `"Our Solution"` → `{t('titles.our_solution')}`
- Line 251: `"Our Purpose"` → `{t('titles.our_purpose')}`
- Line 376: `"Join The Movement"` → `{t('buttons.join_the_movement')}`

### app\admin\page.tsx

**Strings to replace:** 1

- Line 1724: `"Preview"` → `{t('buttons.preview')}`

### app\admin\preview\blog\[id]\page.tsx

**Strings to replace:** 4

- Line 84: `"Approved"` → `{t('status.approved')}`
- Line 91: `"Rejected"` → `{t('status.rejected')}`
- Line 98: `"Pending"` → `{t('status.pending')}`
- Line 200: `"Back to Admin Dashboard"` → `{t('buttons.back_to_admin_dashboard')}`

### app\admin\preview\events\[id]\page.tsx

**Strings to replace:** 31

- Line 214: `"Rejected"` → `{t('status.rejected')}`
- Line 222: `"Approved"` → `{t('status.approved')}`
- Line 229: `"Pending Review"` → `{t('buttons.pending_review')}`
- Line 275: `"Back to Admin Panel"` → `{t('buttons.back_to_admin_panel')}`
- Line 296: `"Reject"` → `{t('titles.reject')}`
- Line 373: `"Online Link:"` → `{t('titles.online_link')}`
- Line 393: `"Event Details"` → `{t('titles.event_details')}`
- Line 398: `"Event Type"` → `{t('eventType')}`
- Line 408: `"Category"` → `{t('category')}`
- Line 416: `"Event Date"` → `{t('labels.event_date')}`
- Line 425: `"End Date"` → `{t('labels.end_date')}`
- Line 435: `"Application Deadline"` → `{t('titles.application_deadline')}`
- Line 445: `"Capacity"` → `{t('labels.capacity')}`
- Line 457: `"Registration"` → `{t('titles.registration')}`
- Line 463: `"Application Link"` → `{t('titles.application_link')}`
- Line 476: `"Training Details"` → `{t('titles.training_details')}`
- Line 482: `"Duration"` → `{t('titles.duration')}`
- Line 492: `"Cost"` → `{t('titles.cost')}`
- Line 505: `"Certification"` → `{t('titles.certification')}`
- Line 518: `"Prerequisites"` → `{t('titles.prerequisites')}`
- Line 532: `"Learning Outcomes"` → `{t('titles.learning_outcomes')}`
- Line 546: `"Target Audience"` → `{t('titles.target_audience')}`
- Line 562: `"Schedule"` → `{t('titles.schedule')}`
- Line 573: `"Status Information"` → `{t('titles.status_information')}`
- Line 576: `"Created:"` → `{t('buttons.created')}`
- Line 580: `"Last Updated:"` → `{t('buttons.last_updated')}`
- Line 585: `"Approved:"` → `{t('status.approved_1')}`
- Line 591: `"Admin Comment:"` → `{t('titles.admin_comment')}`
- Line 605: `"Reject Event"` → `{t('titles.reject_event')}`
- Line 606: `"Please provide a reason for rejecting this event:"` → `{t('messages.please_provide_a_reason_for_rejecting_this_event')}`
- Line 623: `"Cancel"` → `{t('cancel')}`

### app\auth\error\page.tsx

**Strings to replace:** 2

- Line 59: `"Debug info:"` → `{t('content.debug_info')}`
- Line 73: `"Loading..."` → `{t('status.loading')}`

### app\auth\register\page.tsx

**Strings to replace:** 1

- Line 760: `"Start Your Journey"` → `{t('titles.start_your_journey')}`

### app\auth\signin\page.tsx

**Strings to replace:** 2

- Line 322: `"Join Our Community"` → `{t('buttons.join_our_community')}`
- Line 371: `"Loading..."` → `{t('status.loading')}`

### app\blogs\[id]\page.tsx

**Strings to replace:** 1

- Line 344: `"Community Story"` → `{t('titles.community_story')}`

### app\blogs\page.tsx

**Strings to replace:** 4

- Line 129: `"Loading inspiring stories..."` → `{t('status.loading_inspiring_stories')}`
- Line 169: `"Community Stories"` → `{t('titles.community_stories')}`
- Line 250: `"Discover inspiring voices from our community"` → `{t('messages.discover_inspiring_voices_from_our_community')}`
- Line 286: `"Searching for:"` → `{t('content.searching_for')}`

### app\dashboard\events\[id]\page.tsx

**Strings to replace:** 12

- Line 254: `"Tags"` → `{t('tags')}`
- Line 292: `"City:"` → `{t('labels.city_1')}`
- Line 298: `"Country:"` → `{t('labels.country_1')}`
- Line 373: `"Registration"` → `{t('titles.registration')}`
- Line 379: `"Application Link"` → `{t('titles.application_link')}`
- Line 391: `"Status Information"` → `{t('titles.status_information')}`
- Line 394: `"Created:"` → `{t('buttons.created')}`
- Line 398: `"Last Updated:"` → `{t('buttons.last_updated')}`
- Line 403: `"Approved:"` → `{t('status.approved_1')}`
- Line 412: `"Rejected:"` → `{t('status.rejected_1')}`
- Line 426: `"Delete Event"` → `{t('buttons.delete_event')}`
- Line 435: `"Cancel"` → `{t('cancel')}`

### app\dashboard\events\create\page.tsx

**Strings to replace:** 4

- Line 361: `"Schedule"` → `{t('titles.schedule')}`
- Line 375: `"Prerequisites"` → `{t('titles.prerequisites')}`
- Line 388: `"Learning Outcomes"` → `{t('titles.learning_outcomes')}`
- Line 401: `"Syllabus"` → `{t('titles.syllabus')}`

### app\dashboard\vacancies\create\page.tsx

**Strings to replace:** 58

- Line 320: `"Program Management"` → `{t('titles.program_management')}`
- Line 321: `"Project Coordination"` → `{t('titles.project_coordination')}`
- Line 322: `"Research & Analysis"` → `{t('titles.research_analysis')}`
- Line 323: `"Communications & Media"` → `{t('titles.communications_media')}`
- Line 324: `"Fundraising & Development"` → `{t('titles.fundraising_development')}`
- Line 325: `"Legal & Advocacy"` → `{t('titles.legal_advocacy')}`
- Line 326: `"Finance & Administration"` → `{t('titles.finance_administration')}`
- Line 327: `"Human Resources"` → `{t('titles.human_resources')}`
- Line 328: `"IT & Technology"` → `{t('content.it_technology')}`
- Line 329: `"Field Operations"` → `{t('titles.field_operations')}`
- Line 330: `"Community Outreach"` → `{t('titles.community_outreach')}`
- Line 331: `"Education & Training"` → `{t('titles.education_training')}`
- Line 332: `"Healthcare & Medical"` → `{t('titles.healthcare_medical')}`
- Line 333: `"Social Work"` → `{t('titles.social_work')}`
- Line 334: `"Environmental"` → `{t('titles.environmental')}`
- Line 335: `"Emergency Response"` → `{t('titles.emergency_response')}`
- Line 336: `"Monitoring & Evaluation"` → `{t('titles.monitoring_evaluation')}`
- Line 337: `"Grant Writing"` → `{t('titles.grant_writing')}`
- Line 338: `"Marketing & Design"` → `{t('buttons.marketing_design')}`
- Line 339: `"Other"` → `{t('titles.other')}`
- Line 349: `"Location & Work Details"` → `{t('titles.location_work_details')}`
- Line 352: `"Where will this opportunity take place?"` → `{t('content.where_will_this_opportunity_take_place')}`
- Line 361: `"How will the work be conducted?"` → `{t('content.how_will_the_work_be_conducted')}`
- Line 382: `"City"` → `{t('labels.city')}`
- Line 385: `"Which city is this opportunity based in?"` → `{t('content.which_city_is_this_opportunity_based_in')}`
- Line 398: `"Country"` → `{t('labels.country')}`
- Line 401: `"Which country is this opportunity in?"` → `{t('content.which_country_is_this_opportunity_in')}`
- Line 418: `"Compensation Details"` → `{t('titles.compensation_details')}`
- Line 427: `"How will participants be compensated?"` → `{t('content.how_will_participants_be_compensated')}`
- Line 451: `"Enter the compensation amount"` → `{t('content.enter_the_compensation_amount')}`
- Line 472: `"Duration & Timeline"` → `{t('titles.duration_timeline')}`
- Line 481: `"How long will this opportunity last?"` → `{t('content.how_long_will_this_opportunity_last')}`
- Line 502: `"Contract Length"` → `{t('titles.contract_length')}`
- Line 505: `"How long is the contract?"` → `{t('content.how_long_is_the_contract')}`
- Line 519: `"Time Unit"` → `{t('titles.time_unit')}`
- Line 522: `"Select the time unit"` → `{t('content.select_the_time_unit')}`
- Line 549: `"Application Details"` → `{t('titles.application_details')}`
- Line 552: `"How should candidates apply for this opportunity?"` → `{t('buttons.how_should_candidates_apply_for_this_opportunity')}`
- Line 561: `"Choose how candidates should submit their applications"` → `{t('buttons.choose_how_candidates_should_submit_their_applicat')}`
- Line 673: `"When should applications be submitted by?"` → `{t('buttons.when_should_applications_be_submitted_by')}`
- Line 691: `"Provide clear instructions for candidates on how to apply and what to include"` → `{t('buttons.provide_clear_instructions_for_candidates_on_how_t')}`
- Line 710: `"Key Responsibilities"` → `{t('titles.key_responsibilities')}`
- Line 713: `"What will this person be responsible for?"` → `{t('content.what_will_this_person_be_responsible_for')}`
- Line 755: `"Add Another Responsibility"` → `{t('titles.add_another_responsibility')}`
- Line 765: `"Requirements"` → `{t('titles.requirements')}`
- Line 768: `"What are the essential requirements for this role?"` → `{t('content.what_are_the_essential_requirements_for_this_role')}`
- Line 810: `"Add Another Requirement"` → `{t('titles.add_another_requirement')}`
- Line 820: `"Preferred Qualifications"` → `{t('titles.preferred_qualifications')}`
- Line 823: `"What qualifications would make a candidate stand out?"` → `{t('messages.what_qualifications_would_make_a_candidate_stand_o')}`
- Line 865: `"Add Another Qualification"` → `{t('titles.add_another_qualification')}`
- Line 876: `"Benefits & Perks"` → `{t('titles.benefits_perks')}`
- Line 879: `"What benefits and perks do you offer?"` → `{t('content.what_benefits_and_perks_do_you_offer')}`
- Line 921: `"Add Another Benefit"` → `{t('titles.add_another_benefit')}`
- Line 932: `"Tags & Keywords"` → `{t('labels.tags_keywords')}`
- Line 935: `"Add tags to help candidates find this opportunity"` → `{t('content.add_tags_to_help_candidates_find_this_opportunity')}`
- Line 977: `"Add Another Tag"` → `{t('titles.add_another_tag')}`
- Line 982: `"Tag suggestions:"` → `{t('content.tag_suggestions')}`
- Line 1048: `"By publishing this vacancy, you agree to our terms of service and privacy policy."` → `{t('messages.by_publishing_this_vacancy_you_agree_to_our_terms_')}`

### app\edit\blog\[id]\page.tsx

**Strings to replace:** 1

- Line 33: `"Redirecting to edit flow..."` → `{t('buttons.redirecting_to_edit_flow')}`

### app\edit\blog\[id]\step1\page.tsx

**Strings to replace:** 6

- Line 208: `"Loading blog data..."` → `{t('status.loading_blog_data')}`
- Line 234: `"Editing Blog"` → `{t('buttons.editing_blog')}`
- Line 235: `"You are editing an existing blog. Any changes will update the original blog."` → `{t('buttons.you_are_editing_an_existing_blog_any_changes_will_')}`
- Line 249: `"Your Name"` → `{t('labels.your_name')}`
- Line 270: `"Name is hidden when submitting anonymously."` → `{t('buttons.name_is_hidden_when_submitting_anonymously')}`
- Line 281: `"Submit anonymously"` → `{t('buttons.submit_anonymously')}`

### app\edit\blog\[id]\step2\page.tsx

**Strings to replace:** 12

- Line 292: `"Blog Updated Successfully!"` → `{t('buttons.blog_updated_successfully')}`
- Line 293: `"Your blog has been updated and submitted for review. You'll receive a notification once it's approved."` → `{t('buttons.your_blog_has_been_updated_and_submitted_for_revie')}`
- Line 310: `"Edit Your Blog"` → `{t('buttons.edit_your_blog')}`
- Line 311: `"Update your personal experience or community blog"` → `{t('buttons.update_your_personal_experience_or_community_blog')}`
- Line 338: `"Back"` → `{t('buttons.back')}`
- Line 348: `"Blog Details"` → `{t('titles.blog_details')}`
- Line 351: `"Title"` → `{t('labels.title')}`
- Line 356: `"Author"` → `{t('author')}`
- Line 358: `"Anonymous"` → `{t('titles.anonymous')}`
- Line 363: `"Your name"` → `{t('labels.your_name_1')}`
- Line 378: `"Blog Content"` → `{t('titles.blog_content')}`
- Line 447: `"Blog Guidelines"` → `{t('titles.blog_guidelines')}`

### app\edit\blog\layout.tsx

**Strings to replace:** 1

- Line 9: `"Edit Your Blog"` → `{t('buttons.edit_your_blog')}`

### app\page copy backup.tsx

**Strings to replace:** 5

- Line 180: `"Platform for Youth Empowerment"` → `{t('content.platform_for_youth_empowerment')}`
- Line 269: `"Our Mission"` → `{t('titles.our_mission')}`
- Line 333: `"Learn more"` → `{t('content.learn_more')}`
- Line 434: `"Verified Platform"` → `{t('status.verified_platform')}`
- Line 438: `"Community Driven"` → `{t('titles.community_driven')}`

### app\page.tsx

**Strings to replace:** 45

- Line 210: `"Empowering Change Together"` → `{t('titles.empowering_change_together')}`
- Line 214: `"Your Gateway to"` → `{t('content.your_gateway_to')}`
- Line 217: `"Opportunities"` → `{t('titles.opportunities')}`
- Line 222: `"Discover jobs, events, training programs, and connect with organizations making real impact in your community."` → `{t('messages.discover_jobs_events_training_programs_and_connect')}`
- Line 233: `"Explore Now"` → `{t('buttons.explore_now')}`
- Line 244: `"Share Story"` → `{t('titles.share_story')}`
- Line 276: `"Live Platform Stats"` → `{t('titles.live_platform_stats')}`
- Line 304: `"Updated in real-time"` → `{t('buttons.updated_in_real-time')}`
- Line 332: `"Opportunities"` → `{t('titles.opportunities')}`
- Line 334: `"Launch Your"` → `{t('titles.launch_your')}`
- Line 335: `"Career"` → `{t('titles.career')}`
- Line 337: `"Discover exciting job opportunities waiting for you"` → `{t('messages.discover_exciting_job_opportunities_waiting_for_yo')}`
- Line 340: `"View All Jobs"` → `{t('buttons.view_all_jobs')}`
- Line 400: `"View Details"` → `{t('buttons.view_details')}`
- Line 413: `"No vacancies available at the moment"` → `{t('content.no_vacancies_available_at_the_moment')}`
- Line 414: `"Check back soon for new opportunities!"` → `{t('buttons.check_back_soon_for_new_opportunities')}`
- Line 432: `"Events & Training"` → `{t('titles.events_training')}`
- Line 434: `"Upskill &"` → `{t('titles.upskill')}`
- Line 435: `"Network"` → `{t('titles.network')}`
- Line 437: `"Join workshops, trainings, and conferences"` → `{t('buttons.join_workshops_trainings_and_conferences')}`
- Line 440: `"Browse Events"` → `{t('buttons.browse_events')}`
- Line 502: `"Learn More"` → `{t('titles.learn_more')}`
- Line 515: `"No upcoming events at the moment"` → `{t('content.no_upcoming_events_at_the_moment')}`
- Line 516: `"New events are added regularly!"` → `{t('content.new_events_are_added_regularly')}`
- Line 534: `"Community Voices"` → `{t('titles.community_voices')}`
- Line 536: `"Real"` → `{t('titles.real')}`
- Line 537: `"Stories"` → `{t('titles.stories')}`
- Line 539: `"Be inspired by experiences from our community"` → `{t('content.be_inspired_by_experiences_from_our_community')}`
- Line 542: `"Read Stories"` → `{t('buttons.read_stories')}`
- Line 605: `"Read Story"` → `{t('buttons.read_story')}`
- Line 618: `"No stories shared yet"` → `{t('content.no_stories_shared_yet')}`
- Line 619: `"Be the first to share your experience!"` → `{t('messages.be_the_first_to_share_your_experience')}`
- Line 637: `"Partner Network"` → `{t('titles.partner_network')}`
- Line 639: `"Trusted"` → `{t('titles.trusted')}`
- Line 640: `"Organizations"` → `{t('titles.organizations')}`
- Line 642: `"NGOs working for positive change"` → `{t('content.ngos_working_for_positive_change')}`
- Line 645: `"View Partners"` → `{t('buttons.view_partners')}`
- Line 706: `"View Details"` → `{t('buttons.view_details')}`
- Line 721: `"No partner organizations yet"` → `{t('content.no_partner_organizations_yet')}`
- Line 722: `"Check back soon for trusted NGO partners"` → `{t('buttons.check_back_soon_for_trusted_ngo_partners')}`
- Line 764: `"Join Our"` → `{t('buttons.join_our')}`
- Line 765: `"Growing Community"` → `{t('titles.growing_community')}`
- Line 770: `"Be part of something bigger. Share your journey, discover opportunities, and connect with organizations creating real change."` → `{t('messages.be_part_of_something_bigger_share_your_journey_dis')}`
- Line 804: `"Share Your Story"` → `{t('titles.share_your_story')}`
- Line 815: `"Explore Opportunities"` → `{t('buttons.explore_opportunities')}`

### app\profile\[id]\page.tsx

**Strings to replace:** 14

- Line 90: `"Loading profile..."` → `{t('status.loading_profile')}`
- Line 100: `"Profile Not Found"` → `{t('titles.profile_not_found')}`
- Line 103: `"Back to Home"` → `{t('buttons.back_to_home')}`
- Line 161: `"Contact"` → `{t('titles.contact')}`
- Line 174: `"Visit Website"` → `{t('buttons.visit_website')}`
- Line 248: `"Read More"` → `{t('buttons.read_more')}`
- Line 262: `"No blogs published yet"` → `{t('content.no_blogs_published_yet')}`
- Line 280: `"Contact Information"` → `{t('titles.contact_information')}`
- Line 291: `"Email"` → `{t('email')}`
- Line 307: `"Website"` → `{t('labels.website')}`
- Line 333: `"Social Media"` → `{t('titles.social_media')}`
- Line 391: `"Profile Stats"` → `{t('titles.profile_stats')}`
- Line 395: `"Blogs"` → `{t('titles.blogs')}`
- Line 399: `"Member Since"` → `{t('titles.member_since')}`

### app\profile\page.tsx

**Strings to replace:** 1

- Line 702: `"This action cannot be undone. All data will be permanently deleted."` → `{t('buttons.this_action_cannot_be_undone_all_data_will_be_perm')}`

### app\resources\events\[id]\page.tsx

**Strings to replace:** 14

- Line 156: `"Event Not Found"` → `{t('titles.event_not_found')}`
- Line 197: `"Back to Events"` → `{t('buttons.back_to_events')}`
- Line 222: `"Featured"` → `{t('status.featured')}`
- Line 320: `"Event Description"` → `{t('titles.event_description')}`
- Line 331: `"Tags"` → `{t('tags')}`
- Line 360: `"Event Details"` → `{t('titles.event_details')}`
- Line 403: `"Join Online"` → `{t('buttons.join_online')}`
- Line 408: `"Join Online"` → `{t('buttons.join_online')}`
- Line 422: `"Participants"` → `{t('titles.participants')}`
- Line 437: `"Application Deadline"` → `{t('titles.application_deadline')}`
- Line 461: `"Apply Now"` → `{t('buttons.apply_now')}`
- Line 469: `"Apply for Event"` → `{t('buttons.apply_for_event')}`
- Line 483: `"Organized by"` → `{t('content.organized_by')}`
- Line 494: `"View Organization Profile"` → `{t('buttons.view_organization_profile')}`

### app\resources\events\page.tsx

**Strings to replace:** 5

- Line 295: `"Search events"` → `{t('content.search_events')}`
- Line 367: `"Clear category filter"` → `{t('content.clear_category_filter')}`
- Line 375: `"Clear location filter"` → `{t('labels.clear_location_filter')}`
- Line 383: `"Clear month filter"` → `{t('content.clear_month_filter')}`
- Line 391: `"Clear event type filter"` → `{t('content.clear_event_type_filter')}`

### app\resources\materials\page.tsx

**Strings to replace:** 11

- Line 124: `"Coursera"` → `{t('titles.coursera')}`
- Line 125: `"Free Course"` → `{t('titles.free_course')}`
- Line 155: `"Coursera"` → `{t('titles.coursera')}`
- Line 156: `"Certificate"` → `{t('titles.certificate')}`
- Line 186: `"Coursera"` → `{t('titles.coursera')}`
- Line 187: `"Specialization"` → `{t('titles.specialization')}`
- Line 258: `"Content Warning"` → `{t('titles.content_warning')}`
- Line 261: `"This video discusses sensitive topics related to gender-based violence. 
                            Viewer discretion is advised."` → `{t('buttons.this_video_discusses_sensitive_topics_related_to_g')}`
- Line 338: `"PDF Guide"` → `{t('content.pdf_guide')}`
- Line 373: `"PDF Handbook"` → `{t('content.pdf_handbook')}`
- Line 401: `"PDF Report"` → `{t('content.pdf_report')}`

### app\resources\ngos\[id]\page.tsx

**Strings to replace:** 19

- Line 79: `"Loading NGO details..."` → `{t('status.loading_ngo_details')}`
- Line 89: `"NGO Not Found"` → `{t('content.ngo_not_found')}`
- Line 92: `"Back to NGOs"` → `{t('buttons.back_to_ngos')}`
- Line 123: `"Back to NGOs"` → `{t('buttons.back_to_ngos')}`
- Line 162: `"Verified"` → `{t('status.verified')}`
- Line 179: `"Contact"` → `{t('titles.contact')}`
- Line 194: `"Website"` → `{t('labels.website')}`
- Line 233: `"Focus Areas"` → `{t('titles.focus_areas')}`
- Line 260: `"Location & Address"` → `{t('labels.location_address')}`
- Line 280: `"Registration Details"` → `{t('titles.registration_details')}`
- Line 286: `"Registration Number"` → `{t('titles.registration_number')}`
- Line 306: `"Contact Information"` → `{t('titles.contact_information')}`
- Line 347: `"Contact Person"` → `{t('titles.contact_person')}`
- Line 368: `"Follow Us"` → `{t('titles.follow_us')}`
- Line 416: `"Organization Info"` → `{t('titles.organization_info')}`
- Line 422: `"Status"` → `{t('status')}`
- Line 434: `"Focus Areas"` → `{t('titles.focus_areas')}`
- Line 450: `"Address"` → `{t('labels.address')}`
- Line 460: `"Established"` → `{t('titles.established')}`

### app\resources\ngos\page.tsx

**Strings to replace:** 2

- Line 214: `"Clear category filter"` → `{t('content.clear_category_filter')}`
- Line 222: `"Clear location filter"` → `{t('labels.clear_location_filter')}`

### app\resources\page.tsx

**Strings to replace:** 7

- Line 73: `"Discover Resources"` → `{t('messages.discover_resources')}`
- Line 126: `"Explore Categories"` → `{t('buttons.explore_categories')}`
- Line 128: `"Find What You"` → `{t('titles.find_what_you')}`
- Line 129: `"Need"` → `{t('titles.need')}`
- Line 131: `"Access comprehensive resources tailored for your journey"` → `{t('messages.access_comprehensive_resources_tailored_for_your_j')}`
- Line 195: `"Quick Access"` → `{t('titles.quick_access')}`
- Line 197: `"Jump Right In"` → `{t('titles.jump_right_in')}`

### app\resources\vacancies\page.tsx

**Strings to replace:** 8

- Line 191: `"Search vacancies"` → `{t('content.search_vacancies')}`
- Line 239: `"Clear type filter"` → `{t('content.clear_type_filter')}`
- Line 247: `"Clear location filter"` → `{t('labels.clear_location_filter')}`
- Line 255: `"Clear experience filter"` → `{t('content.clear_experience_filter')}`
- Line 359: `"Requirements:"` → `{t('titles.requirements_1')}`
- Line 399: `"Apply Now"` → `{t('buttons.apply_now')}`
- Line 409: `"To apply, send your CV to:"` → `{t('buttons.to_apply_send_your_cv_to')}`
- Line 431: `"Apply Now"` → `{t('buttons.apply_now')}`

### app\submit\blog\step1\page.tsx

**Strings to replace:** 6

- Line 205: `"Choose a compelling title that captures your story's essence"` → `{t('messages.choose_a_compelling_title_that_captures_your_story')}`
- Line 262: `"Your identity will be protected. Only "Anonymous" will be shown."` → `{t('messages.your_identity_will_be_protected_only_anonymous_wil')}`
- Line 271: `"Next: Write your content"` → `{t('buttons.next_write_your_content')}`
- Line 288: `"Need help?"` → `{t('content.need_help')}`
- Line 288: `"Visit our resources"` → `{t('buttons.visit_our_resources')}`
- Line 297: `"Loading..."` → `{t('status.loading')}`

### app\submit\blog\step2\page.tsx

**Strings to replace:** 4

- Line 323: `"View My Profile"` → `{t('buttons.view_my_profile')}`
- Line 329: `"Browse Blogs"` → `{t('buttons.browse_blogs')}`
- Line 359: `"Write Your Content"` → `{t('titles.write_your_content')}`
- Line 560: `"Loading..."` → `{t('status.loading')}`

### components\BlocknoteReadOnly.tsx

**Strings to replace:** 1

- Line 20: `"No content"` → `{t('content.no_content')}`

### components\BlogCard.tsx

**Strings to replace:** 1

- Line 51: `"Your Submission"` → `{t('titles.your_submission')}`

### components\BlogReactions.tsx

**Strings to replace:** 1

- Line 151: `"Sign in to react"` → `{t('buttons.sign_in_to_react')}`

### components\Footer.tsx

**Strings to replace:** 1

- Line 164: `"View project on GitHub"` → `{t('buttons.view_project_on_github')}`

### components\Header.tsx

**Strings to replace:** 1

- Line 64: `"Global"` → `{t('titles.global')}`

### components\LanguageSwitcher.tsx

**Strings to replace:** 1

- Line 42: `"Change language"` → `{t('content.change_language')}`

### components\NotificationModal.tsx

**Strings to replace:** 5

- Line 22: `"Close"` → `{t('close')}`
- Line 33: `"Mark as Read"` → `{t('buttons.mark_as_read')}`
- Line 36: `"Mark as Read"` → `{t('buttons.mark_as_read')}`
- Line 41: `"Mark as Unread"` → `{t('buttons.mark_as_unread')}`
- Line 44: `"Mark as Unread"` → `{t('buttons.mark_as_unread')}`

### components\Profile\Notifications.tsx

**Strings to replace:** 2

- Line 23: `"Promise"` → `{t('titles.promise')}`
- Line 24: `"Promise"` → `{t('titles.promise')}`

### components\Profile\Profile.tsx

**Strings to replace:** 1

- Line 477: `"Profile"` → `{t('titles.profile')}`

### components\comments\CommentForm.tsx

**Strings to replace:** 4

- Line 85: `"Please sign in to join the conversation"` → `{t('buttons.please_sign_in_to_join_the_conversation')}`
- Line 89: `"Sign In"` → `{t('buttons.sign_in')}`
- Line 131: `"Cancel"` → `{t('cancel')}`
- Line 136: `"Cancel"` → `{t('cancel')}`

### components\comments\CommentSection.tsx

**Strings to replace:** 3

- Line 141: `"Loading comments..."` → `{t('status.loading_comments')}`
- Line 147: `"No comments yet"` → `{t('content.no_comments_yet')}`
- Line 148: `"Be the first to share your thoughts!"` → `{t('messages.be_the_first_to_share_your_thoughts')}`

### components\comments\CommentThread.tsx

**Strings to replace:** 7

- Line 241: `"Author"` → `{t('author')}`
- Line 272: `"Edit"` → `{t('edit')}`
- Line 283: `"Delete"` → `{t('buttons.delete')}`
- Line 305: `"Save"` → `{t('buttons.save')}`
- Line 315: `"Cancel"` → `{t('cancel')}`
- Line 350: `"Like"` → `{t('titles.like')}`
- Line 369: `"Reply"` → `{t('titles.reply')}`

### components\dashboard\EventManagement.tsx

**Strings to replace:** 3

- Line 150: `"Approved"` → `{t('status.approved')}`
- Line 152: `"Rejected"` → `{t('status.rejected')}`
- Line 154: `"Pending"` → `{t('status.pending')}`

### components\ui\Breadcrumb.tsx

**Strings to replace:** 1

- Line 45: `"Breadcrumb"` → `{t('buttons.breadcrumb')}`

### components\ui\SearchBar.tsx

**Strings to replace:** 1

- Line 94: `"Clear search"` → `{t('content.clear_search')}`

### lib\cache.ts

**Strings to replace:** 1

- Line 70: `"Promise"` → `{t('titles.promise')}`
