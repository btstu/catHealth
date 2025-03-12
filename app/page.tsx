import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 z-0"></div>
      
      {/* Animated Gradient Blobs */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-gradient-to-r from-pink-200/30 to-pink-300/30 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-3/4 -right-24 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-purple-300/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-violet-300/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      
      {/* Content */}
      <div className="container relative mx-auto min-h-screen flex items-center justify-center px-4 z-10">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          <div className="space-y-6">
            <div className="relative">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-pink-500 via-purple-500 to-violet-600 bg-clip-text text-transparent animate-gradient-x">
              CatHealth
              </h1>
              <p className="text-2xl font-medium mt-2 text-gray-700">
              😸 AI-Powered Cat Health Assistant
              </p>
            </div>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
              Upload a photo of your cat's health concern or describe their symptoms to get instant AI-powered diagnosis suggestions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <Link href="/diagnose">Get a Diagnosis</Link>
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                  <path d="M9 18h6"></path>
                  <path d="M10 22h4"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Quick Diagnosis</h3>
              <p className="text-gray-600">Get preliminary insights about your cat's health concerns in minutes</p>
            </div>
            
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Detailed Analysis</h3>
              <p className="text-gray-600">Receive comprehensive information about potential causes and treatments</p>
            </div>
            
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-600 rounded-full flex items-center justify-center text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Veterinary Guidance</h3>
              <p className="text-gray-600">Know when to seek professional veterinary care for your cat</p>
            </div>
          </div>
          
          <div className="mt-12 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} CatHealth - AI-Powered Cat Diagnosis</p>
            <p className="mt-1">
              This tool is for informational purposes only and does not replace professional veterinary advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
