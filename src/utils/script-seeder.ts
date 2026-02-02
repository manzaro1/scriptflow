"use client";

import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const DEFAULT_SCRIPT_TITLE = 'The Last Echo';

const defaultContent = [
    { id: '1', type: 'slugline', content: 'EXT. RAIN-SLICKED ALLEY - NIGHT' },
    { id: '2', type: 'action', content: "A flickering neon sign for 'NEURAL NET' buzzes overhead. JAX (30s, weary) stands under a dripping awning, clutching a glowing data core. He looks over his shoulder." },
    { id: '3', type: 'character', content: 'JAX' },
    { id: '4', type: 'parenthetical', content: 'whispering' },
    { id: '5', type: 'dialogue', content: 'Just a few more minutes. That was the deal.' },
    { id: '6', type: 'slugline', content: 'INT. UNDERGROUND HUB - CONTINUOUS' },
    { id: '7', type: 'action', content: "The heavy steel doors hiss open. VERA (40s, sharp) waits in the shadows. Her cybernetic eye pulses with a cold, electric red light." },
    { id: '8', type: 'character', content: 'VERA' },
    { id: '9', type: 'dialogue', content: "You're late, Jax. I don't like being kept in the dark. Literally or figuratively." }
];

/**
 * Ensures a sample script exists for a new user.
 * Returns true if a script was just created, false otherwise.
 */
export async function ensureSampleScriptExists(userId: string, userName: string): Promise<boolean> {
    try {
        // 1. Check if any scripts exist for the user (including shared ones they can see)
        const { data: existingScripts, error: countError } = await supabase
            .from('scripts')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (countError) {
            console.error("[script-seeder] Error checking script count:", countError);
            return false;
        }

        if (existingScripts && existingScripts.length > 0) {
            return false; // Scripts already exist
        }

        // 2. If no scripts exist, create the sample script
        const { data: scriptData, error: insertError } = await supabase
            .from('scripts')
            .insert({
                user_id: userId,
                title: DEFAULT_SCRIPT_TITLE,
                author: userName,
                genre: 'Sci-Fi',
                content: defaultContent,
                status: 'In Progress'
            })
            .select('id')
            .single();

        if (insertError) {
            // Check if it's a unique constraint or RLS error, or if someone beat us to it
            console.error("[script-seeder] Insert error:", insertError);
            return false;
        }

        if (scriptData) {
            // 3. Create initial storyboard entry for the sample script
            await supabase
                .from('storyboards')
                .insert({
                    script_id: scriptData.id,
                    user_id: userId,
                    data: [],
                    aspect_ratio: '2.39:1'
                });

            showSuccess(`Welcome! Sample script "${DEFAULT_SCRIPT_TITLE}" created.`);
            return true;
        }

        return false;
    } catch (error: any) {
        console.error("[script-seeder] Unexpected error:", error);
        return false;
    }
}