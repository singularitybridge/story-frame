/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GenerationCost {
  id: string;
  timestamp: number;
  type: 'video' | 'image' | 'evaluation';
  duration?: number; // in seconds for video
  resolution?: string; // e.g., "720p", "1080p"
  model?: string; // e.g., "veo-3.1", "imagen-3"
  estimatedCost: number; // in USD
  metadata?: Record<string, any>;
}

export interface CostSummary {
  totalCost: number;
  videoGenerations: number;
  imageGenerations: number;
  evaluations: number;
  costs: GenerationCost[];
}

// Estimated pricing (based on typical AI video generation costs)
// These should be updated with actual Vertex AI pricing
const PRICING = {
  video: {
    'veo-2': {
      '720p': 0.15, // per video (approx 8s)
      '1080p': 0.25,
    },
    'veo-3.1': {
      '720p': 0.20, // per video (approx 8s)
      '1080p': 0.35,
    },
  },
  image: {
    'imagen-3': 0.04, // per image
  },
  evaluation: {
    gemini: 0.01, // per evaluation (frame analysis)
    whisper: 0.006, // per minute of audio
  },
};

const STORAGE_KEY = 'veo_studio_costs';

/**
 * Load cost history from localStorage
 */
export const loadCostHistory = (): GenerationCost[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load cost history:', error);
    return [];
  }
};

/**
 * Save cost history to localStorage
 */
const saveCostHistory = (costs: GenerationCost[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(costs));
  } catch (error) {
    console.error('Failed to save cost history:', error);
  }
};

/**
 * Track a video generation cost
 */
export const trackVideoGeneration = (
  duration: number,
  resolution: string,
  model: string = 'veo-3.1'
): GenerationCost => {
  const modelKey = model as keyof typeof PRICING.video;
  const resKey = resolution as keyof typeof PRICING.video['veo-3.1'];

  const baseCost = PRICING.video[modelKey]?.[resKey] || PRICING.video['veo-3.1']['720p'];

  // Adjust cost based on duration (baseline is 8 seconds)
  const estimatedCost = baseCost * (duration / 8);

  const cost: GenerationCost = {
    id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type: 'video',
    duration,
    resolution,
    model,
    estimatedCost,
  };

  const history = loadCostHistory();
  history.push(cost);
  saveCostHistory(history);

  return cost;
};

/**
 * Track an image generation cost
 */
export const trackImageGeneration = (
  model: string = 'imagen-3',
  count: number = 1
): GenerationCost => {
  const estimatedCost = (PRICING.image['imagen-3'] || 0.04) * count;

  const cost: GenerationCost = {
    id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type: 'image',
    model,
    estimatedCost,
    metadata: { count },
  };

  const history = loadCostHistory();
  history.push(cost);
  saveCostHistory(history);

  return cost;
};

/**
 * Track an evaluation cost
 */
export const trackEvaluation = (
  audioDuration: number = 0,
  includesAudio: boolean = false
): GenerationCost => {
  // Cost for Gemini frame analysis (2 frames)
  let estimatedCost = PRICING.evaluation.gemini * 2;

  // Add Whisper transcription cost if audio is included
  if (includesAudio && audioDuration > 0) {
    estimatedCost += PRICING.evaluation.whisper * (audioDuration / 60);
  }

  const cost: GenerationCost = {
    id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type: 'evaluation',
    duration: audioDuration,
    estimatedCost,
    metadata: { includesAudio },
  };

  const history = loadCostHistory();
  history.push(cost);
  saveCostHistory(history);

  return cost;
};

/**
 * Get cost summary
 */
export const getCostSummary = (): CostSummary => {
  const costs = loadCostHistory();

  return {
    totalCost: costs.reduce((sum, cost) => sum + cost.estimatedCost, 0),
    videoGenerations: costs.filter((c) => c.type === 'video').length,
    imageGenerations: costs.filter((c) => c.type === 'image').length,
    evaluations: costs.filter((c) => c.type === 'evaluation').length,
    costs,
  };
};

/**
 * Clear cost history
 */
export const clearCostHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Get costs for a specific time range
 */
export const getCostsByTimeRange = (
  startDate: Date,
  endDate: Date
): GenerationCost[] => {
  const costs = loadCostHistory();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  return costs.filter(
    (cost) => cost.timestamp >= startTime && cost.timestamp <= endTime
  );
};

/**
 * Export costs to CSV
 */
export const exportCostsToCSV = (): string => {
  const costs = loadCostHistory();
  const headers = 'Timestamp,Type,Duration,Resolution,Model,Cost\n';
  const rows = costs
    .map((cost) => {
      const date = new Date(cost.timestamp).toISOString();
      return `${date},${cost.type},${cost.duration || ''},${cost.resolution || ''},${cost.model || ''},${cost.estimatedCost.toFixed(4)}`;
    })
    .join('\n');

  return headers + rows;
};
