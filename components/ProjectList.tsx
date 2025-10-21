/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Video as VideoIcon, Package, Sparkles, Clock, User } from 'lucide-react';
import { Project } from '../types/project';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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
        setProjects(data.projects || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

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
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black" />
          <p className="text-gray-600 text-sm">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-black rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">StoryFrame</h1>
              <p className="text-sm text-gray-600">AI-powered video storytelling</p>
            </div>
          </div>
        </div>
      </header>

      {/* Project Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Projects</h2>
          <p className="text-sm text-gray-600">Select a project to continue working on it</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-lg cursor-pointer transition-all group"
            >
              {/* Icon and Type Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg text-gray-700 group-hover:bg-black group-hover:text-white transition-all">
                  {getProjectIcon(project.type)}
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${getProjectTypeBadge(
                    project.type
                  )}`}
                >
                  {project.type}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
                {project.title}
              </h3>

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
                    <span className="truncate">{project.character}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Film className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg">No projects found</p>
            <p className="text-gray-500 text-sm mt-1">Create your first project to get started</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectList;
