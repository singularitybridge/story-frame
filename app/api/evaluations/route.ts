/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink, readdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const EVALUATIONS_DIR = join(process.cwd(), 'public', 'evaluations');

// POST - Save evaluation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, sceneId, evaluation } = body;

    if (!projectId || !sceneId || !evaluation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create project directory if it doesn't exist
    const projectDir = join(EVALUATIONS_DIR, projectId);
    if (!existsSync(projectDir)) {
      await mkdir(projectDir, { recursive: true });
    }

    // Save evaluation as JSON
    const filename = `${sceneId}.json`;
    const filepath = join(projectDir, filename);

    await writeFile(filepath, JSON.stringify(evaluation, null, 2));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error saving evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to save evaluation' },
      { status: 500 }
    );
  }
}

// GET - Get evaluations for a project
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

    const projectDir = join(EVALUATIONS_DIR, projectId);

    if (!existsSync(projectDir)) {
      return NextResponse.json({ evaluations: {} });
    }

    const files = await readdir(projectDir);
    const evaluations: Record<string, any> = {};

    for (const file of files) {
      if (file.endsWith('.json')) {
        const sceneId = file.replace('.json', '');
        const filepath = join(projectDir, file);
        const content = await readFile(filepath, 'utf-8');
        evaluations[sceneId] = JSON.parse(content);
      }
    }

    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error('Error getting evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to get evaluations' },
      { status: 500 }
    );
  }
}

// DELETE - Delete evaluation
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const sceneId = searchParams.get('sceneId');

    if (!projectId || !sceneId) {
      return NextResponse.json(
        { error: 'projectId and sceneId are required' },
        { status: 400 }
      );
    }

    const filepath = join(EVALUATIONS_DIR, projectId, `${sceneId}.json`);

    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to delete evaluation' },
      { status: 500 }
    );
  }
}
