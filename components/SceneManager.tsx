/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, Film, CheckCircle2, Settings, MessageSquare, AlertCircle, Search, Copy, Check, ArrowLeft, X, Image as ImageIcon } from 'lucide-react';
import { generateVideo, GeneratedVideo } from '../services/videoService';
import { GeneratedImage } from '../services/imageService';
import { VeoModel, AspectRatio, Resolution } from '../types';
import { evaluateVideo } from '../services/evaluationService';
import { CostTracker } from './CostTracker';
import { videoStorage } from '../services/videoStorage.server';
import { evaluationStorage } from '../services/evaluationStorage.server';
import { Project, Scene, GenerationSettings } from '../types/project';

interface SceneManagerProps {
  projectId: string;
}

const SceneManager: React.FC<SceneManagerProps> = ({ projectId }) => {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [generatingSceneIds, setGeneratingSceneIds] = useState<Set<string>>(new Set());
  const [characterRefs, setCharacterRefs] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [evaluatingSceneIds, setEvaluatingSceneIds] = useState<Set<string>>(new Set());
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [showRefsModal, setShowRefsModal] = useState<boolean>(false);

  // Default generation settings
  const [currentSettings, setCurrentSettings] = useState<GenerationSettings>({
    model: VeoModel.VEO,
    aspectRatio: AspectRatio.LANDSCAPE,
    resolution: Resolution.P720,
    isLooping: false,
  });

  // Load OpenAI API key from environment or localStorage
  useEffect(() => {
    // First try environment variable, then localStorage
    const envKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const savedKey = localStorage.getItem('openai_api_key');

    if (envKey) {
      setOpenaiApiKey(envKey);
    } else if (savedKey) {
      setOpenaiApiKey(savedKey);
    }
  }, []);

  // Load the specific project from data files
  useEffect(() => {
    const loadProject = async () => {
      try {
        // Fetch projects index
        const indexResponse = await fetch('/data/projects.json');
        if (!indexResponse.ok) {
          setError(`Failed to load projects index`);
          return;
        }

        const projectsIndex = await indexResponse.json();
        const projectRef = projectsIndex.projects.find((p: any) => p.id === projectId);

        if (!projectRef) {
          setError(`Project ${projectId} not found`);
          return;
        }

        // Fetch the specific project data
        const response = await fetch(`/data/${projectRef.file}`);
        if (response.ok) {
          const projectData = await response.json();
          setProject(projectData as Project);
          setSelectedSceneId(projectData.scenes[0]?.id);
        } else {
          setError(`Failed to load project ${projectId}`);
        }
      } catch (err) {
        console.error(`Failed to load project ${projectId}:`, err);
        setError(`Failed to load project ${projectId}`);
      }
    };

    loadProject();
  }, [projectId]);

  // Auto-load character reference images (per-project)
  useEffect(() => {
    if (!projectId) return;

    const loadCharacterRefs = async () => {
      const refs: GeneratedImage[] = [];

      for (let i = 1; i <= 3; i++) {
        try {
          const response = await fetch(`/generated-refs/${projectId}/character-ref-${i}.png`);
          if (response.ok) {
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
              reader.onloadend = () => {
                const base64 = reader.result as string;
                resolve(base64.split(',')[1]);
              };
              reader.readAsDataURL(blob);
            });

            const imageBytes = await base64Promise;

            refs.push({
              imageBytes,
              mimeType: 'image/png',
              objectUrl,
              blob,
            });
          }
        } catch (err) {
          console.log(`Character ref ${i} not found`);
        }
      }

      setCharacterRefs(refs);
      console.log(`Loaded ${refs.length} character reference images`);
    };

    loadCharacterRefs();
  }, [projectId]);

  // Load saved scene data from localStorage when project loads
  useEffect(() => {
    if (!projectId || !project) return;

    const savedData = localStorage.getItem(`veo_studio_project_${projectId}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Update project's scenes with saved data
        setProject((prevProject) => {
          if (!prevProject) return prevProject;

          return {
            ...prevProject,
            scenes: prevProject.scenes.map((scene) => {
              const savedScene = parsed.scenes.find((s: Scene) => s.id === scene.id);
              if (savedScene) {
                return {
                  ...scene,
                  generated: savedScene.generated || false,
                  settings: savedScene.settings,
                  evaluation: savedScene.evaluation,
                };
              }
              return scene;
            }),
          };
        });
      } catch (error) {
        console.error('Failed to load project data from localStorage:', error);
      }
    }
  }, [projectId]);

  // Save project to localStorage whenever it changes
  useEffect(() => {
    if (!projectId || !project) return;

    // Create a serializable version without Blob and temporary URLs
    const serializableProject = {
      id: project.id,
      scenes: project.scenes.map((scene) => ({
        id: scene.id,
        title: scene.title,
        duration: scene.duration,
        prompt: scene.prompt,
        cameraAngle: scene.cameraAngle,
        voiceover: scene.voiceover,
        generated: scene.generated,
        settings: scene.settings,
        evaluation: scene.evaluation,
      })),
    };

    localStorage.setItem(`veo_studio_project_${projectId}`, JSON.stringify(serializableProject));
  }, [project, projectId]);

  // Load videos from server when project loads
  useEffect(() => {
    if (!project) return;

    const loadVideos = async () => {
      try {
        const videos = await videoStorage.getProjectVideos(projectId);

        setProject((prevProject) => {
          if (!prevProject) return prevProject;

          return {
            ...prevProject,
            scenes: prevProject.scenes.map((scene) => {
              const url = videos.get(scene.id);
              if (url) {
                return {
                  ...scene,
                  videoUrl: url,
                  generated: true,
                };
              }
              return scene;
            }),
          };
        });
      } catch (error) {
        console.error('Failed to load videos from server:', error);
      }
    };

    loadVideos();
  }, [project?.id, projectId]);

  // Load evaluations from server when project loads
  useEffect(() => {
    if (!project) return;

    const loadEvaluations = async () => {
      try {
        const evaluations = await evaluationStorage.getProjectEvaluations(projectId);

        setProject((prevProject) => {
          if (!prevProject) return prevProject;

          return {
            ...prevProject,
            scenes: prevProject.scenes.map((scene) => {
              const evaluation = evaluations.get(scene.id);
              if (evaluation) {
                return {
                  ...scene,
                  evaluation,
                };
              }
              return scene;
            }),
          };
        });
      } catch (error) {
        console.error('Failed to load evaluations from server:', error);
      }
    };

    loadEvaluations();
  }, [project?.id, projectId]);

  // Helper to get scenes
  const scenes = project?.scenes || [];
  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  /**
   * Build a proper Veo 3.1 prompt with dialogue syntax
   * Format: visual description + dialogue with proper syntax + camera info
   */
  const buildVeoPrompt = (scene: Scene): string => {
    let prompt = scene.prompt;

    // Add voiceover as dialogue if present
    if (scene.voiceover && scene.voiceover.trim()) {
      // Veo 3.1 requires dialogue in specific format: A woman says, "dialogue here" (no subtitles)
      // Keep dialogue concise (12-25 words max for 8 second clips)
      const dialogue = scene.voiceover.trim();
      prompt += `. A woman says, "${dialogue}" (no subtitles)`;
    }

    // Add camera angle
    if (scene.cameraAngle) {
      prompt += `. ${scene.cameraAngle}`;
    }

    return prompt;
  };

  const handleCopyPrompt = async () => {
    if (!selectedScene) return;

    const veoPrompt = buildVeoPrompt(selectedScene);

    try {
      await navigator.clipboard.writeText(veoPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleGenerateScene = async (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    // Add to generating set
    setGeneratingSceneIds((prev) => new Set(prev).add(sceneId));
    setError(null);

    try {
      // Build proper prompt with dialogue syntax for Veo 3.1
      const veoPrompt = buildVeoPrompt(scene);
      console.log('Generated Veo prompt:', veoPrompt);

      // Generate video with character references and current settings
      const video = await generateVideo(
        veoPrompt,
        characterRefs.length > 0 ? characterRefs : undefined,
        currentSettings
      );

      // Save video to server for persistence and get the server URL
      let serverUrl: string;
      try {
        serverUrl = await videoStorage.saveVideo(projectId, sceneId, video.blob);
        console.log(`Saved video for scene ${sceneId} in project ${projectId} to server`);
      } catch (saveErr) {
        console.error('Failed to save video to server:', saveErr);
        // Fall back to blob URL if server save fails
        serverUrl = video.objectUrl;
      }

      setProject((prevProject) => {
        if (!prevProject) return prevProject;

        return {
          ...prevProject,
          scenes: prevProject.scenes.map((s) =>
            s.id === sceneId
              ? {
                  ...s,
                  generated: true,
                  videoUrl: serverUrl,
                  settings: currentSettings,
                  evaluation: undefined, // Clear previous evaluation
                }
              : s
          ),
        };
      });
    } catch (err) {
      console.error('Video generation failed:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate video'
      );
    } finally {
      // Remove from generating set
      setGeneratingSceneIds((prev) => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
      });
    }
  };

  const handleEvaluateScene = async (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene || !scene.videoUrl) return;

    // Add to evaluating set
    setEvaluatingSceneIds((prev) => new Set(prev).add(sceneId));
    setError(null);

    try {
      // Fetch video blob from URL
      const response = await fetch(scene.videoUrl);
      const videoBlob = await response.blob();

      const evaluation = await evaluateVideo(
        videoBlob,
        scene.duration,
        scene.prompt,
        scene.voiceover || '',
        openaiApiKey || undefined
      );

      // Save evaluation to server for persistence
      try {
        await evaluationStorage.saveEvaluation(projectId, sceneId, evaluation);
        console.log(`Saved evaluation for scene ${sceneId} in project ${projectId}`);
      } catch (saveErr) {
        console.error('Failed to save evaluation to server:', saveErr);
        // Continue even if save fails - the evaluation is still in state
      }

      // Update scene with evaluation results
      setProject((prevProject) => {
        if (!prevProject) return prevProject;

        return {
          ...prevProject,
          scenes: prevProject.scenes.map((s) =>
            s.id === sceneId ? { ...s, evaluation } : s
          ),
        };
      });
    } catch (err) {
      console.error('Video evaluation failed:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to evaluate video'
      );
    } finally {
      // Remove from evaluating set
      setEvaluatingSceneIds((prev) => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
      });
    }
  };

  const handleSaveOpenAIKey = (key: string) => {
    setOpenaiApiKey(key);
    localStorage.setItem('openai_api_key', key);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar - Fixed Header */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-6">
          {/* Back to Projects Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Projects</span>
          </button>

          {/* Project Title and Info */}
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">{project?.title}</h1>
            <div className="flex items-center gap-3 text-sm">
              {project && (
                <>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">{project.type}</span>
                  {characterRefs.length > 0 && (
                    <button
                      onClick={() => setShowRefsModal(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-xs font-medium transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{characterRefs.length} refs</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <CostTracker />
      </div>

      {/* Main Content Area - 3 Columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Scenes List (1/4) */}
        <div className="w-1/4 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">

        <div className="p-2">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              onClick={() => setSelectedSceneId(scene.id)}
              className={`w-full text-left p-3 mb-2 rounded-lg transition-all ${
                selectedSceneId === scene.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-medium text-sm">{scene.title}</span>
                </div>
                {generatingSceneIds.has(scene.id) ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                ) : scene.generated ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : null}
              </div>
              <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                {scene.prompt}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">{scene.duration}s</span>
                <span className="text-xs text-gray-600">•</span>
                <span className="text-xs text-gray-500">
                  {scene.cameraAngle}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Middle Column - Video Player (1/2) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-950">
        {selectedScene && (
          <>
            {/* Video Display Area */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
              {error && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-2 max-w-md mb-2 mx-auto">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {generatingSceneIds.has(selectedScene.id) ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg mb-2">Generating video...</p>
                    <p className="text-gray-400 text-sm">
                      This may take a few minutes
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  {selectedScene.videoUrl ? (
                    <video
                      key={selectedScene.videoUrl}
                      controls
                      autoPlay
                      loop
                      className="max-h-full max-w-full rounded-lg shadow-2xl"
                    >
                      <source src={selectedScene.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="flex flex-col items-center justify-center bg-gray-800 rounded-lg p-12">
                      <Film className="w-16 h-16 text-gray-500 mb-4" />
                      <p className="text-gray-300 text-lg font-medium">No video generated</p>
                      <p className="text-gray-500 text-sm mt-2">Use the controls on the right to generate</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Column - Scene Controls (1/4) */}
      <div className="w-1/4 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
        {selectedScene && (
          <div className="p-4 space-y-4">
            {/* Scene Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedScene.title}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                  {selectedScene.cameraAngle}
                </span>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  {selectedScene.duration}s
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 mb-3">
                {selectedScene.generated ? (
                  <span className="px-2 py-1 bg-green-50 border border-green-200 rounded text-green-700 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Generated
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs">
                    Not generated
                  </span>
                )}
                {selectedScene.evaluation && (
                  <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                    selectedScene.evaluation.overallScore >= 70
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : selectedScene.evaluation.overallScore >= 40
                      ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    <Search className="w-3 h-3" />
                    {selectedScene.evaluation.overallScore}%
                  </span>
                )}
              </div>

              {/* Prompt */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Prompt</label>
                <div className="flex items-start gap-2">
                  <p className="text-sm text-gray-600 flex-1 bg-gray-50 rounded-lg p-2">{selectedScene.prompt}</p>
                  <button
                    onClick={handleCopyPrompt}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
                    title="Copy full prompt"
                  >
                    {copiedPrompt ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Voiceover */}
              {selectedScene.voiceover && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Voiceover</label>
                  <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-900 italic">&ldquo;{selectedScene.voiceover}&rdquo;</p>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                showSettings ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              {showSettings ? 'Hide Settings' : 'Show Settings'}
            </button>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Generation Settings</h4>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Model</label>
                  <select
                    value={currentSettings.model}
                    onChange={(e) => setCurrentSettings({ ...currentSettings, model: e.target.value as VeoModel })}
                    className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-900"
                  >
                    <option value={VeoModel.VEO}>Veo 3.1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Aspect Ratio</label>
                  <select
                    value={currentSettings.aspectRatio}
                    onChange={(e) => setCurrentSettings({ ...currentSettings, aspectRatio: e.target.value as AspectRatio })}
                    className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-900"
                  >
                    <option value={AspectRatio.LANDSCAPE}>16:9 Landscape</option>
                    <option value={AspectRatio.PORTRAIT}>9:16 Portrait</option>
                    <option value={AspectRatio.SQUARE}>1:1 Square</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Resolution</label>
                  <select
                    value={currentSettings.resolution}
                    onChange={(e) => setCurrentSettings({ ...currentSettings, resolution: e.target.value as Resolution })}
                    className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-900"
                  >
                    <option value={Resolution.P720}>720p</option>
                    <option value={Resolution.P1080}>1080p</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="looping"
                    checked={currentSettings.isLooping}
                    onChange={(e) => setCurrentSettings({ ...currentSettings, isLooping: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="looping" className="text-sm text-gray-700">Enable looping</label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleGenerateScene(selectedScene.id)}
                disabled={characterRefs.length === 0 || generatingSceneIds.has(selectedScene.id)}
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                {selectedScene.generated ? 'Regenerate Video' : 'Generate Video'}
              </button>

              {selectedScene.videoUrl && (
                <button
                  onClick={() => handleEvaluateScene(selectedScene.id)}
                  disabled={evaluatingSceneIds.has(selectedScene.id)}
                  className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {evaluatingSceneIds.has(selectedScene.id) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Evaluate Video
                    </>
                  )}
                </button>
              )}
            </div>

            {/* OpenAI API Key Input */}
            {!openaiApiKey && selectedScene.generated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Optional: Add OpenAI API key for audio transcription
                </p>
                <input
                  type="password"
                  placeholder="sk-..."
                  className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-900"
                  onBlur={(e) => handleSaveOpenAIKey(e.target.value)}
                />
              </div>
            )}

            {/* Evaluation Results */}
            {selectedScene.evaluation && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Evaluation Results
                </h4>

                {/* Overall Score */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Overall Score</span>
                    <span className={`text-xl font-bold ${
                      selectedScene.evaluation.overallScore >= 70
                        ? 'text-green-600'
                        : selectedScene.evaluation.overallScore >= 40
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {selectedScene.evaluation.overallScore}%
                    </span>
                  </div>
                </div>

                {/* Audio Score */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-xs font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    Audio ({selectedScene.evaluation.audioEvaluation.score}%)
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-gray-500">Expected:</span>
                      <p className="text-gray-700 italic mt-0.5">&ldquo;{selectedScene.evaluation.audioEvaluation.expectedText}&rdquo;</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Transcribed:</span>
                      <p className="text-gray-700 mt-0.5">{selectedScene.evaluation.audioEvaluation.transcribedText}</p>
                    </div>
                  </div>
                </div>

                {/* Frame Scores */}
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-xs font-medium text-gray-900 mb-2">
                      First Frame ({selectedScene.evaluation.firstFrameEvaluation.score}%)
                    </h5>
                    <img
                      src={selectedScene.evaluation.firstFrameEvaluation.imageUrl}
                      alt="First frame"
                      className="w-full rounded mb-2"
                    />
                    <p className="text-xs text-gray-600">
                      {selectedScene.evaluation.firstFrameEvaluation.analysis}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-xs font-medium text-gray-900 mb-2">
                      Last Frame ({selectedScene.evaluation.lastFrameEvaluation.score}%)
                    </h5>
                    <img
                      src={selectedScene.evaluation.lastFrameEvaluation.imageUrl}
                      alt="Last frame"
                      className="w-full rounded mb-2"
                    />
                    <p className="text-xs text-gray-600">
                      {selectedScene.evaluation.lastFrameEvaluation.analysis}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Reference Images Modal */}
      {showRefsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-green-400" />
                Character Reference Images
              </h2>
              <button
                onClick={() => setShowRefsModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characterRefs.map((ref, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={ref.objectUrl}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white font-medium">
                      Ref {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              {characterRefs.length === 0 && (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No reference images found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SceneManager;
