# CatHealth Documentation

## Overview
CatHealth is an AI-powered cat health application that offers comprehensive solutions for cat owners. The platform provides preliminary health assessments through symptom analysis and image uploads, as well as personalized wellness and behavior plans based on detailed questionnaires. The application leverages OpenAI's models to deliver tailored recommendations for improving cat health, behavior, and overall well-being.

## Tech Stack
- **Framework**: Next.js 15.2.1 with App Router
- **Frontend**: React 19, Tailwind CSS 4
- **UI Components**: shadcn/ui components (Radix UI based)
- **Authentication**: Supabase Authentication (Email/Password and Google OAuth)
- **Database**: Supabase
- **API Integration**: OpenAI API (GPT-4o-mini)
- **Styling**: Tailwind CSS with custom animations and gradient effects
- **Form Handling**: React Hook Form with Zod validation

## Core Features

### 1. AI-Powered Cat Health Diagnosis
- **Symptom Input**: Users can describe their cat's symptoms in detail
- **Image Upload**: Support for uploading images of affected areas
- **Detailed Analysis**: Provides comprehensive diagnosis with potential causes and severity assessment
- **Interactive Visualizations**: Shows severity gauge, probable causes, and recommended actions

### 2. Cat Wellness & Behavior Plan Module
- **Multi-Step Interactive Questionnaire**: Collects detailed information about the cat through 5 steps:
  - Basic information (name, age, breed, sex)
  - Health & lifestyle (weight, diet, feeding, activity level)
  - Behavior & training (issues, training history)
  - Enrichment & routine (play time, favorite activities, environment)
  - Goals & preferences (primary goals for improvement)
- **Illustrated Card-Based Interface**: Uses cat illustrations for intuitive selection of options
- **Personalized Wellness Plan**: Generates comprehensive wellness recommendations covering:
  - Health recommendations (nutrition, exercise, preventive care)
  - Behavior training (specific to reported issues)
  - Enrichment plan (play, toys, environment enrichment)
  - Follow-up schedule (weekly implementation plan)
- **Visual Plan Presentation**: Presents the plan in both written form and visual format with tabbed interface
- **Email Delivery**: Option to receive the plan via email
- **Persistence Protection**: Prevents unnecessary API calls by tracking plan generation state

### 3. User Authentication
- Multiple authentication methods:
  - Email/password sign-up and sign-in
  - Google OAuth sign-in
- Protected routes requiring authentication
- User session management
- Middleware protection for authenticated routes
- OAuth callback handling for redirects
- Easy switching between sign-up and sign-in modes

### 4. Responsive UI Components
- Beautiful gradient backgrounds with animated blobs
- Mobile-responsive design
- Interactive elements with hover states and animations
- Dark/light mode support
- Tabbed interfaces for different authentication methods and content display
- Custom Progress component for tracking multi-step processes

### 5. Data Visualization
- Severity gauge showing the urgency of health concerns
- Probability bars for possible causes
- Priority indicators for recommended actions
- Sorting of causes and actions by importance
- Timeline visualization for wellness plan follow-up schedules
- Card-based visual representation of wellness recommendations

## Application Structure

### Pages
- **Home (`/`)**: Landing page with feature highlights and call to action
- **Diagnosis (`/diagnose`)**: Main feature page for submitting symptoms and images (protected)
- **Wellness (`/wellness`)**: Interactive questionnaire for generating cat wellness plans
- **Sign In (`/signin`)**: Authentication page with email/password and social login options
- **Auth Callback (`/auth/callback`)**: Handles OAuth redirects and session exchanges

### API Routes
- **Diagnosis API (`/api/diagnose`)**: Processes symptom data and images, returns diagnosis
- **Wellness API (`/api/wellness`)**: Processes questionnaire data to generate wellness plans
- **Email API (`/api/wellness/email`)**: Handles sending wellness plans to users via email
- **Authentication**: Uses Supabase for authentication handling

### Components
- **UI Components**: Button, Card, Form, Input, Progress, Textarea, Tabs, etc.
- **Layout Components**: Header, Footer
- **Authentication Components**: SupabaseAuthButton for login/logout
- **Specialized Components**: CatLogo, WellnessPlanVisualization
- **Form Components**: Custom multi-step form with progress tracking

## Authentication Flow

### Email/Password Authentication
1. User goes to the sign-in page
2. User can toggle between sign-in and sign-up modes
3. User enters email and password
4. For sign-up, verification email is sent
5. User confirms email to complete sign-up
6. For sign-in, credentials are validated
7. After successful authentication, user is redirected to the requested page

### Social Authentication (Google)
1. User clicks "Continue with Google" button
2. User is redirected to Google authentication
3. After successful authentication, user is redirected back to callback route
4. Auth session is established with Supabase
5. User is redirected to the requested page

### Protected Routes
- Middleware checks if user is authenticated
- If not authenticated, redirects to sign-in page
- After successful authentication, redirects back to the originally requested page

## Diagnosis Flow
1. User enters their cat's name and age (optional)
2. User describes symptoms or uploads an image (or both)
3. System processes the information using OpenAI's API
4. Results are displayed with:
   - Markdown-formatted diagnosis text
   - Severity gauge
   - Possible causes with probability percentages
   - Recommended actions with priority levels
5. User can start a new diagnosis or return home

## Wellness Plan Flow
1. User completes a 5-step questionnaire about their cat:
   - Basic information (step 1)
   - Health & lifestyle (step 2)
   - Behavior & training (step 3)
   - Enrichment & routine (step 4)
   - Goals & preferences (step 5)
2. Progress bar shows completion percentage throughout
3. After submission, system generates:
   - Comprehensive written wellness plan
   - Structured visual representation with tabs for different aspects
   - Health recommendations
   - Behavior training suggestions
   - Enrichment plan
   - Follow-up schedule
4. User can share plan via email
5. Key recommendations are highlighted
6. User can create a new plan or return to previous steps

## Technical Features

### Supabase Integration
- Multiple authentication methods:
  - Email/password with verification
  - Google OAuth integration
- Session management using cookies
- Server-side client for API routes
- Client-side hooks for authentication state
- Middleware for protecting routes

### OpenAI Integration
- Uses GPT-4o-mini model for:
  - Diagnosis generation based on symptoms/images
  - Wellness plan creation based on questionnaire data
  - Structured JSON data for visualizations
- Multiple API calls per feature to generate different components:
  - Main textual content
  - Structured data for visualization

### Error Handling
- Form validation for required fields
- Loading states during API calls
- Error reset for visualization loading
- Fallback data if API responses are incomplete
- Toast notifications for user feedback

### Performance Optimization
- Tracking plan generation state to prevent redundant API calls
- Conditional rendering to minimize component re-renders
- Efficient state management for multi-step processes
- Caching of generated plans to avoid unnecessary regeneration

### Authentication
- Protected routes requiring login
- Integration with Supabase authentication
- Middleware for route protection
- User-friendly authentication UI with tabs

## Styling and Design
- Gradient text and background effects
- Animated gradient blobs for visual interest
- Responsive card layouts
- Custom progress bars for data visualization
- Custom markdown rendering with styled elements
- Tabbed interfaces for authentication options
- Card-based selection interface with visual feedback
- Illustration-based UI elements for intuitive interaction

## Future Extensions
- Payment processing for premium features (subscription models)
- History of past diagnoses and wellness plans
- Follow-up reminders and plan adjustment
- Integration with veterinary telehealth services
- Enhanced image analysis capabilities
- Integration with pet food and supply vendors
- Mobile application

## Environment Variables
The application uses the following environment variables:
- `OPENAI_API_KEY`: For accessing OpenAI API
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase instance URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public Supabase key
- `SUPABASE_SERVICE_ROLE_KEY`: Admin Supabase key for server operations

## Supabase Setup
In Supabase:
1. Set up a project and obtain the API keys
2. Configure authentication providers:
   - Enable Email/Password authentication with email confirmations
   - Configure OAuth providers (Google) with appropriate credentials
   - Set up redirect URLs for authentication
3. Create appropriate tables for storing user data
4. Set up security policies to protect user data

## Usage Limitations
- The application provides preliminary assessments only and is not a substitute for professional veterinary care
- Image analysis capabilities are limited by the underlying AI model
- Processing times may vary based on server load and complexity of the analysis
- Wellness plans are general recommendations and may need adaptation for specific cats

---

*This documentation is maintained and updated as new features are added to the CatHealth application.* 