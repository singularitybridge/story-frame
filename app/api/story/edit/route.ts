/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {NextRequest, NextResponse} from 'next/server';
import {editScript} from '../../../../services/scriptEditingAgent';
import {generateReview} from '../../../../services/reviewAgent';
import {StoryDraft} from '../../../../types/story-creation';

/**
 * POST /api/story/edit
 * Single-shot story editing endpoint using dual-agent system
 * - Script Editing Agent: Modifies the story based on user request
 * - Review Agent: Generates user-friendly response describing changes
 *
 * Request body:
 * {
 *   storyDraft: StoryDraft,
 *   editRequest: string
 * }
 *
 * Response:
 * {
 *   updatedStory: StoryDraft,
 *   response: string,
 *   changesSummary: {
 *     scenesAdded: number,
 *     scenesRemoved: number,
 *     scenesModified: number,
 *     titleChanged: boolean
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Story Edit API] Request received');

    const {storyDraft, editRequest} = body;

    // Validate inputs
    if (!storyDraft || !storyDraft.projectMetadata || !storyDraft.scenes) {
      console.log('[Story Edit API] Validation failed - invalid story draft');
      return NextResponse.json(
        {error: 'Invalid or missing story draft'},
        {status: 400},
      );
    }

    if (!editRequest || typeof editRequest !== 'string' || editRequest.trim().length === 0) {
      console.log('[Story Edit API] Validation failed - invalid edit request');
      return NextResponse.json(
        {error: 'Invalid or missing edit request'},
        {status: 400},
      );
    }

    const originalStory: StoryDraft = storyDraft;
    const action = editRequest.trim();

    console.log('[Story Edit API] Edit request:', action);

    // Step 1: Script Editing Agent - Modify the story
    console.log('[Story Edit API] Calling Script Editing Agent...');
    const refinedStory = await editScript(originalStory, action);

    // Step 2: Review Agent - Generate user-friendly response
    console.log('[Story Edit API] Calling Review Agent...');
    const reviewResult = await generateReview(originalStory, refinedStory, action);

    console.log('[Story Edit API] Edit complete:', {
      scenesAdded: reviewResult.changesSummary.scenesAdded,
      scenesRemoved: reviewResult.changesSummary.scenesRemoved,
      scenesModified: reviewResult.changesSummary.scenesModified,
      titleChanged: reviewResult.changesSummary.titleChanged,
    });

    // Return complete result
    return NextResponse.json({
      updatedStory: refinedStory,
      response: reviewResult.response,
      changesSummary: reviewResult.changesSummary,
    });
  } catch (error) {
    console.error('[Story Edit API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to edit story',
      },
      {status: 500},
    );
  }
}
