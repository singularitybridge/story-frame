/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { AssetType, Asset } from '@/types/asset';

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
 * POST - Upload an external image file as an asset
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const type = formData.get('type') as AssetType;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!file || !projectId || !type || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: file, projectId, type, name' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique asset ID
    const assetId = `asset-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create directory structure: /public/assets/{projectId}/{type}/
    const assetDir = join(ASSETS_DIR, projectId, type);
    if (!existsSync(assetDir)) {
      await mkdir(assetDir, { recursive: true });
    }

    // Save image file
    const extension = file.name.split('.').pop() || 'png';
    const imagePath = join(assetDir, `${assetId}.${extension}`);
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(imagePath, imageBuffer);

    // Generate URLs
    const imageUrl = `/assets/${projectId}/${type}/${assetId}.${extension}`;
    const thumbnailUrl = imageUrl; // Use same URL for now

    // Load existing assets
    const assets = await loadAssets(projectId);

    // Create new asset with metadata
    const newAsset: Asset = {
      id: assetId,
      projectId,
      type,
      name,
      description: description || '',
      aspectRatio: '16:9', // Default, can be detected from image
      imageUrl,
      thumbnailUrl,
      generationPrompt: '', // Not AI-generated
      provider: 'upload', // Mark as uploaded
      tags: [],
      editHistory: [],
      relatedAssets: [],
      usedInScenes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to assets and save
    assets.push(newAsset);
    await saveAssets(projectId, assets);

    return NextResponse.json(newAsset);
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    );
  }
}
