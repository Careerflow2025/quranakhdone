// Supabase Edge Function to send credential emails via SMTP
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.office365.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
const SMTP_USER = Deno.env.get('SMTP_USER')!
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface EmailRequest {
  to: string
  name: string
  email: string
  password: string
  role: string
  schoolName: string
}

// CORS headers for production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, name, email, password, role, schoolName } = await req.json() as EmailRequest

    console.log('Sending email to:', to, 'for role:', role);

    // Create email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px;
    }
    .credentials-box {
      background: #f9fafb;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .credential-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .credential-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: bold;
      color: #374151;
    }
    .value {
      color: #111827;
      font-family: monospace;
      background: white;
      padding: 5px 10px;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 12px 30px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      margin: 20px 0;
    }
    .warning {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ${schoolName}</h1>
      <p>Your Account Has Been Created</p>
    </div>

    <div class="content">
      <h2>Hello ${name || 'User'},</h2>
      <p>Your ${role} account has been successfully created in the QuranAkh School Management System.</p>

      <div class="credentials-box">
        <h3>🔐 Your Login Credentials</h3>
        <div class="credential-row">
          <span class="label">Email:</span>
          <span class="value">${email}</span>
        </div>
        <div class="credential-row">
          <span class="label">Password:</span>
          <span class="value">${password}</span>
        </div>
        <div class="credential-row">
          <span class="label">Role:</span>
          <span class="value">${role.toUpperCase()}</span>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ Important:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Keep your credentials secure and do not share them with anyone.</li>
          <li>If you need a password reset, please contact your school administrator.</li>
          <li>Only the school administration can change passwords.</li>
        </ul>
      </div>

      <center>
        <a href="https://quranakh.com" class="button">Login to Your Account</a>
      </center>

      <h3>What's Next?</h3>
      <ol style="color: #4b5563; line-height: 1.8;">
        <li>Click the login button above or visit the school portal</li>
        <li>Enter your email and password provided above</li>
        <li>Access your personalized ${role} dashboard</li>
        <li>Start using the QuranAkh School Management System</li>
      </ol>

      <p style="color: #6b7280; margin-top: 20px;">
        If you have any questions or need assistance, please contact your school administrator.
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} QuranAkh School Management System</p>
      <p>This is an automated message from QuranAkh</p>
    </div>
  </div>
</body>
</html>
    `

    // Send email via SMTP with proper error handling
    console.log('SMTP Configuration:', {
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      hasPassword: !!SMTP_PASSWORD
    });

    // Validate SMTP configuration
    if (!SMTP_USER || !SMTP_PASSWORD) {
      const errorMsg = 'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD secrets.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    let emailSent = false;

    try {
      console.log('Creating SMTP client...');
      const client = new SMTPClient({
        connection: {
          hostname: SMTP_HOST,
          port: SMTP_PORT,
          tls: false,
          auth: {
            username: SMTP_USER,
            password: SMTP_PASSWORD,
          },
        },
      });

      console.log('Sending email...');
      await client.send({
        from: SMTP_USER,
        to: to,
        subject: `Your ${schoolName} Account Credentials`,
        content: 'text/html',
        html: emailHtml,
      });

      console.log('Closing SMTP connection...');
      await client.close();
      emailSent = true;
      console.log('Email sent successfully via SMTP to:', to);
    } catch (smtpError: any) {
      console.error('SMTP Error Details:', {
        message: smtpError.message,
        name: smtpError.name,
        stack: smtpError.stack,
      });
      throw new Error(`Failed to send email via SMTP: ${smtpError.message || 'Unknown SMTP error'}`);
    }

    // Update the sent_at timestamp in database
    await supabase
      .from('user_credentials')
      .update({ sent_at: new Date().toISOString() })
      .eq('email', email)

    console.log('Email sent successfully, database updated');

    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge function error:', error);
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      name: error.name
    };
    console.error('Full error details:', JSON.stringify(errorDetails));
    return new Response(JSON.stringify(errorDetails), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
