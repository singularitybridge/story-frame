/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project } from '../types/project';

class ProjectStorageServer {
  /**
   * Save project data to server
   */
  async saveProject(project: Project): Promise<void> {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      throw new Error('Failed to save project');
    }
  }

  /**
   * Get a specific project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    const response = await fetch(`/api/projects?projectId=${projectId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to get project');
    }

    const data = await response.json();
    return data.project;
  }

  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    const response = await fetch('/api/projects');

    if (!response.ok) {
      throw new Error('Failed to get projects');
    }

    const data = await response.json();
    return data.projects || [];
  }
}

export const projectStorage = new ProjectStorageServer();
