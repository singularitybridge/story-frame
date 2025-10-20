/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class VideoStorageServer {
  async saveVideo(projectId: string, sceneId: string, blob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('sceneId', sceneId);
    formData.append('video', blob, `${sceneId}.mp4`);

    const response = await fetch('/api/videos', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to save video');
    }

    const data = await response.json();
    return data.url;
  }

  async getProjectVideos(projectId: string): Promise<Map<string, string>> {
    const response = await fetch(`/api/videos?projectId=${projectId}`);

    if (!response.ok) {
      throw new Error('Failed to get videos');
    }

    const data = await response.json();
    const map = new Map<string, string>();

    Object.entries(data.videos || {}).forEach(([sceneId, url]) => {
      map.set(sceneId, url as string);
    });

    return map;
  }

  async deleteVideo(projectId: string, sceneId: string): Promise<void> {
    const response = await fetch(
      `/api/videos?projectId=${projectId}&sceneId=${sceneId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete video');
    }
  }
}

export const videoStorage = new VideoStorageServer();
