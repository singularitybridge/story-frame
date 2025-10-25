/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
'use client';

import { use } from 'react';
import AssetLibrary from '@/components/assets/AssetLibrary';

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Asset Library page - manages all visual elements for the project
 * Replaces the old "refs" terminology with comprehensive asset management
 */
export default function AssetsPage({ params }: PageProps) {
  const { projectId } = use(params);

  return (
    <div className="min-h-screen bg-gray-50">
      <AssetLibrary projectId={projectId} />
    </div>
  );
}
