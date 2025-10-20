# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryFrame is an AI-powered video storytelling platform built with Next.js 15 that generates short-form videos using Google's Gemini AI (Veo 2). The application features character consistency across scenes, project-based organization, and AI-powered video quality evaluation.

## Development Commands

```bash
# Development server (runs on port 3039)
npm run dev

# Production build
npm run build

# Production server
npm run start

# Process manager (if using PM2)
pm2 start ecosystem.config.cjs
pm2 logs veo-studio --lines 50 --nostream
pm2 restart veo-studio
```

**Important**: The app runs on port **3039** by default, not 3000.

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# Required for video generation
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Optional for audio transcription in evaluations
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

The Gemini API key is **required**. OpenAI API key is optional (only needed for audio transcription during evaluation).

## Architecture & Key Concepts

### Data Flow Architecture

1. **Project Loading**: Projects are loaded from `/data/*.json` files (static project definitions)
2. **Video Generation**: Gemini API generates videos → saved to `/public/videos/{projectId}/{sceneId}.mp4`
3. **Character References**: Reference images stored in `/public/generated-refs/{projectId}/character-ref-{1,2,3}.png`
4. **Evaluations**: Saved to `/public/evaluations/{projectId}/{sceneId}.json`
5. **Project State**: Auto-saved to server via API routes with 1-second debounce

### Storage & Persistence

- **File-based storage**: No database required
- **Project namespacing**: Each project has isolated storage for videos, evaluations, and references
- **Server-side storage**: Videos and evaluations persisted via Next.js API routes
- **Client state**: React state + localStorage for temporary data

### API Routes Structure

- `POST /api/videos` - Save video for a scene
- `GET /api/videos?projectId={id}` - Get all videos for a project
- `DELETE /api/videos?projectId={id}&sceneId={id}` - Delete a video
- `POST /api/export` - Concatenate and export all project videos using FFmpeg
- Similar structure for `/api/evaluations` and `/api/projects`

### Component Architecture

**SceneManager.tsx** (Main editing interface):
- 3-column layout: Scene list (left) | Video player (center) | Controls (right)
- Manages video generation, evaluation, and project state
- Auto-loads character references and persisted videos on mount
- Handles blob URLs → server URLs conversion after generation

**Services Layer**:
- `geminiService.ts` - Direct integration with Gemini API for video generation
- `evaluationService.ts` - Frame extraction, Gemini vision evaluation, Whisper transcription
- `videoStorage.server.ts` - Client-side API wrapper for video persistence
- `projectStorage.server.ts` - Project metadata persistence

### Video Generation Flow

1. User clicks "Generate Video" in SceneManager
2. Prompt built from: `scene.prompt + voiceover (as dialogue) + camera angle`
3. Character references (if present) included as reference images
4. Gemini API call via `geminiService.ts`
5. Video blob saved to server via `videoStorage.saveVideo()`
6. Scene updated with server URL for persistence

### Evaluation System

Two-part evaluation:
1. **Visual**: First/last frame analysis using Gemini 2.0 Flash vision
2. **Audio**: Whisper transcription + Gemini text comparison (optional, requires OpenAI key)

Score calculation: `(firstFrameScore + lastFrameScore + audioScore) / 3`

## Important Implementation Details

### Character Reference System
- Auto-loads from `/public/generated-refs/{projectId}/` on SceneManager mount
- Expects up to 3 PNG files: `character-ref-1.png`, `character-ref-2.png`, `character-ref-3.png`
- References sent as `VideoGenerationReferenceType.ASSET` to Gemini API
- Must exist before generation (generate button disabled if missing)

### Video URL Handling
- **Generation**: Creates blob URL → saves to server → updates scene with server URL
- **Loading**: Fetches from server and sets videoUrl in scene state
- **Server URLs**: Format `/videos/{projectId}/{sceneId}.mp4`

### Prompt Engineering for Veo 3.1
Dialogue format: `A woman says, "dialogue text" (no subtitles)`
- Keep dialogue 12-25 words for 8-second clips
- Append camera angle after dialogue
- Example: `Woman on beach at sunset. A woman says, "Freedom feels like the ocean breeze" (no subtitles). Medium shot`

### Project Data Structure
```typescript
Project {
  id, title, description, type, character
  scenes: [{
    id, title, duration, prompt, cameraAngle, voiceover
    generated, videoUrl, settings
    evaluation: { audioEvaluation, firstFrameEvaluation, lastFrameEvaluation, overallScore }
  }]
}
```

## Common Modifications

### Adding New Scene Properties
1. Update `types/project.ts` Scene interface
2. Modify SceneManager UI to display/edit new property
3. Update prompt building logic in `buildVeoPrompt()` if needed

### Modifying Video Generation Settings
1. Update `types/index.ts` for new VeoModel/AspectRatio/Resolution values
2. Add UI controls in SceneManager settings panel
3. Ensure `currentSettings` state includes new options

### Adding New Evaluation Metrics
1. Extend `VideoEvaluation` type in `evaluationService.ts`
2. Add analysis logic in `evaluateVideo()` function
3. Update SceneManager evaluation results UI

### Creating Custom Projects
Add JSON file to `/data/`:
```json
{
  "id": "unique-id",
  "title": "Project Title",
  "type": "short",
  "scenes": [
    {
      "id": "scene-1",
      "title": "Scene Title",
      "duration": 8,
      "prompt": "Visual description",
      "cameraAngle": "Medium shot",
      "voiceover": "Optional dialogue",
      "generated": false
    }
  ]
}
```

Then add reference to `/data/projects.json`:
```json
{
  "projects": [
    { "id": "unique-id", "file": "unique-id.json" }
  ]
}
```

## Design System

- **Framework**: Tailwind CSS 4.1 with shadcn-style components
- **No gradients**: Use solid colors only
- **Icons**: Lucide React exclusively
- **Color palette**:
  - Primary: `indigo-600`
  - Success: `green-600`
  - Warning: `yellow-600`
  - Error: `red-600`
  - Neutral: `gray-100` to `gray-900`

## Testing Workflow

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3039`
3. Select a project from homepage
4. Verify character refs load (check browser console)
5. Generate videos and check:
   - Video appears in player
   - Server URL saved (check Network tab)
   - Video persists on page reload
6. Run evaluation and verify:
   - Frame analysis displays
   - Audio transcription works (if OpenAI key provided)
   - Overall score calculated

## Troubleshooting

**Videos not persisting**: Check `/public/videos/{projectId}/` directory exists and API routes are working

**Character refs not loading**: Verify files exist at `/public/generated-refs/{projectId}/character-ref-{1,2,3}.png`

**Generation failing**: Check Gemini API key in `.env.local` and browser console for errors

**Evaluation not working**: Verify Gemini API key for frame analysis, OpenAI key for audio (optional)

**Export failing**: Ensure FFmpeg is installed on server/system
