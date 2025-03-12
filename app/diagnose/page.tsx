"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Mock diagnosis data for visualizations
type DiagnosisData = {
  possibleCauses: Array<{name: string, probability: number}>;
  recommendedActions: Array<{action: string, urgency: number}>;
  severityScore: number;
};

type FormData = {
  petName: string;
  petAge?: string;
  symptoms: string;
  image: FileList | null;
};

export default function DiagnosePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisualizationLoading, setIsVisualizationLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<FormData>({
    defaultValues: {
      petName: "",
      petAge: "",
      symptoms: "",
      image: null
    }
  });

  // Handle authentication
  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") {
      router.replace("/signin?callbackUrl=/diagnose");
    }
  }, [status, router]);

  // Handle image selection for preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Only .jpg, .png, and .webp formats are supported");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("image", e.target.files);
    }
  };

  // Cleanup progress interval
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // Form submission handler
  const onSubmit = async (values: FormData) => {
    try {
      if (!values.image?.length && !values.symptoms.trim()) {
        toast.error("Please provide either a description of symptoms or upload an image");
        return;
      }

      if (!values.petName.trim()) {
        toast.error("Please provide your cat's name");
        return;
      }

      setIsLoading(true);
      setIsVisualizationLoading(true);
      setProgress(0);
      setDiagnosis(null);
      setDiagnosisData(null);
      
      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            return 95;
          }
          return prev + 5;
        });
      }, 200);
      
      const formData = new FormData();
      formData.append('petName', values.petName);
      if (values.petAge) {
        formData.append('petAge', values.petAge);
      }
      formData.append('symptoms', values.symptoms);
      if (values.image?.length) {
        formData.append('image', values.image[0]);
      }
      
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        body: formData,
      });
      
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      setProgress(100);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get diagnosis');
      }
      
      const data = await response.json();
      setDiagnosis(data.diagnosis);
      
      // Use the visualization data from the API response
      if (data.diagnosisData) {
        setDiagnosisData(data.diagnosisData);
      } else {
        // Fallback to default data if not provided
        setDiagnosisData({
          possibleCauses: [
            { name: "Unknown Cause", probability: 0.5 }
          ],
          recommendedActions: [
            { action: "Consult Veterinarian", urgency: 0.7 }
          ],
          severityScore: 0.5
        });
      }
      
      setIsVisualizationLoading(false);
      toast.success("Diagnosis complete!");
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during diagnosis');
      console.error(error);
      setIsVisualizationLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white py-6">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-100 text-pink-600 group-hover:bg-pink-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
            </div>
            <span className="text-gray-700">Back Home</span>
          </Link>
          
          <div className="flex items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-transparent">
              CatHealth
            </h1>
          </div>
        </div>

        {!diagnosis ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Section */}
            <Card className="border-0 shadow-lg bg-white lg:col-span-7">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-center bg-gradient-to-r from-pink-600 to-violet-700 bg-clip-text text-transparent">
                Cat Health Diagnosis 
                </CardTitle>
                <CardDescription className="text-center text-gray-600">
                🐾Upload a photo or describe your cat's health concern
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form 
                    onSubmit={form.handleSubmit(onSubmit)} 
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="petName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Cat's Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Whiskers" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="petAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Cat's Age (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 3 years" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="symptoms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Describe the symptoms</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What symptoms is your cat showing? When did they start?" 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            <span className="font-medium">Required if no image is uploaded.</span> Provide as much detail as possible.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Upload Image (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                handleImageChange(e);
                                onChange(e.target.files);
                              }}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-600">
                            Optional - a clear image of the affected area can help with diagnosis
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Analyzing..." : "Get Diagnosis"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Info Section */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500/90 to-blue-600/90 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-center">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">1</div>
                    <p className="text-sm">Describe your cat's symptoms in detail</p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">2</div>
                    <p className="text-sm">Optionally upload a photo for more accurate diagnosis</p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">3</div>
                    <p className="text-sm">Receive a detailed analysis with recommended actions</p>
                  </div>
                </CardContent>
              </Card>
              
              {imagePreview && (
                <Card className="border-0 shadow-md overflow-hidden">
                  <div className="aspect-video relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-3 bg-white">
                    <h3 className="font-medium text-lg mb-1">Image Preview</h3>
                    <p className="text-sm text-gray-600">
                      Make sure the affected area is clearly visible
                    </p>
                  </div>
                </Card>
              )}
              
              {isLoading && (
                <Card className="border-0 shadow-md p-4 bg-white">
                  <h3 className="font-medium text-center mb-2">🔎Analyzing Information</h3>
                  <Progress value={progress} className="h-2 mb-2" />
                  <p className="text-xs text-center text-gray-500">
                    Our AI is analyzing the information provided
                  </p>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-violet-600 text-white py-4">
              <CardTitle>🩺Diagnosis Results</CardTitle>
              <CardDescription className="text-gray-100">
                Based on the information provided
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-12 gap-0">
                {/* Diagnosis Text */}
                <div className="col-span-12 lg:col-span-7 p-6 border-r">
                  <div className="prose prose-pink max-w-none">
                    <ReactMarkdown
                      components={{
                        h2: ({ ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
                          <h2 className="text-2xl font-bold text-pink-600 mt-6 mb-3" {...props} />
                        ),
                        h3: ({ ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
                          <h3 className="text-xl font-semibold text-violet-600 mt-4 mb-2" {...props} />
                        ),
                        ul: ({ ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
                          <ul className="my-3 list-disc pl-5 space-y-1" {...props} />
                        ),
                        li: ({ ...props }: React.ComponentPropsWithoutRef<'li'>) => (
                          <li className="text-gray-700" {...props} />
                        ),
                        p: ({ ...props }: React.ComponentPropsWithoutRef<'p'>) => (
                          <p className="my-2 text-gray-800" {...props} />
                        ),
                        strong: ({ ...props }: React.ComponentPropsWithoutRef<'strong'>) => (
                          <strong className="font-semibold text-pink-700" {...props} />
                        ),
                      }}
                    >
                      {diagnosis}
                    </ReactMarkdown>
                  </div>
                </div>
                
                {/* Visualizations */}
                <div className="col-span-12 lg:col-span-5 bg-gray-50 p-6">
                  {isVisualizationLoading ? (
                    <div className="h-full flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600 text-center">🧪Generating analysis... </p>
                    </div>
                  ) : diagnosisData && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-pink-600 mb-4">Diagnosis Analysis</h2>
                      
                      {/* Severity Gauge */}
                      <div className="mb-6 flex flex-col items-center">
                        <div className="relative w-40 h-40">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-transparent">
                                {Math.round(diagnosisData.severityScore * 100)}%
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {diagnosisData.severityScore > 0.7 
                                  ? 'High Severity' 
                                  : diagnosisData.severityScore > 0.4 
                                    ? 'Moderate Severity' 
                                    : 'Low Severity'}
                              </div>
                            </div>
                          </div>
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="45" 
                              fill="none" 
                              stroke="#f3f4f6" 
                              strokeWidth="10" 
                            />
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="45" 
                              fill="none" 
                              stroke="url(#gradient)" 
                              strokeWidth="10" 
                              strokeDasharray={`${diagnosisData.severityScore * 283} 283`} 
                              strokeDashoffset="0" 
                              strokeLinecap="round" 
                              transform="rotate(-90 50 50)" 
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ec4899" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                        <p className="text-sm text-center text-gray-600 mt-2">Overall Severity Assessment</p>
                      </div>
                      
                      {/* Possible Causes */}
                      <div className="space-y-1 mb-6">
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Possible Causes</h3>
                        <div className="space-y-3">
                          {diagnosisData.possibleCauses
                            .sort((a, b) => b.probability - a.probability)
                            .map((cause) => (
                            <div key={cause.name} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">{cause.name}</span>
                                <span className="text-sm text-gray-500">{Math.round(cause.probability * 100)}%</span>
                              </div>
                              <Progress value={cause.probability * 100} className="h-2" 
                                style={{
                                  background: 'rgba(0,0,0,0.1)',
                                  '--progress-background': `linear-gradient(90deg, rgba(236,72,153,1) ${cause.probability * 50}%, rgba(139,92,246,1) 100%)`,
                                } as React.CSSProperties}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Recommended Actions */}
                      <div className="space-y-1">
                        <h3 className="text-md font-semibold text-gray-800 mb-2">Recommended Actions</h3>
                        <div className="space-y-3">
                          {diagnosisData.recommendedActions
                            .sort((a, b) => b.urgency - a.urgency)
                            .map((action) => (
                            <div key={action.action} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">{action.action}</span>
                                <span className="text-sm text-gray-500">
                                  {action.urgency > 0.7 ? 'High' : action.urgency > 0.4 ? 'Medium' : 'Low'} Priority
                                </span>
                              </div>
                              <Progress value={action.urgency * 100} className="h-2"
                                style={{
                                  background: 'rgba(0,0,0,0.1)',
                                  '--progress-background': action.urgency > 0.7 
                                    ? 'linear-gradient(90deg, rgba(239,68,68,1) 0%, rgba(236,72,153,1) 100%)' 
                                    : action.urgency > 0.4 
                                      ? 'linear-gradient(90deg, rgba(249,115,22,1) 0%, rgba(236,72,153,1) 100%)'
                                      : 'linear-gradient(90deg, rgba(16,185,129,1) 0%, rgba(59,130,246,1) 100%)',
                                } as React.CSSProperties}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {imagePreview && (
                        <div className="mt-6 pt-6 border-t">
                          <h3 className="text-md font-semibold text-gray-800 mb-2">Uploaded Image</h3>
                          <div className="relative aspect-video overflow-hidden rounded-md">
                            <img 
                              src={imagePreview} 
                              alt="Cat health concern" 
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex flex-col w-full gap-4">
                <div className="flex items-center text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <p className="text-sm">This is a preliminary assessment and not a substitute for professional veterinary care.</p>
                </div>
                <div className="flex gap-4 justify-end mt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDiagnosis(null);
                      setDiagnosisData(null);
                      setImagePreview(null);
                      form.reset();
                    }}
                  >
                    New Diagnosis
                  </Button>
                  <Button asChild>
                    <Link href="/">
                      Return Home
                    </Link>
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        )}
        
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} CatHealth - AI-Powered Cat Diagnosis</p>
          <p className="mt-1">
            This tool is for informational purposes only and does not replace professional veterinary advice.
          </p>
        </footer>
      </div>
    </div>
  );
} 