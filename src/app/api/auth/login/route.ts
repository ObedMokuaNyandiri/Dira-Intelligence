import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzmyfiigvwbteclxweqz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bXlmaWlndndidGVjbHh3ZXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTYzMDEyOCwiZXhwIjoyMTA1MjA2MTI4fQ.-KzfmPyvDmv6EUMF5ngyFo9E5oL_iBICTK7CZ7fWDVY';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid official email address is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Sign In via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    if (authError || !authData.user) {
      return NextResponse.json({ 
        error: 'Invalid email credentials or unauthorized access clearance.' 
      }, { status: 401 });
    }

    const authUser = authData.user;
    let userProfile = {
      id: authUser.id,
      auth_user_id: authUser.id,
      email: cleanEmail,
      full_name: authUser.user_metadata?.full_name || 'Executive User',
      organization: authUser.user_metadata?.organization || 'Executive Leadership',
      role: authUser.user_metadata?.role || 'Executive Counsel',
      jurisdiction: authUser.user_metadata?.jurisdiction || 'Republic of Kenya / EAC'
    };

    // 3. Attempt to fetch augmented profile from public.users table if it exists
    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbUser) {
        userProfile = {
          id: dbUser.id || authUser.id,
          auth_user_id: authUser.id,
          email: dbUser.email,
          full_name: dbUser.full_name || userProfile.full_name,
          organization: dbUser.organization || userProfile.organization,
          role: dbUser.role || userProfile.role,
          jurisdiction: dbUser.jurisdiction || userProfile.jurisdiction
        };
      }
    } catch (dbErr) {
      console.warn('public.users table read notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      user: userProfile,
      session: authData.session
    });

  } catch (err: any) {
    console.error('Login API Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error during authentication.' }, { status: 500 });
  }
}
