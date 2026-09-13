import { getSupabaseClient } from './supabase';

export async function checkCoachAllowlist(): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return false;
    }

    // First try calling the RPC function (most reliable)
    const { data: isAllowlisted, error: rpcError } = await supabase
      .rpc('is_allowlisted_coach');
    
    if (!rpcError && isAllowlisted !== null) {
      return isAllowlisted;
    }

    // Fallback: try querying the allowlist table directly
    const { data, error } = await supabase
      .from('coach_allowlist')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error checking allowlist:', error);
      // If we get an RLS error, the user is likely not allowlisted
      if (error.code === 'PGRST301' || error.message.includes('policy')) {
        return false;
      }
    }

    // If we successfully queried and got data, user is allowlisted
    return data !== null && data.length > 0;
  } catch (error) {
    console.error('Error in checkCoachAllowlist:', error);
    return false;
  }
}

export async function isAdminCoach(): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .rpc('is_admin_coach');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in isAdminCoach:', error);
    return false;
  }
}
