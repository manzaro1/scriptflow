import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const DEFAULT_SCRIPT_TITLE = 'The Last Echo';

const defaultContent = [
    { id: '1', type: 'slugline', content: 'EXT. RAIN-SLICKED ALLEY - NIGHT' },
    { id: '2', type: 'action', content: 'A flickering neon sign for \'NEURAL NET\' buzzes overhead. JAX (30s, weary) stands under a dripping awning, clutching a glowing data core. He looks over his shoulder.' },
    { id: '3', type: 'character', content: 'JAX' },
    { id: '4', type: 'parenthetical', content: 'whispering' },
    { id: '5', type: 'dialogue', content: 'Just a few more minutes. That was the deal.' },
    { id: '6', type: 'slugline', content: 'INT. UNDERGROUND HUB - CONTINUOUS' },
    { id: '7', type: 'action', content: 'The heavy steel doors hiss open. VERA (40s, sharp) waits in the shadows. Her cybernetic eye pulses with a cold, electric red light.' },
    { id: '8', type: 'character', content: 'VERA' },
    { id: '9', type: 'dialogue', content: 'You\'re late, Jax. I don\'t like being kept in the dark. Literally or figuratively.' }
];

export async function ensureSampleScriptExists(userId: string, userEmail: string, userName: string) {
    // 1. Check if any scripts exist for the user
    const { count, error: countError } = await supabase
        .from('scripts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (countError) {
        console.error("Error checking script count:", countError);
        return;
    }

    if (count && count > 0) {
        // Scripts already exist, no need to seed.
        return;
    }

    // 2. If no scripts exist, create the sample script
    try {
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

        if (insertError) throw insertError;

        // 3. Create initial storyboard entry for the sample script
        await supabase
            .from('storyboards')
            .insert({
                script_id: scriptData.id,
                user_id: userId,
                data: '[]' as any,
                aspect_ratio: '2.39:1'
            });

        showSuccess(`Welcome! Sample script "${DEFAULT_SCRIPT_TITLE}" created.`);
    } catch (error: any) {
        console.error("Error seeding sample script:", error);
        showError("Failed to create sample script. Please try creating one manually.");
    }
}