"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from '@/utils/supabase/client'
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SupabaseAuthButton } from "@/components/supabase-auth-button"
import Image from "next/image"
import WellnessPlanVisualization from "@/components/wellness-plan-visualization"

// Custom Progress component that supports custom indicator classes
const Progress = ({ value = 0, className = "", indicatorClassName = "" }) => {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
      <div
        className={`h-full rounded-full ${indicatorClassName || 'bg-blue-500'}`}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export default function WellnessPlanPage() {
  const supabase = createClient()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [wellnessPlan, setWellnessPlan] = useState<string | null>(null)
  const [wellnessPlanData, setWellnessPlanData] = useState<any | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [isPlanGenerated, setIsPlanGenerated] = useState(false) // Add this line to track if the plan has been generated
  const totalSteps = 5
  
  // Form data state
  const [formData, setFormData] = useState({
    // Basic information
    catName: "",
    catAge: "",
    catBreed: "",
    catSex: "",
    catNeutered: "",
    
    // Health & Lifestyle
    catWeight: "",
    catDiet: "",
    catFeeding: "",
    catActivity: "",
    catEnvironment: "",
    
    // Behavior & Training
    behaviorIssues: [] as string[],
    behaviorDetails: "",
    catTraining: "",
    
    // Enrichment & Routine
    playTime: "",
    favoriteActivities: [] as string[],
    homeEnrichment: [] as string[],
    otherPets: "",
    
    // Owner's goals
    primaryGoal: "",
  })
  
  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsAuthenticated(true)
        setUser(session.user)
        setUserEmail(session.user.email || "")
      }
    }
    
    checkUser()
  }, [supabase.auth]) // Dependency here is good
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle checkbox changes for multi-select options
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const { value, checked } = e.target
    
    setFormData(prev => {
      const currentValues = prev[field as keyof typeof prev] as string[]
      
      if (checked) {
        // Add to array if checked
        return { ...prev, [field]: [...currentValues, value] }
      } else {
        // Remove from array if unchecked
        return { ...prev, [field]: currentValues.filter(item => item !== value) }
      }
    })
  }
  
  // Handle card selection for single-choice options
  const handleCardSelection = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  // Handle form navigation
  const nextStep = () => {
    // Validate current step
    if (currentStep === 1 && !formData.catName) {
      toast.error("Please enter your cat's name")
      return
    }
    
    // Move to next step if valid
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If plan is already generated, don't resubmit
    if (isPlanGenerated) {
      setCurrentStep(6) // Just go to the results page
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Create form data for API request
      const apiFormData = new FormData()
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle array values like behavioral issues, favorite activities, etc.
          value.forEach(item => {
            apiFormData.append(key, item)
          })
        } else {
          apiFormData.append(key, value as string)
        }
      })
      
      // Add email if authenticated
      if (isAuthenticated && user?.email) {
        apiFormData.append('userEmail', user.email)
      }
      
      // Submit to API
      const response = await fetch('/api/wellness', {
        method: 'POST',
        body: apiFormData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate wellness plan')
      }
      
      const data = await response.json()
      
      // Store the wellness plan data
      setWellnessPlan(data.wellnessPlan)
      setWellnessPlanData(data.wellnessPlanData)
      setIsPlanGenerated(true) // Mark that the plan has been generated
      
      // Update authentication status based on API response
      setIsAuthenticated(data.isAuthenticated)
      
      // Move to results (step 6)
      setCurrentStep(6)
    } catch (error) {
      toast.error('Error generating wellness plan')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle sending wellness plan to email
  const handleSendEmail = async () => {
    if (!userEmail) {
      toast.error('Please enter your email address')
      return
    }
    
    setIsEmailSending(true)
    
    try {
      const response = await fetch('/api/wellness/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          wellnessPlan,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send wellness plan')
      }
      
      const data = await response.json()
      toast.success(data.message || 'Wellness plan sent to your email')
    } catch (error) {
      toast.error('Error sending wellness plan to email')
      console.error(error)
    } finally {
      setIsEmailSending(false)
    }
  }
  
  // Handle sign in redirection
  const handleSignIn = () => {
    router.push(`/signin?callbackUrl=${encodeURIComponent('/wellness')}`)
  }
  
  // Progress bar calculation
  const progress = ((currentStep - 1) / totalSteps) * 100
  
  // Render form based on current step
  const renderForm = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <Label htmlFor="catName" className="text-lg">What's your cat's name? <span className="text-red-500">*</span></Label>
              <Input
                id="catName"
                name="catName"
                value={formData.catName}
                onChange={handleInputChange}
                placeholder="e.g., Whiskers"
                required
                className="text-lg p-3"
              />
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">How old is your cat?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catAge === "Kitten (0-1 year)" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catAge", "Kitten (0-1 year)")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/playfull.svg"
                      alt="Kitten"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Kitten</h3>
                  <p className="text-center text-sm text-gray-500">0-1 year</p>
                  {formData.catAge === "Kitten (0-1 year)" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catAge === "Adult (1-7 years)" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catAge", "Adult (1-7 years)")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/comfy.svg"
                      alt="Adult Cat"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Adult</h3>
                  <p className="text-center text-sm text-gray-500">1-7 years</p>
                  {formData.catAge === "Adult (1-7 years)" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catAge === "Senior (8+ years)" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catAge", "Senior (8+ years)")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/sleepy.svg"
                      alt="Senior Cat"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Senior</h3>
                  <p className="text-center text-sm text-gray-500">8+ years</p>
                  {formData.catAge === "Senior (8+ years)" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mt-8">
              <Label htmlFor="catBreed" className="text-lg">Cat's Breed (optional)</Label>
              <Input
                id="catBreed"
                name="catBreed"
                value={formData.catBreed}
                onChange={handleInputChange}
                placeholder="e.g., Domestic Shorthair, Siamese"
              />
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">What's your cat's sex?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catSex === "Male" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catSex", "Male")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/diva.svg"
                      alt="Male Cat"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Male</h3>
                  {formData.catSex === "Male" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catSex === "Female" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catSex", "Female")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/cleaning.svg"
                      alt="Female Cat"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Female</h3>
                  {formData.catSex === "Female" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">Is your cat spayed/neutered?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catNeutered === "Yes" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catNeutered", "Yes")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/birthday.svg"
                      alt="Spayed/Neutered"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Yes</h3>
                  {formData.catNeutered === "Yes" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catNeutered === "No" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catNeutered", "No")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/lazy.svg"
                      alt="Not Spayed/Neutered"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">No</h3>
                  {formData.catNeutered === "No" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center mb-6">Health & Lifestyle</h2>
            
            <div className="space-y-4">
              <Label className="text-lg mb-4 block">What's your cat's weight/body condition?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catWeight === "Underweight" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catWeight", "Underweight")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/hiding.svg"
                      alt="Underweight Cat"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Underweight</h3>
                  <p className="text-center text-sm text-gray-500">Too thin</p>
                  {formData.catWeight === "Underweight" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catWeight === "Ideal Weight" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catWeight", "Ideal Weight")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/playing.svg"
                      alt="Ideal Weight Cat"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Ideal Weight</h3>
                  <p className="text-center text-sm text-gray-500">Just right</p>
                  {formData.catWeight === "Ideal Weight" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catWeight === "Overweight" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catWeight", "Overweight")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/fatcat.svg"
                      alt="Overweight Cat"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Overweight</h3>
                  <p className="text-center text-sm text-gray-500">Too heavy</p>
                  {formData.catWeight === "Overweight" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">What type of diet does your cat eat?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catDiet === "Dry kibble only" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catDiet", "Dry kibble only")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/eating.svg"
                      alt="Dry Kibble"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Dry Kibble</h3>
                  {formData.catDiet === "Dry kibble only" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catDiet === "Wet food only" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catDiet", "Wet food only")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/comfy.svg"
                      alt="Wet Food"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Wet Food</h3>
                  {formData.catDiet === "Wet food only" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catDiet === "Mix of dry and wet" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catDiet", "Mix of dry and wet")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/cooking.svg"
                      alt="Mix of Wet and Dry"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Mix of Both</h3>
                  {formData.catDiet === "Mix of dry and wet" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">How do you feed your cat?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catFeeding === "Free-fed (always available)" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catFeeding", "Free-fed (always available)")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/busy.svg"
                      alt="Free-fed"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Free-fed</h3>
                  <p className="text-center text-sm text-gray-500">Always available</p>
                  {formData.catFeeding === "Free-fed (always available)" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catFeeding === "Specific mealtimes" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catFeeding", "Specific mealtimes")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/cat.svg"
                      alt="Specific mealtimes"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Scheduled</h3>
                  <p className="text-center text-sm text-gray-500">Specific times</p>
                  {formData.catFeeding === "Specific mealtimes" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catFeeding === "Combination" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catFeeding", "Combination")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/clumsy.svg"
                      alt="Combination"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Combination</h3>
                  <p className="text-center text-sm text-gray-500">Mix of both</p>
                  {formData.catFeeding === "Combination" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">What is your cat's activity level?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catActivity === "Low (couch potato)" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catActivity", "Low (couch potato)")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/lazy.svg"
                      alt="Low activity"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Low</h3>
                  <p className="text-center text-sm text-gray-500">Couch potato</p>
                  {formData.catActivity === "Low (couch potato)" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catActivity === "Medium (occasional play)" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catActivity", "Medium (occasional play)")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/sleepy.svg"
                      alt="Medium activity"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Medium</h3>
                  <p className="text-center text-sm text-gray-500">Occasional play</p>
                  {formData.catActivity === "Medium (occasional play)" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catActivity === "High (very playful)" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catActivity", "High (very playful)")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/playfull.svg"
                      alt="High activity"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">High</h3>
                  <p className="text-center text-sm text-gray-500">Very playful</p>
                  {formData.catActivity === "High (very playful)" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catActivity === "Extreme (constant zoomies)" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catActivity", "Extreme (constant zoomies)")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/playing.svg"
                      alt="Extreme activity"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Extreme</h3>
                  <p className="text-center text-sm text-gray-500">Constant zoomies</p>
                  {formData.catActivity === "Extreme (constant zoomies)" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">What is your cat's living environment?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catEnvironment === "Indoor only" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catEnvironment", "Indoor only")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/comfy.svg"
                      alt="Indoor Only"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Indoor Only</h3>
                  {formData.catEnvironment === "Indoor only" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catEnvironment === "Indoor-Outdoor (comes and goes)" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catEnvironment", "Indoor-Outdoor (comes and goes)")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/climbing.svg"
                      alt="Indoor-Outdoor"
                      fill
                      className="object-contain"
                      onError={() => console.log("Image not found, using default")}
                    />
                  </div>
                  <h3 className="text-center font-medium">Indoor-Outdoor</h3>
                  <p className="text-center text-sm text-gray-500">Comes and goes</p>
                  {formData.catEnvironment === "Indoor-Outdoor (comes and goes)" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center mb-6">Behavior & Training</h2>
            
            <div className="space-y-4">
              <Label className="text-lg mb-4 block">Does your cat have any behavior issues or concerns?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { value: 'Scratching furniture', image: '/angry.svg' },
                  { value: 'Not using litter box consistently', image: '/disgust.svg' },
                  { value: 'Aggression (hissing/biting)', image: '/angry2.svg' },
                  { value: 'Anxiety or fearfulness', image: '/scared.svg' },
                  { value: 'Excessive meowing', image: '/Annoyed.svg' }
                ].map((issue) => (
                  <div 
                    key={issue.value}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.behaviorIssues.includes(issue.value) ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    onClick={() => {
                      const newBehaviorIssues = [...formData.behaviorIssues];
                      if (newBehaviorIssues.includes(issue.value)) {
                        // Remove if already selected
                        const index = newBehaviorIssues.indexOf(issue.value);
                        newBehaviorIssues.splice(index, 1);
                      } else {
                        // Add if not selected
                        newBehaviorIssues.push(issue.value);
                      }
                      setFormData({...formData, behaviorIssues: newBehaviorIssues});
                    }}
                  >
                    <div className="mb-3 h-24 w-full relative">
                      <Image
                        src={issue.image}
                        alt={issue.value}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-center font-medium text-sm">{issue.value}</h3>
                    {formData.behaviorIssues.includes(issue.value) && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 mt-8">
              <Label htmlFor="behaviorDetails" className="text-lg">Describe Behavior Issues (Optional)</Label>
              <Textarea
                id="behaviorDetails"
                name="behaviorDetails"
                value={formData.behaviorDetails}
                onChange={handleInputChange}
                placeholder="Provide any details about the issues marked above"
                rows={3}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">Has your cat had any training?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catTraining === "No formal training" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catTraining", "No formal training")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/clumsy.svg"
                      alt="No formal training"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">No Formal Training</h3>
                  {formData.catTraining === "No formal training" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.catTraining === "Knows some tricks or commands" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  onClick={() => handleCardSelection("catTraining", "Knows some tricks or commands")}
                >
                  <div className="mb-3 h-32 w-full relative">
                    <Image
                      src="/playfull.svg"
                      alt="Knows tricks"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-center font-medium">Knows Tricks/Commands</h3>
                  {formData.catTraining === "Knows some tricks or commands" && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center mb-6">Enrichment & Routine</h2>
            
            <div className="space-y-4">
              <Label className="text-lg mb-4 block">How much playtime does your cat get each day?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'Hardly any', image: '/lazy.svg', label: 'Hardly Any' },
                  { value: '5-10 minutes', image: '/sleepy.svg', label: '5-10 Minutes' },
                  { value: '10-30 minutes', image: '/playing.svg', label: '10-30 Minutes' },
                  { value: '30+ minutes', image: '/playfull.svg', label: '30+ Minutes' }
                ].map((option) => (
                  <div 
                    key={option.value}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.playTime === option.value ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    onClick={() => handleCardSelection("playTime", option.value)}
                  >
                    <div className="mb-3 h-28 w-full relative">
                      <Image
                        src={option.image}
                        alt={option.label}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-center font-medium">{option.label}</h3>
                    {formData.playTime === option.value && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">What are your cat's favorite activities?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { value: 'Chasing toys', image: '/playing.svg' },
                  { value: 'Climbing', image: '/clumsy.svg' },
                  { value: 'Watching birds', image: '/busy.svg' },
                  { value: 'Snuggling & petting', image: '/comfy.svg' }
                ].map((activity) => (
                  <div 
                    key={activity.value}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.favoriteActivities.includes(activity.value) ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    onClick={() => {
                      const newActivities = [...formData.favoriteActivities];
                      if (newActivities.includes(activity.value)) {
                        // Remove if already selected
                        const index = newActivities.indexOf(activity.value);
                        newActivities.splice(index, 1);
                      } else {
                        // Add if not selected
                        newActivities.push(activity.value);
                      }
                      setFormData({...formData, favoriteActivities: newActivities});
                    }}
                  >
                    <div className="mb-3 h-28 w-full relative">
                      <Image
                        src={activity.image}
                        alt={activity.value}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-center font-medium">{activity.value}</h3>
                    {formData.favoriteActivities.includes(activity.value) && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">What enrichment does your cat have at home?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { value: 'Has scratching post/tree', image: '/playing.svg' },
                  { value: 'Has puzzle feeders or treat toys', image: '/busy.svg' },
                  { value: 'Has hideaways (boxes/tunnels)', image: '/hiding.svg' },
                  { value: 'Regular new toys or rotation', image: '/playfull.svg' }
                ].map((enrichment) => (
                  <div 
                    key={enrichment.value}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.homeEnrichment.includes(enrichment.value) ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    onClick={() => {
                      const newEnrichment = [...formData.homeEnrichment];
                      if (newEnrichment.includes(enrichment.value)) {
                        // Remove if already selected
                        const index = newEnrichment.indexOf(enrichment.value);
                        newEnrichment.splice(index, 1);
                      } else {
                        // Add if not selected
                        newEnrichment.push(enrichment.value);
                      }
                      setFormData({...formData, homeEnrichment: newEnrichment});
                    }}
                  >
                    <div className="mb-3 h-28 w-full relative">
                      <Image
                        src={enrichment.image}
                        alt={enrichment.value}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-center font-medium text-sm">{enrichment.value}</h3>
                    {formData.homeEnrichment.includes(enrichment.value) && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4 mt-8">
              <Label className="text-lg mb-4 block">Does your cat live with other pets?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { value: 'No', image: '/cleaning.svg', label: 'No Other Pets' },
                  { value: 'Another cat', image: '/playing.svg', label: 'With Another Cat' },
                  { value: 'One or more dogs', image: '/scared.svg', label: 'With Dog(s)' },
                  { value: 'Other species', image: '/clumsy.svg', label: 'Other Species' }
                ].map((option) => (
                  <div 
                    key={option.value}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.otherPets === option.value ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    onClick={() => handleCardSelection("otherPets", option.value)}
                  >
                    <div className="mb-3 h-28 w-full relative">
                      <Image
                        src={option.image}
                        alt={option.label}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-center font-medium">{option.label}</h3>
                    {formData.otherPets === option.value && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center mb-6">Goals & Preferences</h2>
            
            <div className="space-y-4">
              <Label className="text-lg mb-4 block">What's your primary goal for your cat?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { value: 'Improve behavior issue', image: '/angry.svg', label: 'Improve Behavior' },
                  { value: 'Help my cat exercise more', image: '/lazy.svg', label: 'More Exercise' },
                  { value: 'Nutrition or weight management', image: '/fatcat.svg', label: 'Weight Management' },
                  { value: 'General wellness & happiness', image: '/playfull.svg', label: 'General Wellness' },
                  { value: 'Reduce anxiety/stress', image: '/scared.svg', label: 'Reduce Anxiety' },
                  { value: 'Other', image: '/cat.svg', label: 'Other' }
                ].map((goal) => (
                  <div 
                    key={goal.value}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${formData.primaryGoal === goal.value ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    onClick={() => handleCardSelection("primaryGoal", goal.value)}
                  >
                    <div className="mb-3 h-28 w-full relative">
                      <Image
                        src={goal.image}
                        alt={goal.label}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-center font-medium">{goal.label}</h3>
                    {formData.primaryGoal === goal.value && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="mt-10 p-6 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 relative flex-shrink-0">
                    <Image
                      src="/busy.svg"
                      alt="Sign In"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-700 text-lg mb-2">
                      Save Your Plan & Get Email Updates
                    </h3>
                    <p className="text-blue-600 mb-4">
                      Sign in to save your wellness plan, receive it by email, and access personalized updates over time.
                    </p>
                    <Button 
                      onClick={handleSignIn}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      Sign In Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 relative">
                  <Image
                    src={formData.behaviorIssues.length > 0 ? "/angry.svg" : "/playfull.svg"}
                    alt={formData.catName}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                {formData.catName}'s Wellness & Behavior Plan
              </h2>
              <p className="text-gray-600 mt-2">
                A personalized plan based on your cat's unique needs and preferences
              </p>
            </div>
            
            {/* Wellness plan tabs and content */}
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 pb-2">
                <CardTitle className="text-xl font-bold text-blue-700">Your Personalized Plan</CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                <Tabs defaultValue="plan" className="w-full">
                  <TabsList className="w-full bg-gray-100 p-0">
                    <TabsTrigger value="plan" className="flex-1 py-3">Written Plan</TabsTrigger>
                    <TabsTrigger value="visual" className="flex-1 py-3">Visual Plan</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="plan" className="p-6">
                    {wellnessPlan ? (
                      <div className="prose prose-sm md:prose-base max-w-none prose-headings:text-blue-700 prose-a:text-indigo-600 prose-strong:text-blue-900">
                        <div dangerouslySetInnerHTML={{ __html: wellnessPlan.replace(/\n/g, '<br>') }} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-20 h-20 relative mb-4">
                          <Image
                            src="/sad.svg"
                            alt="No plan"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-gray-500">No wellness plan generated. Please try again.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="visual" className="p-6">
                    {wellnessPlanData ? (
                      <div className="w-full">
                        <WellnessPlanVisualization 
                          data={wellnessPlanData} 
                          catName={formData.catName} 
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-20 h-20 relative mb-4">
                          <Image
                            src="/sad.svg"
                            alt="No visualization"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-gray-500">No visualization data available.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Email the wellness plan */}
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-100 to-blue-100 pb-2">
                <CardTitle className="text-xl font-bold text-indigo-700">Share Your Plan</CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 relative flex-shrink-0">
                      <Image
                        src="/busy.svg"
                        alt="Email"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Send this plan to your email</h3>
                      <p className="text-sm text-gray-600">Get a copy for your records and future reference</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Your email address"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendEmail}
                      disabled={isEmailSending}
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 w-full sm:w-auto"
                    >
                      {isEmailSending ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : 'Send to Email'}
                    </Button>
                  </div>
                  
                  {!isAuthenticated && (
                    <p className="text-xs text-gray-500 mt-1">
                      You'll be able to create an account after receiving the email
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Key recommendations */}
            {wellnessPlanData && (
              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-100 to-teal-100 pb-2">
                  <CardTitle className="text-xl font-bold text-green-700">Key Recommendations</CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                          <path d="M14.5 3H10a5 5 0 0 0-5 5v13a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a5 5 0 0 0-5-5Z"></path>
                          <line x1="10" x2="16" y1="10" y2="10"></line>
                          <line x1="13" x2="13" y1="7" y2="13"></line>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Nutrition</h3>
                        <p className="text-sm text-gray-600">{wellnessPlanData.healthRecommendations.nutrition}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                          <path d="M16 22h2a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h2"></path>
                          <rect width="10" height="12" x="7" y="2" rx="5"></rect>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Exercise</h3>
                        <p className="text-sm text-gray-600">{wellnessPlanData.healthRecommendations.exercise}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Enrichment</h3>
                        <p className="text-sm text-gray-600">{wellnessPlanData.enrichmentPlan.play}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Environment</h3>
                        <p className="text-sm text-gray-600">{wellnessPlanData.healthRecommendations.environment}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Start over */}
            <div className="flex justify-center mt-10">
              <Button 
                onClick={() => {
                  setCurrentStep(1)
                  setWellnessPlan(null)
                  setWellnessPlanData(null)
                  setIsPlanGenerated(false) // Reset the plan generation state
                }}
                variant="outline"
                className="px-8 py-6 text-lg font-medium"
              >
                Create a New Wellness Plan
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }
  
  return (
    <div className="min-h-screen py-12 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 z-0"></div>
      
      {/* Animated Gradient Blobs */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-blue-300/30 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-3/4 -right-24 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-purple-300/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-pink-200/30 to-indigo-300/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tighter md:text-5xl bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">
              Cat Wellness & Behavior Plan
            </h1>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
              Answer a few questions about your cat to receive a personalized wellness plan
              with behavior training tips and enrichment recommendations.
            </p>
          </div>
          
          {/* Progress bar */}
          {currentStep < 6 && (
            <div className="mb-8">
              <div className="flex justify-between mb-2 text-sm text-gray-600">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2.5 bg-blue-100" indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-600" />
            </div>
          )}
          
          {/* Main content */}
          <Card className="mb-8 border-none shadow-xl overflow-hidden">
            {currentStep < 6 && (
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-2 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {currentStep}
                  </div>
                  <CardTitle className="text-xl font-semibold text-blue-800">
                    {currentStep === 1 ? "About Your Cat" : 
                     currentStep === 2 ? "Health & Lifestyle" :
                     currentStep === 3 ? "Behavior & Training" :
                     currentStep === 4 ? "Enrichment & Fun" :
                     "Goals & Preferences"}
                  </CardTitle>
                </div>
              </CardHeader>
            )}
            
            <CardContent className={currentStep < 6 ? "pt-8 p-6 md:p-8" : "p-0"}>
              <form onSubmit={handleSubmit}>
                {renderForm()}
                
                {/* Navigation buttons */}
                {currentStep < 6 && (
                  <div className="flex justify-between mt-10">
                    {currentStep > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="px-6 py-2.5 border-2 font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="m15 18-6-6 6-6"/>
                        </svg>
                        Previous
                      </Button>
                    ) : (
                      <div></div>
                    )}
                    
                    {currentStep < totalSteps ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="px-6 py-2.5 font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      >
                        Next
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                          <path d="m9 18 6-6-6-6"/>
                        </svg>
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Plan...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            Generate Wellness Plan
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                              <path d="M5 12h14"></path>
                              <path d="m12 5 7 7-7 7"></path>
                            </svg>
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mb-8">
            <p>© {new Date().getFullYear()} CatHealth - Wellness & Behavior Plans</p>
            <p className="mt-1">
              This tool is for informational purposes only and does not replace professional veterinary advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 