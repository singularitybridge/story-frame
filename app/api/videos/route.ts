/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink, readdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const VIDEOS_DIR = join(process.cwd(), 'public', 'videos');

// POST - Save video
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectId = formData.get('projectId') as string;
    const sceneId = formData.get('sceneId') as string;
    const videoBlob = formData.get('video') as Blob;

    if (!projectId || !sceneId || !videoBlob) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create project directory if it doesn't exist
    const projectDir = join(VIDEOS_DIR, projectId);
    if (!existsSync(projectDir)) {
      await mkdir(projectDir, { recursive: true });
    }

    // Save video file
    const buffer = Buffer.from(await videoBlob.arrayBuffer());
    const filename = `${sceneId}.mp4`;
    const filepath = join(projectDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      url: `/videos/${projectId}/${filename}`,
    });
  } catch (error) {
    console.error('Error saving video:', error);
    return NextResponse.json(
      { error: 'Failed to save video' },
      { status: 500 }
    );
  }
}

// GET - Get videos for a project
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

    const projectDir = join(VIDEOS_DIR, projectId);

    if (!existsSync(projectDir)) {
      return NextResponse.json({ videos: {} });
    }

    const files = await readdir(projectDir);
    const videos: Record<string, string> = {};

    for (const file of files) {
      if (file.endsWith('.mp4')) {
        const sceneId = file.replace('.mp4', '');
        videos[sceneId] = `/videos/${projectId}/${file}`;
      }
    }

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error getting videos:', error);
    return NextResponse.json(
      { error: 'Failed to get videos' },
      { status: 500 }
    );
  }
}

// DELETE - Delete video
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

    const filepath = join(VIDEOS_DIR, projectId, `${sceneId}.mp4`);

    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
