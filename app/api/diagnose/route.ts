import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
// In production, store this in an environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const petName = formData.get('petName') as string;
    const petAge = formData.get('petAge') as string;
    const symptoms = formData.get('symptoms') as string;

    // Validation
    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Convert the file to base64
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const dataURI = `data:${image.type};base64,${imageBase64}`;

    // Prepare the message for OpenAI
    const systemPrompt = `You are a veterinary assistant AI that helps identify potential health issues in cats based on images and symptoms described.
    
    Your task is to:
    1. Analyze the image of the cat's health concern
    2. Consider the symptoms described by the owner
    3. Provide a preliminary assessment of what the issue might be
    4. Suggest potential causes
    5. Recommend appropriate next steps (when to see a vet, home care tips, etc.)
    6. Include any warning signs to watch for
    
    Format your response in markdown with clear sections.
    
    IMPORTANT: Always include a disclaimer that this is not a substitute for professional veterinary care.
    Be professional, compassionate, and helpful without being alarmist.`;

    const userPrompt = `I'm concerned about my cat ${petName}${petAge ? ` who is ${petAge} old` : ''}.
    
    Symptoms: ${symptoms}
    
    I've attached a photo of the affected area. Can you help identify what might be wrong and what I should do?`;

    // Make the API call to OpenAI
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

    // Return the response
    return NextResponse.json({
      diagnosis: response.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error processing diagnosis:', error);
    return NextResponse.json(
      { error: 'Failed to process the diagnosis' },
      { status: 500 }
    );
  }
} 