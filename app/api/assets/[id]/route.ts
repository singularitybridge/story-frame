/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { Asset } from '@/types/asset';

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
  await writeFile(metadataPath, JSON.stringify(assets, null, 2), 'utf-8');
}

/**
 * Find asset and project by asset ID (searches all projects)
 */
async function findAsset(assetId: string): Promise<{ asset: Asset; projectId: string } | null> {
  // We need to search through all project metadata files
  // For now, we'll require projectId in query params
  // TODO: Implement project registry or index for faster lookups
  return null;
}

/**
 * GET - Get a single asset by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const assets = await loadAssets(projectId);
    const asset = assets.find(a => a.id === assetId);

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error getting asset:', error);
    return NextResponse.json(
      { error: 'Failed to get asset' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update asset metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;
    const updates = await request.json();
    const projectId = updates.projectId;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required in request body' },
        { status: 400 }
      );
    }

    const assets = await loadAssets(projectId);
    const assetIndex = assets.findIndex(a => a.id === assetId);

    if (assetIndex === -1) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Update asset
    const updatedAsset: Asset = {
      ...assets[assetIndex],
      ...updates,
      id: assetId, // Preserve ID
      projectId, // Preserve projectId
      createdAt: assets[assetIndex].createdAt, // Preserve creation time
      updatedAt: new Date(), // Update modification time
    };

    assets[assetIndex] = updatedAsset;

    // Save updated assets
    await saveAssets(projectId, assets);

    return NextResponse.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete an asset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const assets = await loadAssets(projectId);
    const assetIndex = assets.findIndex(a => a.id === assetId);

    if (assetIndex === -1) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    const asset = assets[assetIndex];

    // Delete image file if it exists
    const assetDir = join(ASSETS_DIR, projectId, asset.type);
    const imagePath = join(assetDir, `${assetId}.png`);

    if (existsSync(imagePath)) {
      await unlink(imagePath);
    }

    // Delete thumbnail if it exists
    const thumbnailPath = join(assetDir, `${assetId}-thumb.png`);
    if (existsSync(thumbnailPath)) {
      await unlink(thumbnailPath);
    }

    // Remove from metadata
    assets.splice(assetIndex, 1);

    // Save updated assets
    await saveAssets(projectId, assets);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
