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
- **Storage**: Browser localStorage for form data persistence
- **Markdown Rendering**: React-Markdown with custom component styling
- **PDF Generation**: jsPDF with html2canvas for beautiful downloadable reports
- **Next.js**: React framework for server-side rendering and static site generation
- **TypeScript**: Static typing for JavaScript, enhancing code quality and developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **shadcn/ui**: Beautifully designed components built with Radix UI and Tailwind
- **Supabase**: Backend as a Service (BaaS) for authentication and database
- **OpenAI API**: Leveraging AI to generate personalized wellness plans
- **PDF Generation**: Using jsPDF to create beautiful, downloadable reports with custom styling
- **Email Integration**: Sending wellness plans via email for future reference

## Core Features

### User Features

- **Personalized Wellness Plan Generation**: Create tailored plans based on cat-specific inputs
- **Cat Profile Management**: Save cat information and access personalized recommendations
- **Behavior Tracking**: Track improvements in behavior over time
- **PDF Export**: Generate beautifully formatted wellness plan PDFs with customized styling
- **Email Sharing**: Share wellness plans via email
- **Visual Wellness Dashboard**: Visualize wellness metrics and progress

### Technical Features

- **Multi-step Form**: User-friendly progressive disclosure of form fields
- **Client-side PDF Generation**: Create beautiful PDFs with custom styling directly in the browser 
- **AI-Powered Content Generation**: Leverage OpenAI for personalized recommendations
- **Authentication Flow**: Secure user authentication with Supabase Auth
- **Responsive Design**: Mobile-first approach ensures usability across devices
- **Local Storage Persistence**: Save form progress even if users haven't authenticated
- **Interactive Visualizations**: Visual representation of wellness metrics

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
- **Authentication Requirement**: User must be logged in to generate wellness plans
- **Personalized Wellness Plan**: Generates comprehensive wellness recommendations covering:
  - Health recommendations (nutrition, exercise, preventive care)
  - Behavior training (specific to reported issues)
  - Enrichment plan (play, toys, environment enrichment)
  - Follow-up schedule (weekly implementation plan)
- **Enhanced Plan Presentation**:
  - Beautifully styled markdown rendering with gradient headings and decorative elements
  - Dual-view options with tabs for written and visual formats
  - Custom-styled lists, blockquotes, and sections with visual hierarchy
  - PDF export functionality with beautifully formatted documents
  - Responsive design with proper typography and spacing
- **Email Delivery**: Option to receive the plan via email
- **Persistence Protection**: Prevents unnecessary API calls by tracking plan generation state
- **Form Data Preservation**: Preserves user input across authentication flows using localStorage

### 3. User Authentication
- Multiple authentication methods:
  - Email/password sign-up and sign-in
  - Google OAuth sign-in
- Protected routes requiring authentication
- User session management
- Middleware protection for authenticated routes
- OAuth callback handling for redirects
- Easy switching between sign-up and sign-in modes
- Seamless authentication with form data preservation
- Required for wellness plan generation and access to certain features

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
- **Wellness (`/wellness`)**: Interactive questionnaire for generating cat wellness plans (authentication required for generation)
- **Sign In (`/signin`)**: Authentication page with email/password and social login options
- **Auth Callback (`/auth/callback`)**: Handles OAuth redirects and session exchanges

### API Routes
- **Diagnosis API (`/api/diagnose`)**: Processes symptom data and images, returns diagnosis
- **Wellness API (`/api/wellness`)**: Processes questionnaire data to generate wellness plans (requires authentication)
- **Email API (`/api/wellness/email`)**: Handles sending wellness plans to users via email
- **Authentication**: Uses Supabase for authentication handling

### Components
- **UI Components**: Button, Card, Form, Input, Progress, Textarea, Tabs, etc.
- **Layout Components**: Header, Footer
- **Authentication Components**: SupabaseAuthButton for login/logout
- **Specialized Components**: CatLogo, WellnessPlanVisualization
- **Form Components**: Custom multi-step form with progress tracking
- **Markdown Components**: Custom styled components for markdown rendering
- **PDF Components**: PDF generation with customized formatting and styling

## Authentication Flow

### Email/Password Authentication
1. User goes to the sign-in page
2. User can toggle between sign-in and sign-up modes
3. User enters email and password
4. For sign-up, verification email is sent
5. User confirms email to complete sign-up
6. For sign-in, credentials are validated
7. After successful authentication, user is redirected to the requested page
8. If coming from a form, form data is preserved and restored

### Social Authentication (Google)
1. User clicks "Continue with Google" button
2. User is redirected to Google authentication
3. After successful authentication, user is redirected back to callback route
4. Auth session is established with Supabase
5. User is redirected to the requested page
6. If coming from a form, form data is preserved and restored

### Protected Routes
- Middleware checks if user is authenticated
- If not authenticated, redirects to sign-in page
- After successful authentication, redirects back to the originally requested page
- Form data is preserved through the authentication flow

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
3. If user is not logged in:
   - Form data is saved locally
   - User is prompted to sign in at step 5 before generating the plan
   - Cannot proceed to generate the plan without authentication
4. If user needs to sign in during the process:
   - Form data is saved to localStorage
   - User is redirected to sign-in page
   - After authentication, user returns to the form with data restored
   - Current step is preserved
5. After authentication and submission, system generates:
   - Comprehensive written wellness plan with beautifully styled markdown rendering
   - Structured visual representation with tabs for different aspects
   - Health recommendations
   - Behavior training suggestions
   - Enrichment plan
   - Follow-up schedule
6. User can download the wellness plan as a beautifully formatted PDF
7. User can share plan via email
8. Key recommendations are highlighted
9. User can create a new plan or return to previous steps

## PDF Generation

The application offers beautiful PDF exports of wellness plans with the following features:

- **Custom-Designed Cover Page**: Each PDF includes a professionally designed cover page with the cat's name
- **Professional Typography**: Clean, readable fonts with proper spacing and visual hierarchy
- **Color-Coded Sections**: Each section uses consistent color schemes for visual appeal and readability
- **Custom Header and Footer**: Professional headers and footers on each page
- **Multi-Page Support**: Automatic pagination with proper page breaks
- **Cat Illustrations**: Simple vector illustrations of cats add visual interest
- **Automatic Table of Contents**: Major sections are clearly organized
- **Decorative Elements**: Paw prints and other cat-themed decorative elements
- **High-Resolution Output**: Sharp, professional-looking documents
- **Consistent Branding**: Matches app styling while optimizing for print

### PDF Generation Process

1. The system creates a new PDF document using jsPDF
2. A beautiful cover page is generated with the cat's name and wellness plan title
3. Each section of the wellness plan is extracted and formatted with appropriate styling
4. The content is paginated with headers and footers on each page
5. Special styling is applied to lists, paragraphs, and headings for better readability
6. The final PDF is downloadable with a filename based on the cat's name

## Usage Patterns

### Authentication Flow

1. User starts creating a wellness plan by entering cat information
2. When reaching the final step, unauthenticated users are prompted to sign in
3. Form data is saved to localStorage before redirecting to sign-in
4. Upon successful authentication, user is redirected back to the form
5. The form is repopulated with saved data from localStorage
6. User completes the form and submits to generate their wellness plan
7. User can then access PDF download and email sharing features

### Wellness Plan Flow

1. User fills out multi-step form with cat information
2. System generates a personalized wellness plan using the OpenAI API
3. Wellness plan is displayed with rich formatting and visualizations
4. User can download a beautifully designed PDF of the plan
5. User can optionally email the plan to themselves or others
6. Plans are saved to the user's account for future reference

## Technical Features

### Supabase Integration
- Multiple authentication methods:
  - Email/password with verification
  - Google OAuth integration
- Session management using cookies
- Server-side client for API routes
- Client-side hooks for authentication state
- Middleware for protecting routes
- User authentication validation for wellness plan generation

### Local Storage Implementation
- Form data persistence between sessions
- Automatic saving of questionnaire progress
- Restoration of form state after authentication
- Preservation of multi-step form progress
- Clean up of stored data after form completion

### Markdown Rendering
- Uses React-Markdown for parsing markdown content
- Custom component styling for all markdown elements
- Visual hierarchy with styled headings, lists, and sections
- Decorative elements and gradients for headings
- PDF export integration for downloadable content
- Responsive design for all screen sizes

### PDF Generation
- Client-side PDF generation using jsPDF with direct text rendering
- Section-based extraction and formatting of wellness plan content
- Custom-styled headers and footers for professional documents
- Multi-page handling with automatic pagination
- Professional typography with font styling and proper spacing
- Enhanced visual hierarchy with indentation and section highlighting
- Stylized backgrounds and color schemes for visual appeal
- Intelligent bullet point and list formatting
- Precise content extraction with improved pattern matching
- Complete section preservation with accurate heading detection
- Empty section detection and handling
- Paragraph spacing intelligence for better readability
- Page numbering and comprehensive content organization

### OpenAI Integration
- Uses GPT-4o-mini model for:
  - Diagnosis generation based on symptoms/images
  - Wellness plan creation based on questionnaire data
  - Structured JSON data for visualizations
- Multiple API calls per feature to generate different components:
  - Main textual content
  - Structured data for visualization
- API access restricted to authenticated users for wellness plan generation

### Error Handling
- Form validation for required fields
- Loading states during API calls
- Error reset for visualization loading
- Fallback data if API responses are incomplete
- Toast notifications for user feedback
- Authentication error handling for protected operations
- Error handling during PDF generation with user-friendly messages

### Performance Optimization
- Tracking plan generation state to prevent redundant API calls
- Conditional rendering to minimize component re-renders
- Efficient state management for multi-step processes
- Caching of generated plans to avoid unnecessary regeneration
- Intelligent form data storage to prevent unnecessary re-renders
- Optimized PDF generation with progress indicators

### Authentication
- Protected routes requiring login
- Integration with Supabase authentication
- Middleware for route protection
- User-friendly authentication UI with tabs
- Seamless authentication with data persistence
- Required authentication for wellness plan generation

## Styling and Design
- Gradient text and background effects
- Animated gradient blobs for visual interest
- Responsive card layouts
- Custom progress bars for data visualization
- Custom markdown rendering with styled elements
- Tabbed interfaces for authentication options
- Card-based selection interface with visual feedback
- Illustration-based UI elements for intuitive interaction
- PDF styling with professional design elements
- Interactive document elements with hover states
- Visually organized content with proper spacing and hierarchies

## Future Extensions
- Payment processing for premium features (subscription models)
- History of past diagnoses and wellness plans
- Follow-up reminders and plan adjustment
- Integration with veterinary telehealth services
- Enhanced image analysis capabilities
- Integration with pet food and supply vendors
- Mobile application
- Server-side data persistence for form data
- Enhanced PDF customization options

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
- Form data persistence relies on browser localStorage, which can be cleared by users
- PDF generation happens client-side and requires JavaScript enabled
- Authentication is required to generate wellness plans
- PDF exports use standardized formatting rather than rich text styling
- PDF generation optimized for text content with basic formatting

---

*This documentation is maintained and updated as new features are added to the CatHealth application.* 