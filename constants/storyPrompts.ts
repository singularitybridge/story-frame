/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AI prompt templates for story generation
 * All prompts optimized for Gemini 2.0 Flash Exp with JSON output
 */

export const STORY_PROMPTS = {
  /**
   * Quick Path: Genre + Type + Energy → Complete Story
   */
  quickPath: `You are a creative video story generator for Echo, an AI-powered 9:16 portrait video platform.

Generate a complete 4-scene story based on these parameters:
- Genre: {genre}
- Story Type: {type}
- Energy/Pacing: {energy}

Requirements:
1. Create a compelling character with a clear personality
2. Build a narrative arc across 4 scenes (setup → conflict → climax → resolution)
3. Each scene MUST be optimized for 9:16 vertical video (portrait orientation)
4. Visual prompts should focus on close-ups and medium shots suitable for vertical framing
5. Voiceovers should be dialogue spoken by the character (12-25 words each)

Each scene must include:
- title: 3-6 words
- prompt: 8-10 words describing visual action, cinematic style, 9:16 optimized
- voiceover: 12-25 words as dialogue in quotes (will be formatted as: 'Character says, "dialogue" (no subtitles)')
- cameraAngle: Specific technical term (Close-up, Medium shot, Wide shot, Over-the-shoulder, etc.)
- duration: 8 (always 8 seconds)

Return ONLY valid JSON with this exact structure:
{
  "projectMetadata": {
    "title": "Story Title (3-5 words)",
    "description": "One sentence description",
    "type": "short",
    "character": "Character name and brief description",
    "aspectRatio": "9:16",
    "defaultModel": "Veo 3.1",
    "defaultResolution": "720p"
  },
  "scenes": [
    {
      "id": "scene-1",
      "title": "Scene title",
      "duration": 8,
      "prompt": "Visual description for Veo",
      "cameraAngle": "Camera angle",
      "voiceover": "Dialogue text",
      "generated": false,
      "settings": {
        "model": "Veo 3.1",
        "resolution": "720p",
        "isLooping": false
      }
    }
  ]
}`,

  /**
   * Custom Path: User Concept → Complete Story
   */
  customPath: `You are a creative video story generator for Echo, an AI-powered 9:16 portrait video platform.

Generate a complete 4-scene story based on this user input:
- Core Concept: {concept}
- Character: {character}
- Mood: {mood}

Requirements:
1. Expand the user's concept into a cohesive 4-scene narrative arc
2. Create compelling scenes optimized for 9:16 vertical video
3. Visual prompts should focus on close-ups and medium shots
4. Build emotional progression that matches the specified mood
5. Voiceovers should be character dialogue (12-25 words each)

Each scene must include:
- title: 3-6 words
- prompt: 8-10 words describing visual action, cinematic, 9:16 optimized
- voiceover: 12-25 words as dialogue in quotes
- cameraAngle: Specific technical term
- duration: 8

Return ONLY valid JSON with this exact structure:
{
  "projectMetadata": {
    "title": "Story Title (3-5 words)",
    "description": "One sentence description",
    "type": "short",
    "character": "Character name and description",
    "aspectRatio": "9:16",
    "defaultModel": "Veo 3.1",
    "defaultResolution": "720p"
  },
  "scenes": [
    {
      "id": "scene-1",
      "title": "Scene title",
      "duration": 8,
      "prompt": "Visual description",
      "cameraAngle": "Camera angle",
      "voiceover": "Dialogue",
      "generated": false,
      "settings": {
        "model": "Veo 3.1",
        "resolution": "720p",
        "isLooping": false
      }
    }
  ]
}`,

  /**
   * Scene Regeneration: Regenerate single scene while maintaining continuity
   */
  sceneRegeneration: `Regenerate scene {sceneNumber} for this story while maintaining narrative continuity.

Project: {projectTitle}
Character: {character}
Previous scene: {previousSceneTitle}
Next scene: {nextSceneTitle}

Create a fresh variation of this scene that:
1. Maintains the narrative flow from previous to next scene
2. Uses different visual approach but same emotional beat
3. Keeps character voice consistent
4. Optimized for 9:16 portrait video

Return ONLY valid JSON with this structure:
{
  "id": "scene-{sceneNumber}",
  "title": "Scene title (3-6 words)",
  "duration": 8,
  "prompt": "Visual description (8-10 words)",
  "cameraAngle": "Camera angle",
  "voiceover": "Dialogue (12-25 words)",
  "generated": false,
  "settings": {
    "model": "Veo 3.1",
    "resolution": "720p",
    "isLooping": false
  }
}`,
};

/**
 * Character reference image generation prompt template
 * Optimized for portrait-oriented character consistency
 */
export const CHARACTER_REFERENCE_PROMPT = (
  characterDescription: string,
  variation: string
) => `A close-up portrait of ${characterDescription}, ${variation},
portrait shot focusing on face and upper body,
large expressive eyes, highly detailed facial features,
white background, centered composition,
flat design with solid colors ONLY, NO GRADIENTS,
professional quality, animation-ready, 1024x1024`;

/**
 * Character illustration prompt for Quick Path UI
 * Generates 96x96px expressive portraits for genre/type/energy selection
 */
export const CHARACTER_ILLUSTRATION_PROMPT = (
  characterType: string,
  emotion: string
) => `A close-up portrait of an adorable cute cartoon ${characterType} with huge expressive eyes,
${emotion} expression, Pixar animation style,
simple clean shapes perfect for animation,
large round eyes with detailed pupils and highlights,
highly expressive ${emotion.toLowerCase()} face,
white background, centered composition,
portrait shot focusing on face and upper body,
flat design with solid colors ONLY, NO GRADIENTS,
appeal to professional animators, 1024x1024`;
