/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Video as VideoIcon, Package, Plus, User } from 'lucide-react';
import { Project } from '../types/project';
import { StoryDraft } from '../types/story-creation';
import CreateStoryModal from './CreateStoryModal';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Fetch all projects from API (merges runtime db + seed data)
        const response = await fetch('/api/projects');
        if (!response.ok) {
          console.error('Failed to load projects');
          setLoading(false);
          return;
        }

        const data = await response.json();
        const loadedProjects = data.projects || [];
        setProjects(loadedProjects);

        // Load thumbnails for each project
        await loadProjectThumbnails(loadedProjects);

        setLoading(false);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const loadProjectThumbnails = async (projects: Project[]) => {
    const thumbnailMap: Record<string, string> = {};

    for (const project of projects) {
      // Determine which reference image to use based on aspect ratio
      const isPortrait = project.aspectRatio === '9:16';
      const refPath = isPortrait
        ? `/generated-refs/${project.id}/character-ref-portrait-1.png`
        : `/generated-refs/${project.id}/character-ref-1.png`;

      // Check if the reference image exists
      try {
        const response = await fetch(refPath, { method: 'HEAD' });
        if (response.ok) {
          thumbnailMap[project.id] = refPath;
        }
      } catch (err) {
        // Thumbnail doesn't exist, will use fallback
      }
    }

    setThumbnails(thumbnailMap);
  };

  const handleStoryCreated = async (story: StoryDraft) => {
    setShowCreateModal(false);
    setIsCreatingProject(true);

    try {
      // Step 1: Generate character reference images
      console.log('Generating character references for:', story.projectMetadata.character);

      const refResponse = await fetch('/api/generate-character-refs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: `generated-${Date.now()}`,
          characterDescription: story.projectMetadata.character,
          aspectRatio: story.projectMetadata.aspectRatio,
        }),
      });

      if (!refResponse.ok) {
        throw new Error('Failed to generate character references');
      }

      const refData = await refResponse.json();
      const projectId = refData.projectId;

      // Step 2: Create project from story draft
      console.log('Creating project from story draft...');

      const project: Project = {
        ...story.projectMetadata,
        id: projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scenes: story.scenes,
        generationMetadata: story.generationMetadata, // Preserve generation metadata
      };

      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      console.log('Project created successfully:', projectId);

      // Step 3: Navigate to the new project
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error creating project from story:', error);
      alert('Failed to create project. Please try again.');
      setIsCreatingProject(false);
    }
  };

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return <Film className="w-8 h-8" />;
      case 'short':
        return <VideoIcon className="w-8 h-8" />;
      case 'commercial':
        return <Package className="w-8 h-8" />;
      default:
        return <Film className="w-8 h-8" />;
    }
  };

  const getProjectTypeBadge = (type: string) => {
    const colors = {
      movie: 'bg-purple-100 text-purple-700',
      short: 'bg-blue-100 text-blue-700',
      commercial: 'bg-green-100 text-green-700',
    };
    return colors[type as keyof typeof colors] || colors.movie;
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-purple-600" />
          <p className="text-gray-600 text-sm">Loading stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start gap-3">
              <img
                src="/logo.png"
                alt="Echo"
                className="h-8 w-auto object-contain"
              />
              <p className="text-sm text-gray-600">Your story, elevated</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all hover:scale-105 cursor-pointer"
              title="Create New Story"
              aria-label="Create New Story"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Project Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stories Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Stories</h2>
          <p className="text-sm text-gray-600">Select a story to continue working on it</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const thumbnail = thumbnails[project.id];
            const hasPortraitThumbnail = project.aspectRatio === '9:16' && thumbnail;

            return (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 hover:shadow-xl cursor-pointer transition-all group"
              >
                {/* Thumbnail Section */}
                <div className="relative w-full bg-gray-100">
                  {thumbnail ? (
                    <div
                      className={`relative w-full ${
                        hasPortraitThumbnail ? 'aspect-[9/16]' : 'aspect-[16/9]'
                      } overflow-hidden`}
                    >
                      <img
                        src={thumbnail}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Gradient overlay for better text contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Type badge overlay */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm ${getProjectTypeBadge(
                            project.type
                          )} bg-opacity-90`}
                        >
                          {project.type}
                        </span>
                      </div>

                      {/* Title overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-semibold text-white mb-1 drop-shadow-lg">
                          {project.title}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    // Fallback when no thumbnail exists
                    <div className="relative w-full aspect-[3/2] bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="p-4 bg-white rounded-xl mb-3 inline-block shadow-sm">
                          {getProjectIcon(project.type)}
                        </div>
                      </div>
                      {/* Type badge overlay */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getProjectTypeBadge(
                            project.type
                          )}`}
                        >
                          {project.type}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5">
                  {/* Title (only show if no thumbnail) */}
                  {!thumbnail && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
                      {project.title}
                    </h3>
                  )}

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <VideoIcon className="w-3.5 h-3.5" />
                      <span>{project.scenes.length} scenes</span>
                    </div>
                    {project.character && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">
                          {typeof project.character === 'string'
                            ? project.character
                            : project.character.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Film className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg">No stories found</p>
            <p className="text-gray-500 text-sm mt-1">Create your first story to get started</p>
          </div>
        )}
      </main>

      {/* Story Creation Modal */}
      <CreateStoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* Creating Story Loading Overlay */}
      {isCreatingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-indigo-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Creating Your Story
                </h3>
                <p className="text-sm text-gray-600">
                  Generating character references and setting up your story...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
