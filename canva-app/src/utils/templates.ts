import type { ScriptBlock, ScriptMode } from "../types";
import { createBlock } from "./script-helpers";

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  mode: ScriptMode;
  blocks: () => ScriptBlock[];
}

export const TEMPLATES: ScriptTemplate[] = [
  // Screenplay
  {
    id: "horror",
    name: "Horror",
    description: "A tense, atmospheric horror scene",
    mode: "screenplay",
    blocks: () => [
      createBlock("slugline", "EXT. ABANDONED HOUSE - NIGHT"),
      createBlock("action", "Rain pounds against the rotting wood. Lightning illuminates a figure standing in the doorway."),
      createBlock("character", "SARAH"),
      createBlock("dialogue", "Did you hear that?"),
      createBlock("character", "MARK"),
      createBlock("parenthetical", "whispering"),
      createBlock("dialogue", "We need to leave. Now."),
      createBlock("action", "A floorboard CREAKS above them. Dust falls from the ceiling."),
      createBlock("transition", "CUT TO:"),
    ],
  },
  {
    id: "romcom",
    name: "Romantic Comedy",
    description: "A charming meet-cute scene",
    mode: "screenplay",
    blocks: () => [
      createBlock("slugline", "INT. COFFEE SHOP - MORNING"),
      createBlock("action", "The place is packed. ALEX, 30s, juggles a laptop, phone, and coffee. JORDAN, 30s, reads a book at the only open table."),
      createBlock("character", "ALEX"),
      createBlock("dialogue", "Is this seat taken?"),
      createBlock("character", "JORDAN"),
      createBlock("parenthetical", "not looking up"),
      createBlock("dialogue", "Only by my imaginary friend. But he won't mind."),
      createBlock("action", "Alex laughs. Spills coffee on Jordan's book. They both reach for napkins at the same time."),
    ],
  },
  {
    id: "thriller",
    name: "Thriller",
    description: "A high-stakes interrogation scene",
    mode: "screenplay",
    blocks: () => [
      createBlock("slugline", "INT. INTERROGATION ROOM - NIGHT"),
      createBlock("action", "Harsh fluorescent light. DETECTIVE REYES sits across from COLE, who hasn't blinked in thirty seconds."),
      createBlock("character", "DETECTIVE REYES"),
      createBlock("dialogue", "We found the files, Cole. All of them."),
      createBlock("character", "COLE"),
      createBlock("parenthetical", "smiling"),
      createBlock("dialogue", "Then you know what happens next."),
      createBlock("action", "Reyes' phone BUZZES. She reads the message. Her face goes white."),
    ],
  },
  {
    id: "short-film",
    name: "Short Film",
    description: "A complete micro-story structure",
    mode: "screenplay",
    blocks: () => [
      createBlock("slugline", "EXT. BUS STOP - DAWN"),
      createBlock("action", "An OLD MAN sits alone on the bench, holding a faded letter."),
      createBlock("slugline", "INT. APARTMENT - DAY (FLASHBACK)"),
      createBlock("action", "A YOUNG COUPLE dances in the kitchen. The same letter, crisp and new, sits on the counter."),
      createBlock("slugline", "EXT. BUS STOP - DAWN (PRESENT)"),
      createBlock("action", "The old man folds the letter carefully. A bus arrives. He doesn't get on."),
      createBlock("transition", "FADE OUT."),
    ],
  },
  // YouTube
  {
    id: "youtube-tutorial",
    name: "Tutorial Video",
    description: "Step-by-step educational video",
    mode: "youtube",
    blocks: () => [
      createBlock("hook", "Stop making this mistake! Here's what the pros actually do..."),
      createBlock("intro", "What's up everyone! Today I'm going to show you exactly how to [topic] in just 5 minutes."),
      createBlock("body", "Step 1: Start by opening your [tool]. You'll want to make sure you have the latest version."),
      createBlock("body", "Step 2: Now here's where most people go wrong. Instead of doing X, you should do Y."),
      createBlock("body", "Step 3: The final piece is [technique]. Watch how quickly this comes together."),
      createBlock("cta", "If this helped you, smash that like button and subscribe for more tutorials every week!"),
    ],
  },
  {
    id: "youtube-vlog",
    name: "Vlog",
    description: "Day-in-the-life style vlog",
    mode: "youtube",
    blocks: () => [
      createBlock("hook", "Today didn't go as planned... but it turned out even better."),
      createBlock("intro", "Good morning! It's 6 AM and we've got a packed day ahead."),
      createBlock("body", "First stop: the farmer's market downtown. I've been wanting to try this new vendor."),
      createBlock("body", "Okay so something unexpected happened... [describe the surprise moment]"),
      createBlock("body", "Wrapping up the day at the studio. Let me show you what I've been working on."),
      createBlock("cta", "What should I do in next week's vlog? Drop your ideas in the comments!"),
    ],
  },
  // Podcast
  {
    id: "podcast-interview",
    name: "Interview Episode",
    description: "Guest interview format",
    mode: "podcast",
    blocks: () => [
      createBlock("intro", "Welcome back to [Podcast Name]! I'm your host [Name], and today we have an incredible guest."),
      createBlock("segment", "GUEST INTRODUCTION"),
      createBlock("character", "HOST"),
      createBlock("dialogue", "So tell us, how did you first get started in [field]?"),
      createBlock("character", "GUEST"),
      createBlock("dialogue", "[Guest's origin story goes here]"),
      createBlock("adread", "This episode is brought to you by [Sponsor]. Use code PODCAST for 20% off."),
      createBlock("segment", "DEEP DIVE"),
      createBlock("character", "HOST"),
      createBlock("dialogue", "Let's talk about the biggest challenge you've faced..."),
      createBlock("outro", "Thanks for listening! Subscribe wherever you get your podcasts. See you next week!"),
    ],
  },
  {
    id: "podcast-solo",
    name: "Solo Episode",
    description: "Solo host talking points",
    mode: "podcast",
    blocks: () => [
      createBlock("intro", "Hey everyone, welcome to episode [number] of [Podcast Name]. Today I want to talk about something that's been on my mind..."),
      createBlock("segment", "THE PROBLEM"),
      createBlock("dialogue", "Here's what I keep seeing over and over again..."),
      createBlock("segment", "MY TAKE"),
      createBlock("dialogue", "After years of experience, here's what I've learned works best..."),
      createBlock("adread", "Quick shoutout to [Sponsor] for making this episode possible."),
      createBlock("segment", "ACTION STEPS"),
      createBlock("dialogue", "Here are three things you can do right now to start making progress..."),
      createBlock("outro", "That's a wrap! If this resonated with you, share it with a friend who needs to hear it."),
    ],
  },
  // TikTok / Reel
  {
    id: "tiktok-story",
    name: "Story Time",
    description: "Engaging story-time format",
    mode: "tiktok",
    blocks: () => [
      createBlock("hook", "I still can't believe this actually happened to me..."),
      createBlock("body", "So I was at [location] minding my own business when [inciting incident]"),
      createBlock("visualcue", "Show surprised face, then cut to reenactment"),
      createBlock("voiceover", "And that's when things got really interesting..."),
      createBlock("body", "[Climax of the story]"),
      createBlock("cta", "Part 2? Follow for the rest of the story!"),
    ],
  },
  {
    id: "tiktok-tutorial",
    name: "Quick Tutorial",
    description: "Fast-paced how-to",
    mode: "tiktok",
    blocks: () => [
      createBlock("hook", "Here's a trick nobody talks about..."),
      createBlock("visualcue", "Close-up of the result first (before/after)"),
      createBlock("voiceover", "Step one: grab your [item]"),
      createBlock("visualcue", "Show hands doing the action"),
      createBlock("voiceover", "Step two: the key is to [technique]"),
      createBlock("cta", "Save this for later! Follow for more tips"),
    ],
  },
];

export function getTemplatesForMode(mode: ScriptMode): ScriptTemplate[] {
  return TEMPLATES.filter((t) => t.mode === mode);
}
