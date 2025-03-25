# Email Templates Documentation

This document provides information about the email templates used in CatHealth for authentication and wellness plan sharing. Proper HTML email templates are essential for improved deliverability and reducing the chance of emails being marked as spam.

## Email Deliverability Best Practices

Our email templates follow these best practices:

1. **Complete HTML Structure**: All emails include proper `<!DOCTYPE html>`, `<html>`, `<head>`, and `<body>` tags
2. **Responsive Design**: Table-based layouts ensure compatibility across email clients
3. **Mobile Optimization**: Meta viewport tag and responsive styling
4. **Plain Text Alternatives**: All HTML emails include plain text alternatives
5. **Professional Design**: Branded headers, clear content structure, and appropriate footers
6. **Clear Call-to-Action**: Prominent buttons with ample padding for mobile devices
7. **Brand Consistency**: Consistent color scheme and styling across all emails

## Authentication Email Templates

CatHealth uses Supabase for authentication, which requires setting up email templates through the Supabase dashboard. The templates are stored in `utils/email-templates.ts` for reference.

### Updating Supabase Email Templates

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to Authentication → Email Templates
3. For each email type, select the template and update the HTML content with our templates
4. Save your changes

### Available Authentication Templates

1. **Sign Up Email**: Used when a new user registers and needs to confirm their email
   - Template Variable: `SIGNUP_EMAIL_TEMPLATE`
   - Supabase Template Type: "Confirm Signup"

2. **Magic Link Email**: Used for passwordless authentication
   - Template Variable: `MAGIC_LINK_EMAIL_TEMPLATE`
   - Supabase Template Type: "Magic Link"

3. **Password Reset Email**: Used when a user requests a password reset
   - Template Variable: `PASSWORD_RESET_EMAIL_TEMPLATE`
   - Supabase Template Type: "Reset Password"

## Wellness Plan Email Template

CatHealth allows users to share wellness plans via email. This functionality uses the Resend API and is implemented in `app/api/wellness/email/route.ts`.

### Key Features of the Wellness Plan Email

1. **Dynamic Content**: The email displays the cat's name and personalized wellness plan
2. **Professional Layout**: Header, content area, and footer with consistent branding
3. **Responsive Design**: Works well on mobile and desktop email clients
4. **Plain Text Alternative**: Automatically generated from the HTML content

### Testing Email Deliverability

To test email deliverability:

1. Use [Mail Tester](https://www.mail-tester.com/) to check your email's spam score
2. Check emails on multiple clients (Gmail, Outlook, Apple Mail, etc.)
3. Verify that HTML renders correctly across devices
4. Confirm that links are working properly

## Troubleshooting Email Issues

If emails are still being marked as spam:

1. **Check SPF and DKIM Records**: Ensure your DNS records are properly configured
2. **Review Email Content**: Avoid spam trigger words and excessive use of exclamation points
3. **Check Image-to-Text Ratio**: Keep a balanced ratio of images to text
4. **Verify Sender Reputation**: Use tools like [Sender Score](https://senderscore.org/) to check your domain reputation
5. **Authentication Headers**: Ensure proper DKIM, SPF, and DMARC implementation (handled by Resend)

## Modifying Email Templates

When updating email templates:

1. Always maintain the proper HTML structure
2. Test across multiple email clients before deploying
3. Update both HTML and plain text versions
4. Keep templates in sync between code and Supabase dashboard

## Resources

- [Supabase Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Resend Documentation](https://resend.com/docs/introduction)
- [HTML Email Best Practices](https://www.litmus.com/blog/email-coding-best-practices/)
- [Email Testing Tools](https://www.emailonacid.com/) 