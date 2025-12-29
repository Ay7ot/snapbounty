import { createClient } from "@supabase/supabase-js";

// Admin client with service role key - bypasses RLS
// Use this for server-side operations that need full database access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminClient: ReturnType<typeof createClient<any>> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminClient(): ReturnType<typeof createClient<any>> {
    if (!adminClient) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error(
                "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
            );
        }

        adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    return adminClient;
}

