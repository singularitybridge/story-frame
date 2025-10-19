/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { DollarSign, Video, Image, CheckCircle } from 'lucide-react';
import { getCostSummary, CostSummary } from '../services/costTrackingService';

export const CostTracker = () => {
  const [summary, setSummary] = useState<CostSummary | null>(null);

  const updateCosts = () => {
    const currentSummary = getCostSummary();
    setSummary(currentSummary);
  };

  useEffect(() => {
    // Initial load
    updateCosts();

    // Update every 2 seconds to catch new generations
    const interval = setInterval(updateCosts, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!summary) return null;

  return (
    <div className="bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm flex items-center gap-4">
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-green-600" />
        <span className="text-sm font-bold text-gray-900">
          ${summary.totalCost.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-600 border-l border-gray-300 pl-4">
        <div className="flex items-center gap-1">
          <Video className="h-3 w-3" />
          <span>{summary.videoGenerations}</span>
        </div>
        <div className="flex items-center gap-1">
          <Image className="h-3 w-3" />
          <span>{summary.imageGenerations}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>{summary.evaluations}</span>
        </div>
      </div>
    </div>
  );
};
