/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { AspectRatio } from '../types';

/**
 * Asset types for visual elements in the project
 */
export type AssetType = 'character' | 'prop' | 'location';

/**
 * AI providers that can generate or edit assets
 */
export type AssetProvider = 'gemini' | 'openai' | 'fal' | 'replicate' | 'uploaded';

/**
 * Asset generation/edit status
 */
export type AssetStatus = 'generating' | 'complete' | 'error' | 'processing';

/**
 * Role of asset when placed in a scene
 */
export type AssetRole = 'character' | 'background' | 'prop';

/**
 * History entry for asset edits
 */
export interface AssetEdit {
  id: string;
  prompt: string;
  provider: AssetProvider;
  model: string;
  timestamp: Date;
  previousVersionId: string;
  imageUrl: string;
}

/**
 * Main asset entity
 */
export interface Asset {
  id: string;
  projectId: string;
  type: AssetType;
  category?: string; // User-defined category (e.g., "Animals", "Furniture", "Outdoor Locations")
  tags: string[]; // Searchable tags

  // Display info
  name: string;
  description: string;

  // Image properties
  aspectRatio: AspectRatio;
  imageUrl: string;
  thumbnailUrl: string;

  // Generation metadata
  generationPrompt?: string;
  provider: AssetProvider;
  model?: string;

  // Editing and versioning
  originalAssetId?: string; // If this is an edited version
  editHistory: AssetEdit[];

  // Relationships
  relatedAssets: string[]; // IDs of related assets
  usedInScenes: string[]; // Scene IDs where this asset is used

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scene-Asset relationship (many-to-many)
 */
export interface SceneAsset {
  sceneId: string;
  assetId: string;
  role: AssetRole;
  order: number; // Display order (0, 1, 2 for 3-slot system)
}

/**
 * Asset generation batch for multi-select workflow
 */
export interface AssetGenerationBatch {
  id: string;
  projectId: string;
  type: AssetType;
  prompt: string;
  aspectRatio: AspectRatio;
  provider: AssetProvider;
  model: string;
  count: number; // Number of variations to generate
  options: Asset[]; // Generated options
  selected: string[]; // IDs of selected assets to save
  status: AssetStatus;
  error?: string;
  createdAt: Date;
}

/**
 * Asset generation request
 */
export interface AssetGenerationRequest {
  projectId: string;
  type: AssetType;
  prompt: string;
  aspectRatio: AspectRatio;
  provider: AssetProvider;
  model?: string;
  count?: number; // How many variations (default: 3)
  category?: string;
  tags?: string[];
}

/**
 * Asset edit request
 */
export interface AssetEditRequest {
  assetId: string;
  editPrompt: string;
  provider: AssetProvider;
  model?: string;
  saveAsNew?: boolean; // If true, creates new asset; if false, updates existing
}

/**
 * Asset upload metadata
 */
export interface AssetUploadMetadata {
  projectId: string;
  type: AssetType;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  aspectRatio: AspectRatio;
}

/**
 * Asset filter options for library view
 */
export interface AssetFilters {
  type?: AssetType;
  category?: string;
  tags?: string[];
  provider?: AssetProvider;
  search?: string; // Search in name/description
  usedInScene?: string; // Filter by scene ID
}

/**
 * Asset library sort options
 */
export type AssetSortBy = 'createdAt' | 'updatedAt' | 'name' | 'type' | 'usedCount';
export type AssetSortOrder = 'asc' | 'desc';

export interface AssetSortOptions {
  sortBy: AssetSortBy;
  order: AssetSortOrder;
}

/**
 * Asset library pagination
 */
export interface AssetPagination {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Complete asset library query
 */
export interface AssetLibraryQuery {
  projectId: string;
  filters?: AssetFilters;
  sort?: AssetSortOptions;
  pagination?: Partial<AssetPagination>;
}

/**
 * Asset library response
 */
export interface AssetLibraryResponse {
  assets: Asset[];
  pagination: AssetPagination;
  summary: {
    totalAssets: number;
    byType: Record<AssetType, number>;
    byProvider: Record<AssetProvider, number>;
  };
}
