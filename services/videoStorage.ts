/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'veo_studio';
const DB_VERSION = 1;
const VIDEO_STORE = 'videos';

interface StoredVideo {
  sceneId: string;
  projectId: string;
  blob: Blob;
  timestamp: number;
}

class VideoStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(VIDEO_STORE)) {
          db.createObjectStore(VIDEO_STORE, { keyPath: 'sceneId' });
        }
      };
    });
  }

  async saveVideo(projectId: string, sceneId: string, blob: Blob): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([VIDEO_STORE], 'readwrite');
      const store = transaction.objectStore(VIDEO_STORE);
      const compositeKey = `${projectId}:${sceneId}`;
      const video: StoredVideo = {
        sceneId: compositeKey,
        projectId,
        blob,
        timestamp: Date.now(),
      };

      const request = store.put(video);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getVideo(projectId: string, sceneId: string): Promise<Blob | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([VIDEO_STORE], 'readonly');
      const store = transaction.objectStore(VIDEO_STORE);
      const compositeKey = `${projectId}:${sceneId}`;
      const request = store.get(compositeKey);

      request.onsuccess = () => {
        const result = request.result as StoredVideo | undefined;
        resolve(result?.blob || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteVideo(projectId: string, sceneId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([VIDEO_STORE], 'readwrite');
      const store = transaction.objectStore(VIDEO_STORE);
      const compositeKey = `${projectId}:${sceneId}`;
      const request = store.delete(compositeKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProjectVideos(projectId: string): Promise<Map<string, Blob>> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([VIDEO_STORE], 'readonly');
      const store = transaction.objectStore(VIDEO_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const videos = request.result as StoredVideo[];
        const map = new Map<string, Blob>();
        videos.forEach(v => {
          // Only include videos from this project
          if (v.projectId === projectId) {
            // Extract the scene ID from the composite key
            const sceneId = v.sceneId.split(':')[1] || v.sceneId;
            map.set(sceneId, v.blob);
          }
        });
        resolve(map);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllVideos(): Promise<Map<string, Blob>> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([VIDEO_STORE], 'readonly');
      const store = transaction.objectStore(VIDEO_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const videos = request.result as StoredVideo[];
        const map = new Map<string, Blob>();
        videos.forEach(v => {
          // Extract the scene ID from the composite key
          const sceneId = v.sceneId.split(':')[1] || v.sceneId;
          map.set(sceneId, v.blob);
        });
        resolve(map);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const videoStorage = new VideoStorage();
