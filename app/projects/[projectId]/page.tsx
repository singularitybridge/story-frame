/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
'use client';

import { use, useState, useEffect } from 'react';
import SceneManager from '../../../components/SceneManager';
import ApiKeyDialog from '../../../components/ApiKeyDialog';

export default function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const geminiKey = localStorage.getItem('geminiApiKey');
    if (!envKey && !geminiKey) {
      setShowApiKeyDialog(true);
    }
  }, []);

  const handleContinue = () => {
    // For now, just hide the dialog - in a full implementation,
    // this would navigate to an API key selection page
    setShowApiKeyDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleContinue} />}
      <SceneManager projectId={projectId} />
    </div>
  );
}
