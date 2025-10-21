/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
'use client';

import { use } from 'react';
import CharacterReferenceGenerator from '@/components/CharacterReferenceGenerator';

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function CharacterRefsPage({ params }: PageProps) {
  const { projectId } = use(params);

  return <CharacterReferenceGenerator projectId={projectId} />;
}
