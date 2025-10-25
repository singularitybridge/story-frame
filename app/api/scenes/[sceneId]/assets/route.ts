/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from 'next/server';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'path';
import type { Project, Scene, SceneAssetAttachment } from '@/types/project';

// Database structure
interface Database {
  projects: Record<string, Project>;
}

const DATA_DIR = join(process.cwd(), 'data');
const DB_FILE = join(DATA_DIR, 'projects.db.json');

// Initialize lowdb
const adapter = new JSONFile<Database>(DB_FILE);
const defaultData: Database = { projects: {} };
const db = new Low(adapter, defaultData);

/**
 * Find which project contains the given scene ID
 */
async function findProjectBySceneId(sceneId: string, origin: string): Promise<{ project: Project; projectId: string } | null> {
  try {
    // Read current database
    await db.read();

    // Check runtime database first
    for (const [projectId, project] of Object.entries(db.data.projects)) {
      const sceneExists = project.scenes.some((scene) => scene.id === sceneId);
      if (sceneExists) {
        return { project, projectId };
      }
    }

    // Fall back to seed data
    try {
      const response = await fetch(`${origin}/data/projects.json`);
      if (response.ok) {
        const projectsIndex = await response.json();

        for (const projectRef of projectsIndex.projects) {
          const seedResponse = await fetch(`${origin}/data/${projectRef.file}`);
          if (seedResponse.ok) {
            const seedProject = await seedResponse.json();
            const sceneExists = seedProject.scenes.some((scene: Scene) => scene.id === sceneId);
            if (sceneExists) {
              return { project: seedProject, projectId: projectRef.id };
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load seed data:', err);
    }

    return null;
  } catch (error) {
    console.error('Error finding project by scene ID:', error);
    return null;
  }
}

/**
 * GET /api/scenes/[sceneId]/assets
 * Get attached assets for a scene
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;

    // Find the project containing this scene
    const result = await findProjectBySceneId(sceneId, request.nextUrl.origin);
    if (!result) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Find the scene
    const scene = result.project.scenes.find((s) => s.id === sceneId);
    if (!scene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Return the attached assets
    return NextResponse.json({
      sceneId: scene.id,
      attachedAssets: scene.attachedAssets || [],
    });
  } catch (error) {
    console.error('Error getting scene assets:', error);
    return NextResponse.json(
      { error: 'Failed to get scene assets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenes/[sceneId]/assets
 * Update attached assets for a scene
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const body = await request.json();
    const { attachments } = body as { attachments: SceneAssetAttachment[] };

    if (!Array.isArray(attachments)) {
      return NextResponse.json(
        { error: 'Invalid attachments data' },
        { status: 400 }
      );
    }

    // Find the project containing this scene
    const result = await findProjectBySceneId(sceneId, request.nextUrl.origin);
    if (!result) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    const { project, projectId } = result;

    // Find and update the scene
    const sceneIndex = project.scenes.findIndex((s) => s.id === sceneId);
    if (sceneIndex === -1) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Update the scene's attached assets
    project.scenes[sceneIndex] = {
      ...project.scenes[sceneIndex],
      attachedAssets: attachments,
    };

    // Update the project's updatedAt timestamp
    project.updatedAt = Date.now();

    // Save to database
    await db.read();
    db.data.projects[projectId] = project;
    await db.write();

    return NextResponse.json({
      success: true,
      sceneId,
      attachedAssets: attachments,
    });
  } catch (error) {
    console.error('Error updating scene assets:', error);
    return NextResponse.json(
      { error: 'Failed to update scene assets' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scenes/[sceneId]/assets/[assetId]
 * Remove a specific asset attachment from a scene
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    // Find the project containing this scene
    const result = await findProjectBySceneId(sceneId, request.nextUrl.origin);
    if (!result) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    const { project, projectId } = result;

    // Find and update the scene
    const sceneIndex = project.scenes.findIndex((s) => s.id === sceneId);
    if (sceneIndex === -1) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    const scene = project.scenes[sceneIndex];
    if (!scene.attachedAssets || scene.attachedAssets.length === 0) {
      return NextResponse.json(
        { error: 'No assets attached to this scene' },
        { status: 404 }
      );
    }

    // Remove the asset and update order values
    const updatedAttachments = scene.attachedAssets
      .filter((a) => a.assetId !== assetId)
      .map((a, index) => ({ ...a, order: index }));

    // Update the scene
    project.scenes[sceneIndex] = {
      ...scene,
      attachedAssets: updatedAttachments,
    };

    // Update the project's updatedAt timestamp
    project.updatedAt = Date.now();

    // Save to database
    await db.read();
    db.data.projects[projectId] = project;
    await db.write();

    return NextResponse.json({
      success: true,
      sceneId,
      attachedAssets: updatedAttachments,
    });
  } catch (error) {
    console.error('Error deleting scene asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete scene asset' },
      { status: 500 }
    );
  }
}
