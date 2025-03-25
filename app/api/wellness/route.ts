import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Type definitions for wellness plan data
type WellnessPlanData = {
  healthRecommendations: {
    nutrition: string;
    exercise: string;
    preventiveCare: string;
    environment: string;
  };
  behaviorTraining: Record<string, string>;
  enrichmentPlan: {
    play: string;
    toys: string;
    environment: string;
    social: string;
    rest: string;
  };
  followUpSchedule: Array<{week: number, tasks: string[]}>;
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication first
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();
    
    // If not authenticated, return error
    if (!session || !session.user) {
      console.warn('Authentication check failed - user attempted to generate a wellness plan without authentication');
      return NextResponse.json(
        { error: 'Authentication required to generate a wellness plan' },
        { status: 401 }
      );
    }
    
    console.log(`Authenticated user ${session.user.email} generating wellness plan`);
    
    // Parse the form data
    const formData = await request.formData();
    
    // Basic information
    const catName = formData.get('catName') as string;
    const catAge = formData.get('catAge') as string;
    const catBreed = formData.get('catBreed') as string;
    const catSex = formData.get('catSex') as string;
    const catNeutered = formData.get('catNeutered') as string;
    
    // Health & Lifestyle
    const catWeight = formData.get('catWeight') as string;
    const catDiet = formData.get('catDiet') as string;
    const catFeeding = formData.get('catFeeding') as string;
    const catActivity = formData.get('catActivity') as string;
    const catEnvironment = formData.get('catEnvironment') as string;
    
    // Behavior & Training
    const behaviorIssues = formData.getAll('behaviorIssues') as string[];
    const behaviorDetails = formData.get('behaviorDetails') as string;
    const catTraining = formData.get('catTraining') as string;
    
    // Enrichment & Routine
    const playTime = formData.get('playTime') as string;
    const favoriteActivities = formData.getAll('favoriteActivities') as string[];
    const homeEnrichment = formData.getAll('homeEnrichment') as string[];
    const otherPets = formData.get('otherPets') as string;
    
    // Owner's goals
    const primaryGoal = formData.get('primaryGoal') as string;
    const userEmail = formData.get('userEmail') as string || session.user.email;
    
    // Validation
    if (!catName) {
      return NextResponse.json(
        { error: 'Cat name is required' },
        { status: 400 }
      );
    }

    // Prepare the system message for OpenAI
    const systemPrompt = `You are a professional feline behavior and wellness expert that creates personalized wellness and behavior plans for cats based on owner-provided information.
    
    Your task is to:
    1. Analyze the cat's profile, behavior issues, enrichment details, and owner's goals.
    2. Create a comprehensive wellness plan with the following sections:
       - Greeting & Cat Overview (a friendly intro with a summary of the cat's profile and main goals)
       - Health & Wellness Recommendations (nutrition, exercise, preventive care, grooming)
       - Behavior Training & Advice (address each behavior issue with positive, actionable tips)
       - Enrichment & Environment (how to keep the cat mentally stimulated and happy)
       - Follow-Up & Maintenance (timeline or checklist for implementing changes)
    
    Format your response in markdown with clear sections. Be informative, supportive, and personalized.
    Address the cat by name throughout the plan. Make specific recommendations based on the cat's age, breed, behavior issues, etc.
    Your tone should be friendly yet professional, as if speaking to a fellow cat lover.`;

    // Prepare the user message with all the cat data
    const userPrompt = `
    I need a wellness and behavior plan for my cat with the following details:
    
    **Basic Information:**
    - Name: ${catName}
    - Age: ${catAge || 'Not specified'}
    - Breed: ${catBreed || 'Not specified'}
    - Sex: ${catSex || 'Not specified'} ${catNeutered ? `(${catNeutered})` : ''}
    
    **Health & Lifestyle:**
    - Weight/Body Condition: ${catWeight || 'Not specified'}
    - Diet: ${catDiet || 'Not specified'}
    - Feeding Schedule: ${catFeeding || 'Not specified'}
    - Activity Level: ${catActivity || 'Not specified'}
    - Living Environment: ${catEnvironment || 'Not specified'}
    
    **Behavior Issues:** ${behaviorIssues.length > 0 ? behaviorIssues.join(', ') : 'None mentioned'}
    ${behaviorDetails ? `**Behavior Details:** ${behaviorDetails}` : ''}
    
    **Training:** ${catTraining || 'Not specified'}
    
    **Enrichment & Routine:**
    - Daily Playtime: ${playTime || 'Not specified'}
    - Favorite Activities: ${favoriteActivities.length > 0 ? favoriteActivities.join(', ') : 'Not specified'}
    - Home Enrichment: ${homeEnrichment.length > 0 ? homeEnrichment.join(', ') : 'Not specified'}
    - Other Pets: ${otherPets || 'Not specified'}
    
    **Primary Goal:** ${primaryGoal || 'General wellness and happiness'}
    
    Please create a detailed, personalized wellness and behavior plan that addresses these specific details and provides actionable recommendations.`;
    
    // Make the API call to OpenAI for the wellness plan
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 2000,
    });

    const wellnessPlanContent = response.choices[0].message.content || '';

    // Now, generate structured data for the wellness plan
    const visualizationPrompt = `
    Based on the following cat wellness and behavior plan, generate structured data in JSON format:
    
    ${wellnessPlanContent}
    
    Please provide the following structures:
    1. healthRecommendations with subsections for nutrition, exercise, preventiveCare, and environment
    2. behaviorTraining with a key for each behavior issue and value for the recommendation
    3. enrichmentPlan with subsections for play, toys, environment, social, and rest
    4. followUpSchedule with week numbers and tasks for each week (3-4 weeks)
    
    Return ONLY valid JSON in this exact format without any explanation:
    {
      "healthRecommendations": {
        "nutrition": "string",
        "exercise": "string",
        "preventiveCare": "string",
        "environment": "string"
      },
      "behaviorTraining": {
        "issue1": "string",
        "issue2": "string",
        ...
      },
      "enrichmentPlan": {
        "play": "string",
        "toys": "string",
        "environment": "string",
        "social": "string",
        "rest": "string"
      },
      "followUpSchedule": [
        { "week": number, "tasks": ["string", "string", ...] },
        ...
      ]
    }`;

    // Get structured data
    const structuredDataResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates JSON data based on wellness plans.',
        },
        {
          role: 'user',
          content: visualizationPrompt,
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    // Parse the structured data
    let wellnessPlanData: WellnessPlanData;
    try {
      wellnessPlanData = JSON.parse(structuredDataResponse.choices[0].message.content || '{}');
    } catch (e) {
      // Fallback to default data if parsing fails
      wellnessPlanData = {
        healthRecommendations: {
          nutrition: "Feed a balanced, high-quality cat food appropriate for your cat's age and weight.",
          exercise: "Engage in daily play sessions to keep your cat active and healthy.",
          preventiveCare: "Schedule regular veterinary check-ups and keep vaccinations current.",
          environment: "Provide a clean, safe environment with appropriate scratching surfaces."
        },
        behaviorTraining: {
          "general": "Use positive reinforcement to encourage good behavior."
        },
        enrichmentPlan: {
          play: "Regular interactive play sessions with wand toys or laser pointers.",
          toys: "Rotate toys weekly to maintain interest.",
          environment: "Provide climbing spaces, scratching posts, and hiding spots.",
          social: "Spend quality time with your cat daily for bonding.",
          rest: "Ensure quiet spaces for undisturbed rest and relaxation."
        },
        followUpSchedule: [
          { week: 1, tasks: ["Implement new feeding schedule", "Introduce new toys"] },
          { week: 2, tasks: ["Increase play time", "Begin training exercises"] },
          { week: 3, tasks: ["Evaluate progress", "Adjust plan as needed"] }
        ]
      };
    }

    // If user is authenticated, save the plan to their account
    if (session && session.user && userEmail) {
      // Check if the user has a plan already
      const { data: existingPlans } = await supabase
        .from('wellness_plans')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('cat_name', catName);
        
      // Save to Supabase - either insert new or update existing
      if (existingPlans && existingPlans.length > 0) {
        await supabase
          .from('wellness_plans')
          .update({
            cat_data: {
              name: catName,
              age: catAge,
              breed: catBreed,
              sex: catSex,
              neutered: catNeutered,
              weight: catWeight,
              diet: catDiet,
              feeding: catFeeding,
              activity: catActivity,
              environment: catEnvironment,
              behaviorIssues: behaviorIssues,
              behaviorDetails: behaviorDetails,
              training: catTraining,
              playTime: playTime,
              favoriteActivities: favoriteActivities,
              homeEnrichment: homeEnrichment,
              otherPets: otherPets,
              primaryGoal: primaryGoal
            },
            plan_content: wellnessPlanContent,
            plan_data: wellnessPlanData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPlans[0].id);
      } else {
        await supabase
          .from('wellness_plans')
          .insert({
            user_id: session.user.id,
            user_email: userEmail || session.user.email,
            cat_name: catName,
            cat_data: {
              name: catName,
              age: catAge,
              breed: catBreed,
              sex: catSex,
              neutered: catNeutered,
              weight: catWeight,
              diet: catDiet,
              feeding: catFeeding,
              activity: catActivity,
              environment: catEnvironment,
              behaviorIssues: behaviorIssues,
              behaviorDetails: behaviorDetails,
              training: catTraining,
              playTime: playTime,
              favoriteActivities: favoriteActivities,
              homeEnrichment: homeEnrichment,
              otherPets: otherPets,
              primaryGoal: primaryGoal
            },
            plan_content: wellnessPlanContent,
            plan_data: wellnessPlanData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    }

    // Return both the wellness plan text and structured data
    return NextResponse.json({
      wellnessPlan: wellnessPlanContent,
      wellnessPlanData,
      isAuthenticated: !!session
    });
  } catch (error) {
    console.error('Error processing wellness plan:', error);
    return NextResponse.json(
      { error: 'Failed to process the wellness plan' },
      { status: 500 }
    );
  }
} 