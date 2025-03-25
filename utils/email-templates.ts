/**
 * Email Templates for Supabase Authentication
 * 
 * These templates should be copied into your Supabase Dashboard:
 * 1. Go to Authentication → Email Templates
 * 2. Update the "Sign Up", "Magic Link", and other templates with these HTML templates
 * 3. Save your changes
 * 
 * Using proper HTML structure with <html> and <body> tags helps improve email deliverability
 * and reduces the chance of emails ending up in spam folders.
 */

export const SIGNUP_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CatHealth</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; color: #374151;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f9fafb">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(to right, #4f46e5, #6366f1); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to CatHealth</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">Thank you for signing up! To get started, please confirm your email address by clicking the button below:</p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(to right, #4f46e5, #6366f1); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; text-align: center;">Confirm Your Email</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.5;">Or copy and paste this URL into your browser:</p>
              <p style="margin: 10px 0 0; font-size: 14px; line-height: 1.5; color: #6b7280; word-break: break-all;">{{ .ConfirmationURL }}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">If you didn't sign up for CatHealth, you can safely ignore this email.</p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} CatHealth. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const MAGIC_LINK_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In to CatHealth</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; color: #374151;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f9fafb">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(to right, #4f46e5, #6366f1); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Sign In to CatHealth</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">Click the button below to sign in to your CatHealth account. This link will expire in 24 hours.</p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .SiteURL }}/auth/confirm?token={{ .TokenHash }}&type=email&redirect_to={{ .RedirectTo }}" style="display: inline-block; background: linear-gradient(to right, #4f46e5, #6366f1); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; text-align: center;">Sign In</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.5;">Or copy and paste this URL into your browser:</p>
              <p style="margin: 10px 0 0; font-size: 14px; line-height: 1.5; color: #6b7280; word-break: break-all;">{{ .SiteURL }}/auth/confirm?token={{ .TokenHash }}&type=email&redirect_to={{ .RedirectTo }}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} CatHealth. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const PASSWORD_RESET_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your CatHealth Password</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; color: #374151;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f9fafb">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(to right, #4f46e5, #6366f1); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">You requested to reset your password for CatHealth. Click the button below to set a new password:</p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(to right, #4f46e5, #6366f1); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; text-align: center;">Reset Password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.5;">Or copy and paste this URL into your browser:</p>
              <p style="margin: 10px 0 0; font-size: 14px; line-height: 1.5; color: #6b7280; word-break: break-all;">{{ .ConfirmationURL }}</p>
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.5;">If you didn't request a password reset, you can safely ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">CatHealth - Your partner in feline wellness</p>
              <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} CatHealth. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`; 