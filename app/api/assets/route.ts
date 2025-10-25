/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { Asset, AssetLibraryResponse, AssetFilters } from '@/types/asset';

const ASSETS_DIR = join(process.cwd(), 'public', 'assets');
const ASSETS_METADATA_DIR = join(process.cwd(), 'data', 'assets');

/**
 * Get the path to the assets metadata file for a project
 */
function getMetadataPath(projectId: string): string {
  return join(ASSETS_METADATA_DIR, `${projectId}.json`);
}

/**
 * Load assets metadata for a project
 */
async function loadAssets(projectId: string): Promise<Asset[]> {
  const metadataPath = getMetadataPath(projectId);

  if (!existsSync(metadataPath)) {
    return [];
  }

  const data = await readFile(metadataPath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Save assets metadata for a project
 */
async function saveAssets(projectId: string, assets: Asset[]): Promise<void> {
  const metadataPath = getMetadataPath(projectId);

  // Ensure metadata directory exists
  if (!existsSync(ASSETS_METADATA_DIR)) {
    await mkdir(ASSETS_METADATA_DIR, { recursive: true });
  }

  await writeFile(metadataPath, JSON.stringify(assets, null, 2), 'utf-8');
}

/**
 * Filter and sort assets based on query parameters
 */
function filterAndSortAssets(
  assets: Asset[],
  filters?: AssetFilters,
  sortBy: string = 'createdAt',
  order: string = 'desc'
): Asset[] {
  let filtered = [...assets];

  // Apply filters
  if (filters) {
    if (filters.type) {
      filtered = filtered.filter(a => a.type === filters.type);
    }
    if (filters.category) {
      filtered = filtered.filter(a => a.category === filters.category);
    }
    if (filters.provider) {
      filtered = filtered.filter(a => a.provider === filters.provider);
    }
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(a =>
        filters.tags!.some(tag => a.tags.includes(tag))
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(searchLower) ||
        a.description.toLowerCase().includes(searchLower)
      );
    }
    if (filters.usedInScene) {
      filtered = filtered.filter(a => a.usedInScenes.includes(filters.usedInScene!));
    }
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortBy) {
      case 'createdAt':
      case 'updatedAt':
        aVal = new Date(a[sortBy]).getTime();
        bVal = new Date(b[sortBy]).getTime();
        break;
      case 'name':
      case 'type':
        aVal = a[sortBy];
        bVal = b[sortBy];
        break;
      case 'usedCount':
        aVal = a.usedInScenes.length;
        bVal = b.usedInScenes.length;
        break;
      default:
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
    }

    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return filtered;
}

/**
 * GET - List assets for a project
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Load all assets
    const assets = await loadAssets(projectId);

    // Parse filters
    const filters: AssetFilters = {
      type: searchParams.get('type') as any,
      category: searchParams.get('category') || undefined,
      provider: searchParams.get('provider') as any,
      search: searchParams.get('search') || undefined,
      usedInScene: searchParams.get('usedInScene') || undefined,
      tags: searchParams.getAll('tags'),
    };

    // Parse sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Filter and sort
    const filtered = filterAndSortAssets(assets, filters, sortBy, order);

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    // Calculate summary
    const summary = {
      totalAssets: assets.length,
      byType: {
        character: assets.filter(a => a.type === 'character').length,
        prop: assets.filter(a => a.type === 'prop').length,
        location: assets.filter(a => a.type === 'location').length,
      },
      byProvider: assets.reduce((acc, asset) => {
        acc[asset.provider] = (acc[asset.provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    const response: AssetLibraryResponse = {
      assets: paginated,
      pagination: {
        page,
        pageSize,
        total: filtered.length,
      },
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting assets:', error);
    return NextResponse.json(
      { error: 'Failed to get assets' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new asset
 */
export async function POST(request: NextRequest) {
  try {
    const asset = await request.json() as Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>;

    if (!asset.projectId || !asset.type || !asset.name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, type, name' },
        { status: 400 }
      );
    }

    // Load existing assets
    const assets = await loadAssets(asset.projectId);

    // Create new asset with metadata
    const newAsset: Asset = {
      ...asset,
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: asset.tags || [],
      editHistory: asset.editHistory || [],
      relatedAssets: asset.relatedAssets || [],
      usedInScenes: asset.usedInScenes || [],
    };

    // Add to collection
    assets.push(newAsset);

    // Save metadata
    await saveAssets(asset.projectId, assets);

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}
