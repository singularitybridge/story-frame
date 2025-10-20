# StoryFrame

> AI-powered video storytelling platform for creating compelling short-form video content

StoryFrame combines Google's Gemini AI with advanced video generation to help creators produce professional short-form videos with consistent characters, intelligent scene composition, and automated quality evaluation.

## Features

### Core Capabilities

- **AI-Driven Scene Generation** - Create video scenes from text descriptions using Google's Veo 2 video generation
- **Character Consistency** - Generate character reference sheets automatically to maintain visual consistency across scenes
- **Intelligent Project Management** - Organize videos into projects with multiple scenes and story arcs
- **Automated Quality Evaluation** - AI-powered evaluation of video quality, audio transcription accuracy, and visual consistency
- **Scene-by-Scene Editing** - Fine-tune individual scenes with custom prompts, durations, and voiceovers

### Technical Features

- **Persistent Storage** - All videos and evaluations are automatically saved and persist across sessions
- **Project-Based Organization** - Each project maintains its own namespace for videos, evaluations, and character references
- **Real-Time Preview** - Instant video playback with evaluation results and quality metrics
- **Video Export** - Download generated videos for use in other platforms
- **API Key Management** - Secure storage of API credentials with environment variable support

## Tech Stack

- **Framework**: Next.js 15 with App Router and React 19
- **AI/ML**: Google Gemini API (Gemini 2.0 Flash, Veo 2)
- **Styling**: Tailwind CSS 4.1 with shadcn-style components
- **Icons**: Lucide React
- **Language**: TypeScript
- **Storage**: File-based persistence with REST API endpoints

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Google Gemini API key ([Get one here](https://ai.google.dev/))
- (Optional) OpenAI API key for audio transcription ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/singularitybridge/story-frame.git
cd story-frame
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API keys:

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here  # Optional
```

> **Note**: The Gemini API key is required for video generation. The OpenAI API key is optional and only used for audio transcription during video evaluation.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3039](http://localhost:3039) in your browser

### First Steps

1. The app will load with sample projects on the homepage
2. Click on a project to open the scene editor
3. If you have character reference images, they'll be loaded automatically from `/public/generated-refs/[project-id]/`
4. Select a scene from the left panel
5. Click "Generate Video" in the right panel to create your first video
6. Use "Evaluate Video" to get AI-powered quality metrics

## Usage

### Creating Your First Project

1. Launch StoryFrame and click on an existing project or create a new one
2. Define your scenes with descriptions, durations, and optional voiceovers
3. Generate character references if you want consistent characters across scenes
4. Click "Generate Video" on each scene to create the video content
5. Use "Evaluate" to get AI-powered quality metrics
6. Download or share your completed scenes

### Project Structure

```
storyframe/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes for videos and evaluations
│   ├── projects/             # Dynamic project pages
│   └── page.tsx              # Homepage
├── components/               # React components
│   ├── SceneManager.tsx      # Main scene editing interface
│   └── ProjectList.tsx       # Project selection grid
├── services/                 # Business logic and API clients
│   ├── geminiService.ts      # Gemini AI integration
│   ├── evaluationService.ts  # Video quality evaluation
│   └── videoStorage.server.ts # Video persistence
├── types/                    # TypeScript type definitions
└── public/                   # Static assets and generated content
    ├── videos/               # Generated video files
    ├── evaluations/          # Evaluation results
    └── generated-refs/       # Character reference sheets
```

## API Documentation

### Video Generation

StoryFrame uses Google's Gemini API for video generation:

- **Model**: Veo 2
- **Max Duration**: 8 seconds per scene
- **Resolution**: 1280x720
- **Format**: MP4

### Evaluation System

The evaluation service analyzes:

- **Audio Quality**: Transcription accuracy and clarity (via OpenAI Whisper)
- **Visual Consistency**: First and last frame quality assessment
- **Overall Score**: Weighted average of all metrics

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Google Gemini](https://ai.google.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Roadmap

- [ ] Multi-language support
- [ ] Advanced character customization
- [ ] Batch video generation
- [ ] Cloud storage integration
- [ ] Collaborative editing
- [ ] Video timeline editor
- [ ] Audio library integration
- [ ] Export to social media platforms

---

Built with ❤️ by the StoryFrame community
