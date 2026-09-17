import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzmyfiigvwbteclxweqz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bXlmaWlndndidGVjbHh3ZXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTYzMDEyOCwiZXhwIjoyMTA1MjA2MTI4fQ.-KzfmPyvDmv6EUMF5ngyFo9E5oL_iBICTK7CZ7fWDVY';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, full_name, organization, role, jurisdiction } = body;

    // 1. Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid official email address is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return NextResponse.json({ error: 'Full legal/executive name is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = full_name.trim();
    const cleanOrg = (organization || '').trim() || 'Executive Leadership';
    const cleanRole = (role || '').trim() || 'Executive Counsel';
    const cleanJurisdiction = (jurisdiction || '').trim() || 'Republic of Kenya / EAC';

    // 2. Create user in Supabase Auth (Auto-confirmed)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        organization: cleanOrg,
        role: cleanRole,
        jurisdiction: cleanJurisdiction
      }
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already exists')) {
        return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message || 'Failed to create user account.' }, { status: 400 });
    }

    const authUser = authData.user;
    if (!authUser) {
      return NextResponse.json({ error: 'User creation failed.' }, { status: 500 });
    }

    // 3. Attempt insert into public.users table with service role client
    let dbUser: any = null;
    try {
      const { data, error: insertError } = await supabase.from('users').insert({
        auth_user_id: authUser.id,
        email: cleanEmail,
        full_name: cleanName,
        organization: cleanOrg,
        role: cleanRole,
        jurisdiction: cleanJurisdiction
      }).select().single();

      if (insertError) {
        console.error('public.users table insert error:', insertError);
      } else {
        dbUser = data;
        console.log('public.users table insert successful:', dbUser);
      }
    } catch (dbErr) {
      console.warn('public.users table insert exception:', dbErr);
    }

    // 4. Issue authenticated session token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser?.id || authUser.id,
        auth_user_id: authUser.id,
        email: cleanEmail,
        full_name: cleanName,
        organization: cleanOrg,
        role: cleanRole,
        jurisdiction: cleanJurisdiction
      },
      session: sessionData?.session || null
    }, { status: 201 });

  } catch (err: any) {
    console.error('Sign Up API Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error during registration.' }, { status: 500 });
  }
}
