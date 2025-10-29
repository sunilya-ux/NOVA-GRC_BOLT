import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const demoUsers = [
  { id: '10000000-0000-0000-0000-000000000001', email: 'officer@demo.com', name: 'Priya Sharma' },
  { id: '10000000-0000-0000-0000-000000000002', email: 'manager@demo.com', name: 'Rajesh Kumar' },
  { id: '10000000-0000-0000-0000-000000000003', email: 'cco@demo.com', name: 'Anita Desai' },
  { id: '10000000-0000-0000-0000-000000000004', email: 'admin@demo.com', name: 'Vikram Singh' },
  { id: '10000000-0000-0000-0000-000000000005', email: 'mlengineer@demo.com', name: 'Deepak Verma' },
  { id: '10000000-0000-0000-0000-000000000006', email: 'ciso@demo.com', name: 'Kavita Reddy' },
  { id: '10000000-0000-0000-0000-000000000007', email: 'auditor@demo.com', name: 'Suresh Patel' },
  { id: '10000000-0000-0000-0000-000000000008', email: 'dpo@demo.com', name: 'Meena Iyer' },
  { id: '10000000-0000-0000-0000-000000000009', email: 'external@demo.com', name: 'Ashok Mehta' },
  { id: '10000000-0000-0000-0000-000000000010', email: 'officer2@demo.com', name: 'Sneha Gupta' },
  { id: '10000000-0000-0000-0000-000000000011', email: 'manager2@demo.com', name: 'Arun Nair' },
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = [];

    for (const user of demoUsers) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'demo123',
          email_confirm: true,
          user_metadata: {
            full_name: user.name
          },
          app_metadata: {
            provider: 'email'
          }
        });

        if (error) {
          results.push({ email: user.email, status: 'error', error: error.message });
        } else {
          results.push({ email: user.email, status: 'created', id: data.user.id });
        }
      } catch (err) {
        results.push({ email: user.email, status: 'error', error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});