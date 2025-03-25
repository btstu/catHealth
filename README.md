# CatHealth - AI-Powered Pet Diagnosis Assistant

CatHealth is a modern web application that helps cat owners get preliminary diagnoses for their pets' health concerns. The app leverages OpenAI's Vision API to analyze images of cats and provide professional assessments based on visual analysis and symptom descriptions.

## Features

- **User-friendly Interface**: Beautiful, colorful, and modern UI built with Next.js and shadcn/ui components
- **Image Upload**: Upload images of your cat's health concerns directly from your device
- **Symptom Description**: Provide detailed information about the symptoms your cat is experiencing
- **AI-Powered Analysis**: Get a professional assessment using OpenAI's Vision API
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Email Notifications**: Receive wellness plans and authentication emails with improved deliverability

## Tech Stack

- **Framework**: Next.js 15.2
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **API Integration**: OpenAI Vision API
- **Notifications**: Sonner toast notifications
- **Email Delivery**: Resend API with proper HTML email templates
- **Authentication**: Supabase Auth with customized email templates

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenAI API key with access to the GPT-4 Vision API
- A Resend API key for email functionality
- A Supabase project for authentication and database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/cathealth.git
   cd cathealth
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the project root
   - Add your API keys:
     ```
     OPENAI_API_KEY=your_api_key_here
     RESEND_API_KEY=your_resend_api_key_here
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Navigate to the homepage and click "Start Diagnosis"
2. Fill out the form with your cat's information and symptoms
3. Upload a clear image of the affected area
4. Submit the form and wait for the AI to generate a diagnosis
5. Review the results and follow the recommended actions
6. Optionally share the wellness plan via email using our deliverability-optimized email templates

## Email Deliverability Improvements

CatHealth uses optimized HTML email templates to improve deliverability and reduce the chance of emails ending up in spam folders:

- **Proper HTML Structure**: All emails include proper HTML, HEAD, and BODY tags following email best practices
- **Responsive Design**: Table-based layouts that work well across email clients
- **Authentication Emails**: Custom Supabase templates for sign-up, magic link, and password reset emails
- **Wellness Plan Emails**: Professional, branded emails for sharing wellness plans
- **Plain Text Alternatives**: All HTML emails include plain text alternatives for better deliverability

### Customizing Supabase Email Templates

To use the custom email templates with Supabase:

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Email Templates
3. Update each template (Sign Up, Magic Link, Password Reset) with the HTML templates provided in `utils/email-templates.ts`
4. Save your changes

## Important Notes

- This application is for informational purposes only and is not a substitute for professional veterinary care.
- Always consult with a veterinarian for proper diagnosis and treatment of your pet's health concerns.
- In case of emergencies, contact your veterinarian or a pet emergency service immediately.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [OpenAI's Vision API](https://platform.openai.com/docs/guides/vision)
- Email delivery by [Resend](https://resend.com/)
- Authentication by [Supabase](https://supabase.com/)
