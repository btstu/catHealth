import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
// In production, store this in an environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Type definitions for visualization data
type DiagnosisData = {
  possibleCauses: Array<{name: string, probability: number}>;
  recommendedActions: Array<{action: string, urgency: number}>;
  severityScore: number;
};

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const petName = formData.get('petName') as string;
    const petAge = formData.get('petAge') as string;
    const symptoms = formData.get('symptoms') as string;

    // Validation
    if (!image && !symptoms.trim()) {
      return NextResponse.json(
        { error: 'Either an image or symptoms description is required' },
        { status: 400 }
      );
    }

    // Prepare the message for OpenAI
    const systemPrompt = `You are a veterinary assistant AI that helps identify potential health issues in cats based on ${image ? 'images and' : ''} symptoms described.
    
    Your task is to:
    1. ${image ? 'Analyze the image of the cat\'s health concern' : 'Consider the symptoms described by the owner'}
    2. ${image ? 'Consider the symptoms described by the owner' : 'Analyze the symptoms in detail'}
    3. Provide a preliminary assessment of what the issue might be
    4. Suggest potential causes
    5. Recommend appropriate next steps (when to see a vet, home care tips, etc.)
    6. Include any warning signs to watch for
    Mention the name of the cat in the response
    
    Format your response in markdown with clear sections - be helpful and concise in your response
    
    Be professional, compassionate, and helpful without being alarmist.`;

    const userPrompt = `I'm concerned about my cat ${petName}${petAge ? ` who is ${petAge} old` : ''}.
    
    Symptoms: ${symptoms}
    
    ${image ? "I've attached a photo of the affected area. " : ""}Can you help identify what might be wrong and what I should do?`;

    // Make the API call to OpenAI for the diagnosis
    let diagnosisContent: string;
    
    if (image) {
      // Convert the file to base64
      const imageBuffer = await image.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      const dataURI = `data:${image.type};base64,${imageBase64}`;

      // Call with image
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: dataURI,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      diagnosisContent = response.choices[0].message.content || '';
    } else {
      // Call without image
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
        max_tokens: 1000,
      });

      diagnosisContent = response.choices[0].message.content || '';
    }

    // Now, generate visualization data based on the diagnosis
    const visualizationPrompt = `
    Based on the following cat health diagnosis, generate visualization data in JSON format:
    
    ${diagnosisContent}
    
    Please provide:
    1. A severity score between 0.1 and 0.9
    2. A list of 3-5 possible causes with probability scores between 0.1 and 0.9
    3. A list of 3-4 recommended actions with urgency scores between 0.1 and 0.9
    
    The severity score should reflect how serious the condition is.
    The probability scores should reflect how likely each cause is.
    The urgency scores should reflect how urgent each action is.
    
    Return ONLY valid JSON in this exact format without any explanation:
    {
      "severityScore": number,
      "possibleCauses": [
        { "name": "string", "probability": number },
        ...
      ],
      "recommendedActions": [
        { "action": "string", "urgency": number },
        ...
      ]
    }`;

    // Get visualization data
    const visualizationResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates JSON data for visualizations based on medical diagnoses.',
        },
        {
          role: 'user',
          content: visualizationPrompt,
        },
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    // Parse the visualization data
    let diagnosisData: DiagnosisData;
    try {
      diagnosisData = JSON.parse(visualizationResponse.choices[0].message.content || '{}');
    } catch (e) {
      // Fallback to default data if parsing fails
      diagnosisData = {
        severityScore: 0.5,
        possibleCauses: [
          { name: "Unknown Cause", probability: 0.5 }
        ],
        recommendedActions: [
          { action: "Consult Veterinarian", urgency: 0.7 }
        ]
      };
    }

    // Return both the diagnosis text and visualization data
    return NextResponse.json({
      diagnosis: diagnosisContent,
      diagnosisData
    });
  } catch (error) {
    console.error('Error processing diagnosis:', error);
    return NextResponse.json(
      { error: 'Failed to process the diagnosis' },
      { status: 500 }
    );
  }
} 