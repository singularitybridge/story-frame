# StoryFrame - Claude Development Guidelines

## Project Overview

StoryFrame is an AI-powered video storytelling platform for creating short-form video content. It uses Google's Gemini AI (Veo 2) for video generation with character consistency and intelligent evaluation.

## Quick Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/singularitybridge/story-frame.git
   cd story-frame
   npm install
   ```

2. **Configure API Keys**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API keys:
   - `NEXT_PUBLIC_GEMINI_API_KEY` - Required for video generation
   - `NEXT_PUBLIC_OPENAI_API_KEY` - Optional, for audio transcription in evaluations

3. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open http://localhost:3039

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router) + React 19
- **AI/ML**: Google Gemini API (Gemini 2.0 Flash, Veo 2)
- **Styling**: Tailwind CSS 4.1 + shadcn-style components
- **Icons**: Lucide React
- **Storage**: File-based persistence with API routes

### Project Structure
```
storyframe/
├── app/                     # Next.js App Router
│   ├── api/                 # API routes (videos, evaluations)
│   ├── projects/[id]/       # Dynamic project pages
│   └── page.tsx             # Homepage
├── components/              # React components
│   ├── SceneManager.tsx     # Main 3-column editor
│   └── ProjectList.tsx      # Project grid
├── services/                # Business logic
│   ├── geminiService.ts     # Gemini AI integration
│   ├── evaluationService.ts # Video quality evaluation
│   └── videoStorage.server.ts # Persistence
├── types/                   # TypeScript definitions
└── public/                  # Static + generated content
    ├── videos/              # Generated videos
    ├── evaluations/         # Evaluation results
    └── generated-refs/      # Character references
```

### Key Features
- **3-Column Layout**: Scene list | Video player | Controls
- **Character Consistency**: Reference sheet generation
- **Project-Based Organization**: Each project has its own namespace
- **Video Persistence**: All videos saved to server
- **Evaluation System**: AI-powered quality analysis

## Development Guidelines

### Design System
- **Use shadcn/ui principles**: Clean, minimal, flat design
- **No gradients**: Solid colors only
- **Color palette**:
  - Primary: Indigo-600
  - Success: Green-600
  - Warning: Yellow-600
  - Error: Red-600
  - Neutral: Gray-100 to Gray-900
- **Icons**: Lucide React only
- **Spacing**: Tailwind standard spacing scale

### Code Style
- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Naming**: camelCase for variables, PascalCase for components
- **File structure**: Co-locate related files

### API Integration
- **Gemini API**: Used for video generation and evaluation
- **Rate Limits**: Handle gracefully with user feedback
- **Error Handling**: User-friendly error messages

### State Management
- **Local state**: useState for component state
- **Persistence**: localStorage + server storage
- **Video URLs**: Blob URLs converted to server URLs

## Common Tasks

### Adding a New Scene Type
1. Update `types/project.ts` with new scene type
2. Add icon mapping in `SceneManager.tsx`
3. Update prompt building logic if needed

### Modifying Video Generation
1. Update settings in `types/index.ts`
2. Modify `geminiService.ts` for Gemini API calls
3. Update UI controls in SceneManager right panel

### Adding Evaluation Metrics
1. Extend `evaluationService.ts`
2. Update evaluation display in SceneManager
3. Add new metric UI in right panel

## Testing

- **Manual Testing**: Use http://localhost:3039
- **Test Projects**: Sample projects in `/data`
- **API Testing**: Check browser console for API responses

## Deployment Notes

- Requires environment variables for API keys
- Generated content stored in `/public` (excluded from git)
- No database required - file-based storage
- Runs on port 3039 by default

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following guidelines above
4. Test thoroughly with sample projects
5. Submit PR with clear description

## Resources

- [Google Gemini API Docs](https://ai.google.dev/)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
