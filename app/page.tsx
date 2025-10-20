/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
'use client';

import {useState, useEffect} from 'react';
import ProjectList from '../components/ProjectList';
import ApiKeyDialog from '../components/ApiKeyDialog';

export default function Home() {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  useEffect(() => {
    // Check if API key exists in environment
    const hasApiKey = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    setShowApiKeyDialog(!hasApiKey);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {showApiKeyDialog && <ApiKeyDialog onContinue={() => setShowApiKeyDialog(false)} />}
      <ProjectList />
    </div>
  );
}
