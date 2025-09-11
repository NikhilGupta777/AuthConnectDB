# Narayani Sena - Full-Stack Web Application

## Overview
A comprehensive full-stack web application for "Narayani Sena", a spiritual organization for Mahaprabhuji devotees. Successfully converted from a static HTML template into a dynamic React application while preserving the original glassmorphic design and visual effects.

## Current State
- **Status**: Fully operational web application running on port 5000
- **Authentication**: Replit Auth integrated with Google, GitHub, and email/password login
- **Database**: PostgreSQL with comprehensive schema for users, files, email management, and chat
- **API**: Complete backend with authentication, file upload, email validation, and campaign management
- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui components

## Features Implemented
✅ **Authentication & User Management**
- Replit Auth integration with multiple providers
- User profiles with role-based access control (member/admin)
- Session management and secure authentication flow

✅ **Core Pages**
- Dashboard with real-time statistics
- Ask Anything (AI Chat integration)
- NS Space (Email management system)
- AI Tools
- Files & Media with content approval workflow
- Admin Panel with comprehensive controls

✅ **Database Integration**
- PostgreSQL database with full schema
- User management and role-based permissions
- File management with approval workflow
- Email templates and campaigns
- Chat message storage

✅ **Email Management System**
- Email validator and bulk processing
- Template system for reusable email content
- Campaign management with delivery tracking
- Gmail integration ready (requires OAuth setup)

## Recent Changes
*September 11, 2025*
- Fixed TypeScript typing issues across all components
- Made OpenAI service optional for application startup
- Resolved user authentication API endpoint issues
- Updated all React Query implementations with proper typing
- Application now starts successfully without API keys

## User Preferences
- **Visual Design**: Preserve all existing glassmorphic effects, animated gradients, hover effects, and dark theme aesthetic
- **Authentication**: Primary focus on Replit Auth for user management
- **Data Integrity**: No mock data in production paths, use authentic data sources

## Integration Status
### Available Integrations
- ✅ **Replit Auth**: Fully configured and operational
- ✅ **PostgreSQL**: Database setup and schema synchronized
- ✅ **OpenAI**: Service configured (requires OPENAI_API_KEY)
- ✅ **SendGrid**: Service configured (requires SENDGRID_API_KEY)

### Integration Decisions
- **Outlook Integration**: *User dismissed* - External credentials or alternative approach needed for Outlook email sending. Currently focusing on Gmail OAuth integration as primary email service provider.

## Project Architecture
### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with glassmorphic design system
- **UI Components**: shadcn/ui with custom glass card components
- **State Management**: TanStack Query for server state
- **Forms**: react-hook-form with zod validation

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with session management
- **File Storage**: Multer for file uploads (50MB limit)
- **API**: RESTful endpoints with proper error handling

### Database Schema
- **Users**: Profile management with role-based permissions
- **Files**: Content management with approval workflow
- **Email Templates**: Reusable email content system
- **Email Campaigns**: Bulk email management with tracking
- **Chat Messages**: AI conversation storage

## Required Environment Variables
- `OPENAI_API_KEY`: For AI chat functionality
- `SENDGRID_API_KEY`: For email sending capabilities
- `DATABASE_URL`: PostgreSQL connection (automatically provided)
- `SESSION_SECRET`: For session management (automatically provided)
- `REPLIT_DOMAINS`: For authentication (automatically provided)

## Content Approval Workflow
- **Member uploads** → **Pending status** → **Admin approval** → **Published**
- Role-based permissions control access to approval functions
- File management system tracks upload status and approval history

## Next Steps
- Configure OpenAI API key for AI chat functionality
- Set up Gmail OAuth for email sending capabilities
- Test content approval workflow with multiple user roles
- Performance optimization and final testing