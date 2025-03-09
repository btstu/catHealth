# CatHealth - AI-Powered Pet Diagnosis Assistant

CatHealth is a modern web application that helps cat owners get preliminary diagnoses for their pets' health concerns. The app leverages OpenAI's Vision API to analyze images of cats and provide professional assessments based on visual analysis and symptom descriptions.

## Features

- **User-friendly Interface**: Beautiful, colorful, and modern UI built with Next.js and shadcn/ui components
- **Image Upload**: Upload images of your cat's health concerns directly from your device
- **Symptom Description**: Provide detailed information about the symptoms your cat is experiencing
- **AI-Powered Analysis**: Get a professional assessment using OpenAI's Vision API
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15.2
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **API Integration**: OpenAI Vision API
- **Notifications**: Sonner toast notifications

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenAI API key with access to the GPT-4 Vision API

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
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
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
