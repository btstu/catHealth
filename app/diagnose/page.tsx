"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import Image from "next/image";
import ReactMarkdown from 'react-markdown';

// Define form schema with zod
const formSchema = z.object({
  petName: z.string().min(1, { message: "Please enter your cat's name" }),
  petAge: z.string().optional(),
  symptoms: z.string().min(5, { message: "Please describe the symptoms you're seeing" }),
  image: z.any().refine((file) => file?.length > 0, "Please upload an image of your cat")
});

export default function DiagnosePage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      petName: "",
      petAge: "",
      symptoms: "",
    },
  });

  // Handle image selection for preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setProgress(0);
      setDiagnosis(null);
      
      // Progress interval
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) { // Only go up to 95% while waiting for API
            return 95;
          }
          return prev + 5;
        });
      }, 200);
      
      // Create FormData for the API call
      const formData = new FormData();
      formData.append('petName', values.petName);
      if (values.petAge) {
        formData.append('petAge', values.petAge);
      }
      formData.append('symptoms', values.symptoms);
      if (values.image && values.image[0]) {
        formData.append('image', values.image[0]);
      }
      
      // API call
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(interval);
      setProgress(100);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get diagnosis');
      }
      
      const data = await response.json();
      setDiagnosis(data.diagnosis);
      toast.success("Diagnosis complete!");
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during diagnosis');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-blue-50 dark:from-pink-950 dark:to-blue-950 py-10">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300 group-hover:bg-pink-200 dark:group-hover:bg-pink-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
            </div>
            <span className="text-gray-700 dark:text-gray-200">Back Home</span>
          </Link>
          
          <div className="flex items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-transparent">
              CatHealth
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {!diagnosis ? (
            <div className="grid md:grid-cols-12 gap-8">
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 md:col-span-8">
                <CardHeader>
                  <CardTitle className="text-2xl text-center bg-gradient-to-r from-pink-600 to-violet-700 bg-clip-text text-transparent">
                    Cat Health Diagnosis
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                    Upload a photo and tell us about your cat's health concern
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form 
                      onSubmit={form.handleSubmit(onSubmit)} 
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="petName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cat's Name</FormLabel>
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
                            <FormLabel>Cat's Age (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 3 years" {...field} />
                            </FormControl>
                            <FormDescription>
                              This helps provide age-appropriate advice
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="symptoms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Describe the symptoms</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What symptoms is your cat showing? When did they start?" 
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field: { value, onChange, ...field } }) => (
                          <FormItem>
                            <FormLabel>Upload Image</FormLabel>
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
                            <FormDescription>
                              Upload a clear image of the affected area
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
              
              <div className="space-y-6 md:col-span-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500/90 to-blue-600/90 text-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-center">How It Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>Our AI technology analyzes images of your cat's health concerns and provides an initial assessment based on veterinary knowledge.</p>
                    
                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">1</div>
                      <p className="text-sm">Upload a clear photo of the affected area</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">2</div>
                      <p className="text-sm">Provide details about your cat's symptoms</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">3</div>
                      <p className="text-sm">Receive a preliminary diagnosis and next steps</p>
                    </div>
                  </CardContent>
                </Card>
                
                {imagePreview && (
                  <Card className="border-0 shadow-md overflow-hidden">
                    <div className="aspect-square relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-900">
                      <h3 className="font-medium text-lg mb-1">Image Preview</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Make sure the affected area is clearly visible
                      </p>
                    </div>
                  </Card>
                )}
                
                {isLoading && (
                  <Card className="border-0 shadow-md p-4 bg-white dark:bg-gray-900">
                    <h3 className="font-medium text-center mb-2">Analyzing Image</h3>
                    <Progress value={progress} className="h-2 mb-2" />
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Our AI is analyzing the image and symptoms
                    </p>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card className="mt-4 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-violet-600 text-white py-4">
                <CardTitle>Diagnosis Results</CardTitle>
                <CardDescription className="text-gray-100">
                  Based on the image and symptoms provided
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-6">
                  {imagePreview && (
                    <div className="md:col-span-1">
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Uploaded Image</h3>
                        <div className="relative aspect-square overflow-hidden rounded-md">
                          <img 
                            src={imagePreview} 
                            alt="Cat health concern" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className={`diagnosis-content prose prose-pink max-w-none ${imagePreview ? 'md:col-span-3' : 'md:col-span-4'}`}>
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
        </div>
        
        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} CatHealth - AI-Powered Cat Diagnosis</p>
          <p className="mt-1">
            This tool is for informational purposes only and does not replace professional veterinary advice.
          </p>
        </footer>
      </div>
    </div>
  );
} 