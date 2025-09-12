# Onward Platforms CRM - Product Requirements Document

## Executive Summary
A simple, focused CRM system for Onward Platforms to manage customer relationships, track deals, and organize contact information.

## Core Requirements

### 1. Contact Management
- **Fields**: First Name, Last Name, Email, Phone, Company, Title, Notes
- **Features**: 
  - Add/Edit/Delete contacts
  - Search and filter contacts
  - View contact history and interactions

### 2. Company Management  
- **Fields**: Company Name, Website, Industry, Size, Location, Notes
- **Features**:
  - Add/Edit/Delete companies
  - Link contacts to companies
  - View all contacts at a company

### 3. Deal/Opportunity Tracking
- **Fields**: Deal Name, Value, Stage, Close Date, Probability, Associated Company/Contact
- **Stages**: Lead → Qualified → Proposal → Negotiation → Closed Won/Lost
- **Features**:
  - Pipeline view of deals
  - Add/Edit/Delete deals
  - Move deals through stages
  - Track deal history

### 4. Activity Tracking
- **Types**: Notes, Calls, Emails, Meetings
- **Fields**: Type, Date, Subject, Description, Associated Contact/Company/Deal
- **Features**:
  - Log activities against contacts/companies/deals
  - View activity timeline
  - Set follow-up reminders

### 5. Dashboard
- **Metrics**:
  - Total contacts and companies
  - Open deals and pipeline value
  - Recent activities
  - Upcoming tasks/follow-ups
  - Deal conversion rates

## Technical Requirements
- **Framework**: Next.js 14+ with App Router
- **UI**: shadcn/ui components
- **Database**: PostgreSQL or SQLite for simplicity
- **Auth**: Simple email/password authentication
- **Storage**: Local file storage for attachments

## MVP Scope (Phase 1)
1. Contact CRUD operations
2. Company CRUD operations  
3. Basic deal tracking
4. Simple activity notes
5. Basic dashboard

## Future Enhancements (Phase 2+)
- Email integration
- Calendar integration
- Reporting and analytics
- Team collaboration features
- API integrations
- Mobile app

## Success Criteria
- Users can manage contacts and companies efficiently
- Deal pipeline is visible and manageable
- Activity history is trackable
- System is fast and responsive
- UI is clean and intuitive

## Questions to Consider
1. How many users will need access?
2. What integrations are most important (email, calendar, etc.)?
3. What specific industries/use cases should we optimize for?
4. Are there any specific workflows unique to Onward Platforms?
5. What data migration needs exist from current systems?