import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userEmail, planId, wellnessPlan } = body;
    
    if (!userEmail || !wellnessPlan) {
      return NextResponse.json(
        { error: 'Email and wellness plan content are required' },
        { status: 400 }
      );
    }

    // Get the user session
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    // In a real application, you would integrate with an email service here
    // For example, using SendGrid, Mailgun, AWS SES, etc.
    // For demonstration purposes, we'll just pretend we sent the email
    
    // If authenticated, save this email to the user's record
    if (session && session.user) {
      if (planId) {
        // Update existing plan with email sent status
        await supabase
          .from('wellness_plans')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            user_email: userEmail
          })
          .eq('id', planId)
          .eq('user_id', session.user.id);
      } else {
        // Just update the user's email preference
        // This could be in a user_preferences table in a real app
        console.log('Would update user email preference to:', userEmail);
      }
    }
    
    // In a real application, this is where you would send the actual email
    console.log(`Email would be sent to ${userEmail} with the wellness plan`);
    
    return NextResponse.json({
      success: true,
      message: `Wellness plan has been sent to ${userEmail}`,
    });
  } catch (error) {
    console.error('Error sending wellness plan email:', error);
    return NextResponse.json(
      { error: 'Failed to send wellness plan email' },
      { status: 500 }
    );
  }
} 