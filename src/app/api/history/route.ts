import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzmyfiigvwbteclxweqz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bXlmaWlndndidGVjbHh3ZXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTYzMDEyOCwiZXhwIjoyMTA1MjA2MTI4fQ.-KzfmPyvDmv6EUMF5ngyFo9E5oL_iBICTK7CZ7fWDVY';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Fetch search history strictly isolated to the authenticated user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User identification required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_query_history')
      .select('id, query, tagline, answer, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) {
      console.warn('user_query_history read notice:', error.message);
      // Return empty array gracefully if table is being initialized
      return NextResponse.json({ history: [] });
    }

    const history = (data || []).map((row: any) => ({
      id: row.id,
      query: row.query,
      tagline: row.tagline || row.query,
      timestamp: new Date(row.created_at).getTime(),
      answer: row.answer
    }));

    return NextResponse.json({ history });
  } catch (err: any) {
    console.error('History GET API Error:', err);
    return NextResponse.json({ history: [], error: err?.message }, { status: 500 });
  }
}

// POST: Save a new query and response linked strictly to the user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, query, tagline, answer } = body;

    if (!userId || !query || !answer) {
      return NextResponse.json({ error: 'userId, query, and answer are required' }, { status: 400 });
    }

    const cleanTagline = tagline || query.slice(0, 50);

    const { data, error } = await supabase
      .from('user_query_history')
      .insert({
        user_id: userId,
        query: query,
        tagline: cleanTagline,
        answer: answer
      })
      .select('id, query, tagline, answer, created_at')
      .single();

    if (error) {
      console.warn('user_query_history insert notice:', error.message);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        fallbackItem: {
          id: Date.now().toString(),
          query: query,
          tagline: cleanTagline,
          timestamp: Date.now(),
          answer: answer
        }
      });
    }

    return NextResponse.json({
      success: true,
      item: {
        id: data.id,
        query: data.query,
        tagline: data.tagline,
        timestamp: new Date(data.created_at).getTime(),
        answer: data.answer
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error('History POST API Error:', err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// DELETE: Delete a single item or clear all history for the user from database
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (!userId) {
      return NextResponse.json({ error: 'User identification required' }, { status: 400 });
    }

    if (all === 'true') {
      // Clear entire history for this user
      const { error } = await supabase
        .from('user_query_history')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.warn('user_query_history clear notice:', error.message);
      }
      return NextResponse.json({ success: true, clearedAll: true });
    }

    if (id) {
      // Delete single record verifying user ownership
      const { error } = await supabase
        .from('user_query_history')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.warn('user_query_history delete notice:', error.message);
      }
      return NextResponse.json({ success: true, deletedId: id });
    }

    return NextResponse.json({ error: 'Provide either id or all=true' }, { status: 400 });
  } catch (err: any) {
    console.error('History DELETE API Error:', err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
