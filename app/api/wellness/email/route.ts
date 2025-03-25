import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userEmail, planId, wellnessPlan, catName } = body;
    
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
    
    // Check authentication - only authenticated users can send emails
    if (!session || !session.user) {
      console.warn('Authentication check failed - user attempted to send a wellness plan email without authentication');
      return NextResponse.json(
        { error: 'Authentication required to send wellness plan emails' },
        { status: 401 }
      );
    }
    
    console.log(`Authenticated user ${session.user.email} sending wellness plan email to ${userEmail}`);
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    // Strip HTML tags for plain text version
    const plainText = wellnessPlan.replace(/<[^>]*>?/gm, '');
    
    // Send email using Resend
    const petName = catName || 'Your Cat';
    
    const { data, error } = await resend.emails.send({
      from: 'CatHealth <cathealth@resend.dev>',
      to: userEmail,
      subject: `${petName}'s Wellness Plan from CatHealth`,
      text: `Here is ${petName}'s wellness plan:\n\n${plainText}\n\nThank you for using CatHealth!`,
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${petName}'s Wellness Plan</title>
      </head>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; color: #374151;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f9fafb">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(to right, #4f46e5, #6366f1); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${petName}'s Wellness Plan</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <div>${wellnessPlan}</div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f3f4f6; padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">Thank you for using CatHealth!</p>
                    <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} CatHealth. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`,
    });
    
    if (error) {
      console.error('Email sending error:', error);
      return NextResponse.json(
        { error: 'Failed to send wellness plan email' },
        { status: 500 }
      );
    }
    
    // If authenticated, update the database
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
      }
    }
    
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