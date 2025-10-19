/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Video as VideoIcon, Package } from 'lucide-react';
import projectsIndex from '../data/projects.json';
import { Project } from '../types/project';

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      const loadedProjects: Project[] = [];

      for (const projectRef of projectsIndex.projects) {
        try {
          const response = await fetch(`/data/${projectRef.file}`);
          if (response.ok) {
            const projectData = await response.json();
            loadedProjects.push(projectData as Project);
          }
        } catch (err) {
          console.error(`Failed to load project ${projectRef.id}:`, err);
        }
      }

      setProjects(loadedProjects);
      setLoading(false);
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
      movie: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      short: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      commercial: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[type as keyof typeof colors] || colors.movie;
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-white">Veo Studio</h1>
          <p className="text-gray-400 mt-1">Select a project to get started</p>
        </div>
      </header>

      {/* Project Grid */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-all group"
            >
              {/* Icon and Type Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-800 rounded-lg text-gray-400 group-hover:text-white group-hover:bg-gray-700 transition-colors">
                  {getProjectIcon(project.type)}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getProjectTypeBadge(
                    project.type
                  )}`}
                >
                  {project.type}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {project.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {project.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{project.scenes.length} scenes</span>
                {project.character && (
                  <span className="truncate">• {project.character}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No projects found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectList;
