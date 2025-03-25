"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from '@/utils/supabase/client'
import { toast } from "sonner"

import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import Image from "next/image"
import WellnessPlanVisualization from "@/components/wellness-plan-visualization"
import ReactMarkdown from "react-markdown"
import { jsPDF } from "jspdf"

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
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [wellnessPlan, setWellnessPlan] = useState<string | null>(null)
  const [wellnessPlanData, setWellnessPlanData] = useState<any | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [isPlanGenerated, setIsPlanGenerated] = useState(false)
  const [formDataLoaded, setFormDataLoaded] = useState(false)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const totalSteps = 5
  
  // Utility function to clear localStorage data
  const clearLocalStorage = () => {
    console.log('Clearing localStorage data');
    localStorage.removeItem('catWellnessFormData');
    localStorage.removeItem('catWellnessFormStep');
  };
  
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
  
  // Load form data from localStorage on initial render
  useEffect(() => {
    // Only attempt to load once
    if (formDataLoaded) return;
    
    const loadFormData = async () => {
      try {
        // Check if user is authenticated
        const { data } = await supabase.auth.getSession();
        
        // If not authenticated or we're coming back from authentication process,
        // load saved form data
        const savedFormData = localStorage.getItem('catWellnessFormData');
        if (savedFormData) {
          try {
            const parsedData = JSON.parse(savedFormData);
            setFormData(parsedData);
            console.log('Form data loaded from localStorage');
          } catch (e) {
            console.error('Error parsing form data:', e);
            // If parsing fails, clear the corrupted data
            clearLocalStorage();
          }
        }
      } catch (error) {
        console.error('Error loading form data from localStorage:', error);
      }
      
      setFormDataLoaded(true);
    };
    
    loadFormData();
  }, [formDataLoaded, supabase.auth]);
  
  // Check authentication status and listen for changes
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      // Update authentication state based on session
      setIsAuthenticated(!!session)
      setUser(session?.user || null)
      setUserEmail(session?.user?.email || "")
      
      // Check URL params for returning from auth flow
      const fromAuth = searchParams.get('fromAuth');
      
      if (session && fromAuth === 'true') {
        // If returning from auth, restore the form state before clearing localStorage
        const savedStep = localStorage.getItem('catWellnessFormStep');
        if (savedStep) {
          const step = parseInt(savedStep, 10);
          console.log('Restoring to step:', step);
          setCurrentStep(step);
          
          // If user was on step 5 (the final step) and has now authenticated,
          // automatically trigger the form submission after a short delay
          // to allow the form state to be fully restored
          if (step === 5) {
            console.log('User has returned from auth on the final step - will auto-submit form');
            // Set a flag to submit the form after a delay (in a separate useEffect)
            setTimeout(() => {
              setIsSubmitting(true);
              setIsGeneratingPlan(true);
              // We'll handle the actual submission in a separate useEffect that watches isGeneratingPlan
            }, 1000);
          }
        }
        
        // Remove the query parameter using history API to clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // IMPORTANT: Only clear localStorage after we've restored the form data
        // and step, and only if we don't need it anymore (which is only when a plan is generated)
        // Otherwise, we need to keep the form data until the user generates a plan
        if (isPlanGenerated) {
          clearLocalStorage();
        }
      }
    }
    
    // Initial check
    checkUser()
    
    // Listen for auth state changes (sign in/sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, !!session);
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      setUserEmail(session?.user?.email || "");
      
      // If logged in, clear localStorage except when returning from auth flow
      if (session && _event === 'SIGNED_IN' && searchParams.get('fromAuth') !== 'true') {
        console.log('User signed in, clearing localStorage');
        clearLocalStorage();
      }
      
      // If logged out, make sure we cannot submit the plan
      if (!session) {
        setIsPlanGenerated(false);
      }
    });
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, searchParams, isPlanGenerated]);
  
  // Save form data to localStorage whenever it changes
  useEffect(() => {
    // Only save if:
    // 1. Form data has been loaded initially
    // 2. The form has been interacted with (not empty default state)
    // 3. The user is NOT authenticated (we don't need localStorage when authenticated)
    if (formDataLoaded && 
        !isAuthenticated &&
        (formData.catName || formData.catBreed || formData.catAge || formData.behaviorIssues.length > 0)) {
      // Save form data to localStorage
      localStorage.setItem('catWellnessFormData', JSON.stringify(formData));
      localStorage.setItem('catWellnessFormStep', currentStep.toString());
      console.log('Form data saved to localStorage, current step:', currentStep);
    } else if (formDataLoaded && isAuthenticated) {
      // If user is authenticated, ensure localStorage is cleared
      clearLocalStorage();
    }
  }, [formData, currentStep, formDataLoaded, isAuthenticated]);
  
  // Add a new useEffect to handle auto-submission after authentication
  useEffect(() => {
    // This effect is triggered when isGeneratingPlan changes to true after returning from auth
    if (isGeneratingPlan && isAuthenticated && searchParams.get('fromAuth') === 'true' && currentStep === 5) {
      // Create a function to handle form submission after authentication
      const submitFormAfterAuth = async () => {
        console.log('Auto-submitting form after authentication');
        try {
          // Create form data for API request
          const apiFormData = new FormData();
          
          // Add all form fields
          Object.entries(formData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              // Handle array values like behavioral issues, favorite activities, etc.
              value.forEach(item => {
                apiFormData.append(key, item);
              });
            } else {
              apiFormData.append(key, value as string);
            }
          });
          
          // Add email if authenticated
          if (user?.email) {
            apiFormData.append('userEmail', user.email);
          }
          
          // Submit to API
          const response = await fetch('/api/wellness', {
            method: 'POST',
            body: apiFormData,
          });
          
          if (response.status === 401) {
            // Session expired or not authenticated
            setIsAuthenticated(false);
            toast.error("Authentication required. Please sign in again.");
            return;
          }
          
          if (!response.ok) {
            throw new Error('Failed to generate wellness plan');
          }
          
          const data = await response.json();
          
          // Store the wellness plan data
          setWellnessPlan(data.wellnessPlan);
          setWellnessPlanData(data.wellnessPlanData);
          setIsPlanGenerated(true); // Mark that the plan has been generated
          
          // Update authentication status based on API response
          setIsAuthenticated(data.isAuthenticated);
          
          // Move to results (step 6)
          setCurrentStep(6);
          
          toast.success(`${formData.catName}'s wellness plan generated successfully!`);
        } catch (error) {
          toast.error('Error generating wellness plan');
          console.error(error);
        } finally {
          setIsSubmitting(false);
          setIsGeneratingPlan(false);
        }
      };
      
      // Call the function to submit the form
      submitFormAfterAuth();
    }
  }, [isGeneratingPlan, isAuthenticated, searchParams, currentStep, formData, user]);
  
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
    
    // If user is authenticated, clear localStorage as we're navigating through the form
    if (isAuthenticated) {
      clearLocalStorage();
    }
    
    // Move to next step if valid
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const prevStep = () => {
    // If user is authenticated, clear localStorage as we're navigating through the form
    if (isAuthenticated) {
      clearLocalStorage();
    }
    
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check immediate local state first
    if (!isAuthenticated) {
      toast.error("Please sign in to generate your wellness plan")
      return
    }
    
    // Double-check authentication with the server before proceeding
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setIsAuthenticated(false) // Update local state to match server state
      toast.error("Your session has expired. Please sign in again to generate your wellness plan")
      return
    }
    
    // If plan is already generated, don't resubmit
    if (isPlanGenerated) {
      setCurrentStep(6) // Just go to the results page
      return
    }
    
    setIsSubmitting(true)
    setIsGeneratingPlan(true)
    
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
      if (user?.email) {
        apiFormData.append('userEmail', user.email)
      }
      
      // Submit to API
      const response = await fetch('/api/wellness', {
        method: 'POST',
        body: apiFormData,
      })
      
      if (response.status === 401) {
        // Session expired or not authenticated
        setIsAuthenticated(false)
        toast.error("Authentication required. Please sign in again.")
        return
      }
      
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
      
      // Note: localStorage clearing is now handled at button click time
      // so we don't need to clear it again here
      
      toast.success(`${formData.catName}'s wellness plan generated successfully!`);
    } catch (error) {
      toast.error('Error generating wellness plan')
      console.error(error)
    } finally {
      setIsSubmitting(false)
      setIsGeneratingPlan(false)
    }
  }
  
  // Handle sending wellness plan to email
  const handleSendEmail = async () => {
    // Check authentication before sending email
    if (!isAuthenticated) {
      toast.error('Please sign in to send the wellness plan via email');
      return;
    }
    
    // Double-check authentication with the server
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsAuthenticated(false);
      toast.error('Your session has expired. Please sign in again to send emails.');
      return;
    }
    
    if (!userEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsEmailSending(true);
    
    try {
      const response = await fetch('/api/wellness/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          wellnessPlan,
          planId: wellnessPlanData?.id,
          catName: formData.catName,
        }),
      });
      
      if (response.status === 401) {
        // Handle authentication errors
        setIsAuthenticated(false);
        toast.error('Authentication required. Please sign in again to send emails.');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to send wellness plan');
      }
      
      const data = await response.json();
      toast.success(data.message || 'Wellness plan sent to your email');
    } catch (error) {
      toast.error('Error sending wellness plan to email');
      console.error(error);
    } finally {
      setIsEmailSending(false);
    }
  }
  
  // Handle sign in redirection
  const handleSignIn = () => {
    console.log('Saving form state before redirecting to sign in');
    
    // Always save current form state and step before redirecting
    // This ensures we have the data when we return from the auth process
    localStorage.setItem('catWellnessFormData', JSON.stringify(formData));
    localStorage.setItem('catWellnessFormStep', currentStep.toString());
    console.log(`Saved current step (${currentStep}) to localStorage before sign in`);
    
    // Redirect to sign in with a callback URL that includes a flag
    router.push(`/signin?callbackUrl=${encodeURIComponent('/wellness?fromAuth=true')}`)
  }
  
  // Handle starting over
  const handleStartOver = () => {
    setCurrentStep(1);
    setWellnessPlan(null);
    setWellnessPlanData(null);
    setIsPlanGenerated(false);
    // Clear localStorage data when starting over
    clearLocalStorage();
  }
  
  // Progress bar calculation
  const progress = ((currentStep - 1) / totalSteps) * 100
  
  // Generate and download PDF
  const handleDownloadPDF = async () => {
    if (!pdfContentRef.current || !wellnessPlan) return;
    
    setIsGeneratingPDF(true);
    toast.info("Preparing your beautiful wellness plan PDF...");
    
    try {
      // Create a new document directly with jsPDF
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
      });
      
      // Page dimensions
      const pageWidth = 210;  // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 15;      // Margins in mm
      const contentWidth = pageWidth - (margin * 2);
      
      // Colors
      const primaryColor = [99, 102, 241] as [number, number, number]; // Indigo
      const accentColor = [147, 51, 234] as [number, number, number];  // Purple
      const textColor = [51, 65, 85] as [number, number, number];      // Slate-700
      const subtitleColor = [71, 85, 105] as [number, number, number]; // Slate-600
      const bgColor = [248, 250, 252] as [number, number, number];     // Slate-50
      const boxBgColor = [241, 245, 249] as [number, number, number];  // Slate-100
      const headerBgColor = [224, 231, 255] as [number, number, number]; // Indigo-100
      
      // Function to create a cover page
      const createCoverPage = () => {
        // Set background
        pdf.setFillColor(...bgColor);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Add decorative top bar
        pdf.setFillColor(...primaryColor);
        pdf.rect(0, 0, pageWidth, 20, 'F');
        
        // Add paw prints decoration (top right)
        pdf.setDrawColor(...primaryColor);
        pdf.setLineWidth(0.5);
        // Draw some paw prints as simple circles
        for (let i = 0; i < 4; i++) {
          pdf.circle(pageWidth - 20 - (i * 15), 40 + (i * 10), 3, 'S');
          pdf.circle(pageWidth - 25 - (i * 15), 38 + (i * 10), 1.5, 'S');
          pdf.circle(pageWidth - 15 - (i * 15), 38 + (i * 10), 1.5, 'S');
        }
        
        // Add big title
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...primaryColor);
        pdf.setFontSize(28);
        pdf.text(`${formData.catName}'s`, pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });
        
        // Add subtitle
        pdf.setFontSize(32);
        pdf.setTextColor(...accentColor);
        pdf.text('Wellness & Behavior Plan', pageWidth / 2, pageHeight / 2, { align: 'center' });
        
        // Add horizontal line
        pdf.setDrawColor(...primaryColor);
        pdf.setLineWidth(1);
        pdf.line(margin + 20, pageHeight / 2 + 10, pageWidth - margin - 20, pageHeight / 2 + 10);
        
        // Add date
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(...subtitleColor);
        pdf.setFontSize(12);
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });
        
        // Add cat outline at the bottom
        pdf.setDrawColor(...primaryColor);
        pdf.setLineWidth(0.8);
        
        // Add cat SVG image instead of manually drawing
        const catY = pageHeight / 2 + 60;
        
        // Use JPG image instead of SVG since SVG doesn't work properly
        const catImagePath = '/cat.jpg'; // JPG is in the public folder root
        
        try {
          // Fixed height for the image
          const imageHeight = 60;
          // For cat.jpg, we'll use an aspect ratio of 4:3 (width:height)
          // This is a common aspect ratio for photos, and we'll adjust if needed
          const aspectRatio = 16/9;
          const imageWidth = imageHeight * aspectRatio;
          
          // Add the JPG image - parameters: path, format, x, y, width, height
          // Center the image horizontally by adjusting the x position based on the new width
          pdf.addImage(
            catImagePath, 
            'JPEG', 
            pageWidth/2 - (imageWidth/2), 
            catY - (imageHeight/2), 
            imageWidth, 
            imageHeight, 
            undefined, 
            'FAST'
          );
        } catch (error) {
          console.error('Failed to load image:', error);
          // Fallback to a basic shape if image fails to load
          pdf.setFillColor(...primaryColor);
          pdf.circle(pageWidth/2, catY, 20, 'F');
        }
        
        // Add CatHealth logo and copyright at the bottom
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...subtitleColor);
        pdf.setFontSize(10);
        pdf.text('CatHealth', pageWidth / 2, pageHeight - 30, { align: 'center' });
        pdf.setFontSize(8);
        pdf.text(`© ${new Date().getFullYear()} CatHealth - All rights reserved`, pageWidth / 2, pageHeight - 20, { align: 'center' });
      };
      
      // Function to add text with wrapping and paragraph handling
      const addWrappedText = (
        text: string, 
        x: number, 
        y: number, 
        maxWidth: number, 
        fontSize: number = 11, 
        fontStyle: string = 'normal', 
        color: [number, number, number] = textColor, 
        spacing: number = 1.2
      ): number => {
        if (!text?.trim()) return y;
        
        pdf.setFont('helvetica', fontStyle);
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        
        // Split text into paragraphs
        const paragraphs = text.split('\n\n');
        let currentY = y;
        
        for (let i = 0; i < paragraphs.length; i++) {
          const paragraph = paragraphs[i].trim();
          if (!paragraph) continue;
          
          // Split paragraph into lines that fit the width
          const lines = pdf.splitTextToSize(paragraph, maxWidth);
          
          // Process each line
          for (let j = 0; j < lines.length; j++) {
            const line = lines[j];
            
            // Add indentation and bullet styling for list items
            if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
              // Bullet point formatting
              pdf.text(line, x + 3, currentY);
              currentY += fontSize * 0.55 * spacing;
            } else if (/^\d+\.\s/.test(line.trim())) {
              // Numbered list formatting
              pdf.text(line, x + 3, currentY);
              currentY += fontSize * 0.55 * spacing;
            } else {
              // Normal text
              pdf.text(line, x, currentY);
              currentY += fontSize * 0.55 * spacing;
            }
          }
          
          // Add spacing between paragraphs
          if (i < paragraphs.length - 1) {
            currentY += fontSize * 0.8;
          }
        }
        
        return currentY;
      };
      
      // Function to add a beautiful section with a heading box
      const addSection = (
        title: string, 
        content: string, 
        x: number, 
        y: number, 
        maxWidth: number, 
        pageNum: number
      ): number => {
        if (!content?.trim()) return y;
        
        // Check if we need a page break - leave some space for the header and a few lines
        if (y > pageHeight - 70) {
          pdf.addPage();
          addPageHeader(pageNum + 1);
          y = 40; // Start below header
        }
        
        // Create a nice colored box for the section title
        pdf.setFillColor(...headerBgColor);
        pdf.roundedRect(x - 5, y - 6, maxWidth + 10, 14, 3, 3, 'F');
        
        // Add section title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(...primaryColor);
        pdf.text(title, x, y);
        
        // Add little paw icon before title (simple circle)
        pdf.setFillColor(...accentColor);
        pdf.circle(x - 10, y - 1, 2, 'F');
        
        // Add content with spacing
        const contentY = y + 15;
        const endY = addWrappedText(content, x, contentY, maxWidth, 11, 'normal', textColor, 1.2);
        
        return endY + 8; // Return position after content with spacing
      };
      
      // Function to add header to content pages
      const addPageHeader = (pageNum: number): void => {
        // Add top bar
        pdf.setFillColor(...primaryColor);
        pdf.rect(0, 0, pageWidth, 15, 'F');
        
        // Add cat name and page title
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.text(`${formData.catName}'s Wellness & Behavior Plan`, margin, 10);
        
        // Add page number on the right
        pdf.text(`Page ${pageNum}`, pageWidth - margin, 10, { align: 'right' });
      };
      
      // Function to add a nice footer to each page
      const addPageFooter = (pageNum: number, totalPages: number): void => {
        // Add footer bar
        pdf.setFillColor(...boxBgColor);
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        // Add disclaimer text
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.setTextColor(...subtitleColor);
        pdf.text('This wellness plan is provided for informational purposes only and does not replace professional veterinary advice.',
          pageWidth / 2, pageHeight - 8, { align: 'center' });
        
        // Add page number and copyright
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${pageNum} of ${totalPages}  •  © ${new Date().getFullYear()} CatHealth`, 
          pageWidth / 2, pageHeight - 3, { align: 'center' });
      };
      
      // Improved markdown parsing
      const extractPlainText = (markdown: string | null): string => {
        if (!markdown) return '';
        
        return markdown
          .replace(/#{1,6}\s+(.+?)(\n|$)/g, '$1\n') // Handle headings
          .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.+?)\*/g, '$1') // Remove italic
          .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Keep link text
          .replace(/>\s+(.+?)(\n|$)/g, '$1\n') // Remove blockquote markers
          .replace(/^\s*[-*+]\s+(.+?)(\n|$)/gm, '• $1\n') // Better bullet list conversion
          .replace(/^\s*(\d+)\.\s+(.+?)(\n|$)/gm, '$1. $2\n') // Keep numbered lists
          .replace(/\n{3,}/g, '\n\n') // Normalize excessive newlines
          .trim();
      };
      
      // Extract sections with improved patterns
      const extractSection = (
        markdown: string, 
        sectionName: string, 
        nextSectionName?: string
      ): string => {
        // Create case-insensitive pattern
        const pattern = nextSectionName 
          ? new RegExp(`## ${sectionName}([\\s\\S]*?)(?=## ${nextSectionName}|$)`, 'i')
          : new RegExp(`## ${sectionName}([\\s\\S]*)$`, 'i');
        
        const match = markdown.match(pattern);
        return match ? match[1].trim() : '';
      };
      
      // Extract all sections 
      const overview = extractSection(wellnessPlan || "", "Greeting & Cat Overview", "Health Recommendations");
      const healthText = extractSection(wellnessPlan || "", "Health Recommendations", "Behavior Training");
      const behaviorText = extractSection(wellnessPlan || "", "Behavior Training", "Enrichment Plan");
      const enrichmentText = extractSection(wellnessPlan || "", "Enrichment Plan", "Follow-up Schedule");
      const followUpText = extractSection(wellnessPlan || "", "Follow-up Schedule");
      
      // Create the cover page
      createCoverPage();
      
      // Add content pages
      pdf.addPage();
      addPageHeader(1);
      
      // Start position for content
      let yPosition = 30;
      let pageNum = 1;
      
      // Add introduction/overview with a nice box
      if (overview) {
        pdf.setFillColor(...boxBgColor);
        pdf.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, 'F');
        
        yPosition = addWrappedText(
          extractPlainText(overview),
          margin + 5, 
          yPosition + 8, 
          contentWidth - 10,
          11,
          'normal',
          textColor,
          1.2
        );
        
        // Add some space after the introduction
        yPosition += 15;
      }
      
      // Add main sections with automatic pagination
      yPosition = addSection('Health Recommendations', extractPlainText(healthText), margin, yPosition, contentWidth, pageNum);
      
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        pageNum++;
        addPageHeader(pageNum);
        yPosition = 30;
      }
      
      yPosition = addSection('Behavior Training & Advice', extractPlainText(behaviorText), margin, yPosition, contentWidth, pageNum);
      
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        pageNum++;
        addPageHeader(pageNum);
        yPosition = 30;
      }
      
      yPosition = addSection('Enrichment & Environment', extractPlainText(enrichmentText), margin, yPosition, contentWidth, pageNum);
      
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        pageNum++;
        addPageHeader(pageNum);
        yPosition = 30;
      }
      
      yPosition = addSection('Follow-up Schedule', extractPlainText(followUpText), margin, yPosition, contentWidth, pageNum);
      
      // Add a concluding remark if there's space
      if (yPosition < pageHeight - 70) {
        yPosition += 20;
        
        // Add a nice box with concluding message
        pdf.setFillColor(...boxBgColor);
        pdf.roundedRect(margin, yPosition, contentWidth, 35, 3, 3, 'F');
        
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(...primaryColor);
        pdf.setFontSize(12);
        pdf.text(`We wish ${formData.catName} a happy and healthy life!`, 
          pageWidth / 2, yPosition + 15, { align: 'center' });
        
        // Add a small cat paw print as decoration
        pdf.setFillColor(...accentColor);
        pdf.circle(pageWidth / 2, yPosition + 25, 3, 'F');
        pdf.circle(pageWidth / 2 - 5, yPosition + 23, 1.5, 'F');
        pdf.circle(pageWidth / 2 + 5, yPosition + 23, 1.5, 'F');
        pdf.circle(pageWidth / 2 - 3, yPosition + 30, 1.5, 'F');
        pdf.circle(pageWidth / 2 + 3, yPosition + 30, 1.5, 'F');
      }
      
      // Add footers to all pages (except cover)
      const totalPages = pdf.getNumberOfPages();
      for (let i = 2; i <= totalPages; i++) {
        pdf.setPage(i);
        addPageFooter(i - 1, totalPages - 1);
      }
      
      // Save the PDF
      pdf.save(`${formData.catName}_Wellness_Plan.pdf`);
      toast.success("Your beautifully designed PDF has been downloaded!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  // Form rendering based on current step
  const renderForm = () => {
    // Type currentStep as number to avoid TypeScript errors in case statements
    const step = currentStep as number;
    
    switch (step) {
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
                      src="/kitty.svg"
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
                      src="/dry.svg"
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
                      src="/wet.svg"
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
                      src="/playfull.svg"
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
                  { value: 'Has scratching post/tree', image: '/tree.svg' },
                  { value: 'Has puzzle feeders or treat toys', image: '/busy.svg' },
                  { value: 'Has hideaways (boxes/tunnels)', image: '/boxcat.svg' },
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
                  { value: 'Improve behavior issue', image: '/angry.svg', label: 'Improve Behavior', gradientFrom: 'from-red-50', gradientTo: 'to-orange-50', textFrom: 'from-red-700', textTo: 'to-orange-700' },
                  { value: 'Help my cat exercise more', image: '/lazy.svg', label: 'More Exercise', gradientFrom: 'from-blue-50', gradientTo: 'to-indigo-50', textFrom: 'from-blue-700', textTo: 'to-indigo-700' },
                  { value: 'Nutrition or weight management', image: '/fatcat.svg', label: 'Weight Management', gradientFrom: 'from-green-50', gradientTo: 'to-teal-50', textFrom: 'from-green-700', textTo: 'to-teal-700' },
                  { value: 'General wellness & happiness', image: '/playfull.svg', label: 'General Wellness', gradientFrom: 'from-purple-50', gradientTo: 'to-indigo-50', textFrom: 'from-purple-700', textTo: 'to-indigo-700' },
                  { value: 'Reduce anxiety/stress', image: '/scared.svg', label: 'Reduce Anxiety', gradientFrom: 'from-amber-50', gradientTo: 'to-yellow-50', textFrom: 'from-amber-700', textTo: 'to-yellow-700' },
                  { value: 'Other', image: '/cat.svg', label: 'Other', gradientFrom: 'from-gray-50', gradientTo: 'to-slate-50', textFrom: 'from-gray-700', textTo: 'to-slate-700' }
                ].map((option, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                      formData.primaryGoal === option.value ? 'border-2 border-blue-500 ring-2 ring-blue-200' : 'border border-gray-200'
                    }`}
                    onClick={() => handleCardSelection('primaryGoal', option.value)}
                  >
                    <CardHeader className={`pb-2 pt-2 bg-gradient-to-r ${option.gradientFrom} ${option.gradientTo}`}>
                      <CardTitle className="text-lg flex justify-center">
                        <span className={`bg-gradient-to-r ${option.textFrom} ${option.textTo} bg-clip-text text-transparent`}>
                          {option.label}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 relative mb-2">
                        <Image
                          src={option.image}
                          alt={option.label}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {isAuthenticated ? (
              <div className="mt-10 text-center">
                <Button
                  type="submit"
                  disabled={isGeneratingPlan}
                  className="w-full max-w-md mx-auto py-6 text-lg font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  onClick={(e) => {
                    e.preventDefault();
                    
                    // Clear localStorage immediately when the button is clicked
                    console.log('Generate button clicked, clearing localStorage immediately');
                    clearLocalStorage();
                    
                    // Continue with form submission
                    handleSubmit(e);
                  }}
                >
                  {isGeneratingPlan ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Your Plan...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Generate Wellness Plan
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                      </svg>
                    </span>
                  )}
                </Button>
              </div>
            ) : (
              <div className="mt-10 p-6 bg-blue-50 rounded-xl border border-blue-100 shadow-md">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 relative flex-shrink-0">
                    <Image
                      src="/busy.svg"
                      alt="Sign In Required"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-700 text-lg mb-2">
                      Sign In Required
                    </h3>
                    <p className="text-blue-600 mb-4">
                      To generate your personalized wellness plan, please sign in. This helps us save your plan, track progress, and provide future updates.
                    </p>
                    <Button 
                      onClick={() => {
                        // Ensure we're saving step 5 to localStorage before redirecting
                        localStorage.setItem('catWellnessFormData', JSON.stringify(formData));
                        localStorage.setItem('catWellnessFormStep', currentStep.toString()); // Explicitly setting to step 5
                        console.log('Saved step 5 to localStorage before sign in');
                        
                        // Call the regular sign in handler
                        handleSignIn();
                      }}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      Sign In to Continue
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {!isAuthenticated && (
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Your responses will be saved locally until you sign in.</p>
              </div>
            )}
          </div>
        )
      case 6:
        // If user is no longer authenticated, redirect to step 5 and require sign-in
        if (!isAuthenticated) {
          // Reset to final step of form
          setCurrentStep(5);
          setWellnessPlan(null);
          setWellnessPlanData(null);
          setIsPlanGenerated(false);
          
          // Show error message
          toast.error("Authentication required. Please sign in to generate and view your wellness plan.");
          
          // Return step 5 content
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center mb-6">Authentication Required</h2>
              
              <div className="mt-4 p-6 bg-blue-50 rounded-xl border border-blue-100 shadow-md">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 relative flex-shrink-0">
                    <Image
                      src="/busy.svg"
                      alt="Sign In Required"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-700 text-lg mb-2">
                      Sign In Required
                    </h3>
                    <p className="text-blue-600 mb-4">
                      Your session has expired. To generate your personalized wellness plan, please sign in again.
                    </p>
                    <Button 
                      onClick={() => {
                        // Ensure we're saving step 5 to localStorage before redirecting
                        localStorage.setItem('catWellnessFormData', JSON.stringify(formData));
                        localStorage.setItem('catWellnessFormStep', '5'); // Explicitly setting to step 5
                        console.log('Session expired - saved step 5 to localStorage before sign in');
                        
                        // Call the regular sign in handler
                        handleSignIn();
                      }}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      Sign In to Continue
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        // Continue with regular results page if authenticated
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
                  
                  <TabsContent value="plan" className="p-6 relative overflow-hidden">
                    {/* Decorative background elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full opacity-60 no-print"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-full opacity-60 no-print"></div>
                    <div className="absolute top-1/2 -right-6 w-24 h-24 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-full opacity-50 no-print"></div>
                    <div className="absolute bottom-20 left-10 w-16 h-16 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-full opacity-40 no-print"></div>
                    
                    {/* Download PDF button */}
                    {wellnessPlan && (
                      <div className="absolute top-3 right-3 z-20 no-print">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 border-indigo-300 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 hover:text-indigo-800 text-indigo-700 shadow-md transition-all duration-300"
                          onClick={handleDownloadPDF}
                          disabled={isGeneratingPDF}
                        >
                          {isGeneratingPDF ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating Beautiful PDF...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-700">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              Download Beautiful PDF
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {wellnessPlan ? (
                      <div className="prose prose-sm md:prose-base max-w-none relative z-10 print-content" ref={pdfContentRef}>
                        <div className="absolute top-0 right-0 w-24 h-24 text-indigo-100 no-print">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" strokeWidth="0">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.3"></path>
                            <path d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" opacity="0.5"></path>
                            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" opacity="0.7"></path>
                            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" opacity="0.9"></path>
                            <circle cx="12" cy="12" r="1.5" opacity="1"></circle>
                          </svg>
                        </div>
                      
                        <ReactMarkdown 
                          components={{
                            h1: ({ children }) => (
                              <>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 bg-clip-text text-transparent pb-2 border-b border-blue-100 mb-4">
                                  {children}
                                </h1>
                                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded mb-6"></div>
                              </>
                            ),
                            h2: ({ children }) => (
                              <div className="mt-8 mb-4">
                                <div className="flex items-center mb-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white mr-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14"></path>
                                      <path d="M12 5v14"></path>
                                    </svg>
                                  </div>
                                  <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {children}
                                  </h2>
                                </div>
                                <div className="w-full h-px bg-gradient-to-r from-indigo-100 to-purple-100"></div>
                              </div>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-semibold text-indigo-600 mt-5 mb-2 flex items-center">
                                <div className="w-2 h-6 bg-indigo-400 rounded mr-2"></div>
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-base font-semibold text-blue-500 mt-4 mb-2 flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                                {children}
                              </h4>
                            ),
                            p: ({ children }) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                            ul: ({ children }) => (
                              <div className="bg-blue-50/50 rounded-lg p-4 my-4 border border-blue-100">
                                <ul className="pl-2 space-y-2">{children}</ul>
                              </div>
                            ),
                            ol: ({ children }) => (
                              <div className="bg-indigo-50/50 rounded-lg p-4 my-4 border border-indigo-100">
                                <ol className="pl-8 space-y-2">{children}</ol>
                              </div>
                            ),
                            li: ({ children }) => (
                              <li className="text-gray-700 flex items-start">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs mt-1 mr-2 flex-shrink-0">✓</div>
                                <span>{children}</span>
                              </li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold text-indigo-900 bg-indigo-50 px-1 rounded">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => <em className="text-purple-700 italic">{children}</em>,
                            blockquote: ({ children }) => (
                              <div className="my-6">
                                <blockquote className="border-l-4 border-indigo-300 pl-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-r-lg text-gray-700 italic relative">
                                  <div className="absolute top-0 left-0 text-indigo-200 transform -translate-y-1/2 -translate-x-1/2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                    </svg>
                                  </div>
                                  {children}
                                </blockquote>
                              </div>
                            ),
                            hr: () => (
                              <div className="flex items-center justify-center my-6">
                                <div className="w-1/3 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>
                                <div className="w-2 h-2 rounded-full bg-indigo-400 mx-2"></div>
                                <div className="w-1/3 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent"></div>
                              </div>
                            ),
                            a: ({ href, children }) => (
                              <a 
                                href={href} 
                                className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 hover:decoration-blue-500 transition-all"
                              >
                                {children}
                              </a>
                            ),
                            img: ({ src, alt }) => (
                              <div className="my-6 rounded-lg overflow-hidden shadow-md">
                                <img src={src || ''} alt={alt || ''} className="w-full h-auto" />
                              </div>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-hidden rounded-lg shadow-sm border border-indigo-100 my-6">
                                <table className="min-w-full divide-y divide-indigo-200">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-indigo-50">{children}</thead>,
                            tbody: ({ children }) => <tbody className="divide-y divide-indigo-100 bg-white">{children}</tbody>,
                            tr: ({ children }) => <tr>{children}</tr>,
                            th: ({ children }) => <th className="px-4 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">{children}</th>,
                            td: ({ children }) => <td className="px-4 py-3 text-sm">{children}</td>
                          }}
                        >
                          {wellnessPlan}
                        </ReactMarkdown>
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
                onClick={handleStartOver}
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
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print-content,
          .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2rem;
          }
          
          .no-print {
            display: none !important;
          }
          
          @page {
            size: portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
      
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
                    ) : null /* Removed the submit button here since we added it directly in step 5 */}
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

      {/* Add a small debugging indicator at the bottom */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="text-xs text-gray-400 mt-2 text-center">
          <div>LocalStorage: {localStorage.getItem('catWellnessFormData') ? 'Data exists' : 'No data'}</div>
          <div>Current Step: {currentStep}, Stored Step: {localStorage.getItem('catWellnessFormStep') || 'None'}</div>
          <div>Auth Status: {isAuthenticated ? `Logged In as ${userEmail}` : 'Not Logged In'}</div>
          <div>Plan Generated: {isPlanGenerated ? 'Yes' : 'No'}</div>
          <div>From Auth Flow: {searchParams.get('fromAuth') === 'true' ? 'Yes' : 'No'}</div>
          <button 
            onClick={async () => {
              const { data } = await supabase.auth.getSession();
              console.log('Current auth session:', data.session);
            }}
            className="text-xs text-blue-400 underline"
          >
            Check Auth State
          </button>
        </div>
      )}
    </div>
  )
} 
