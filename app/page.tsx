import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { CatLogo } from "@/components/CatLogo";


export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-blue-50 dark:from-pink-950 dark:to-blue-950">
      <div className="container mx-auto px-4 py-16">
        <header className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
          <header className="mb-4 flex justify-center">
        <CatLogo />
      </header>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-transparent drop-shadow-sm">
            CatHealth
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get a professional diagnosis for your cat's health concerns with the power of AI
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-pink-600 dark:text-pink-400">
                How It Works
              </CardTitle>
              <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                Three simple steps to help your feline friend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg bg-pink-50 dark:bg-pink-950/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-300 font-bold">1</div>
                <div>
                  <h3 className="font-medium text-pink-700 dark:text-pink-300">Take a Photo</h3>
                  <p className="text-gray-600 dark:text-gray-400">Snap a clear picture of your cat's affected area</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300 font-bold">2</div>
                <div>
                  <h3 className="font-medium text-violet-700 dark:text-violet-300">Upload the Image</h3>
                  <p className="text-gray-600 dark:text-gray-400">Submit the photo through our secure platform</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 font-bold">3</div>
                <div>
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Get Expert Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-400">Receive a professional assessment and recommendations</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center w-full">
                Our AI uses advanced vision technology to analyze symptoms and provide guidance based on veterinary knowledge.
              </p>
            </CardFooter>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500/90 to-violet-600/90 text-white">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Ready to Help Your Cat?</CardTitle>
                <CardDescription className="text-center text-white/80">
                  Get started with your first diagnosis
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-6">
                  Our AI-powered tool can help identify common cat health issues and provide initial guidance on what steps to take.
                </p>
                <Button asChild className="w-full py-6 text-lg bg-white hover:bg-white/90 text-violet-600 hover:text-violet-700">
                  <Link href="/diagnose">
                    Start Diagnosis
                  </Link>
                </Button>
              </CardContent>
              <CardFooter className="text-center text-sm text-white/80 justify-center">
                <p>Not a replacement for professional veterinary care</p>
              </CardFooter>
            </Card>

            <Card className="border-0 shadow-md bg-white/70 backdrop-blur-sm dark:bg-gray-900/70">
              <CardHeader>
                <CardTitle className="text-xl text-center text-gray-800 dark:text-gray-200">
                  When to See a Veterinarian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  While our tool can provide initial guidance, please seek immediate veterinary care if your cat shows:
                </p>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside text-gray-600 dark:text-gray-400">
                  <li>Difficulty breathing</li>
                  <li>Severe lethargy or collapse</li>
                  <li>Prolonged vomiting or diarrhea</li>
                  <li>Signs of pain or distress</li>
                  <li>Inability to eat or drink</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="mt-20 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} CatHealth - AI-Powered Pet Diagnosis Assistant</p>
          <p className="mt-1">This is an AI tool and should not replace professional veterinary advice.</p>
        </footer>
      </div>
    </div>
  );
}
