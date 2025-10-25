/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import {useState} from 'react';
import {X, Sparkles, Loader2} from 'lucide-react';
import {Genre, StoryType, Energy, StoryDraft} from '../types/story-creation';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryGenerated: (story: StoryDraft) => void;
}

const GENRE_OPTIONS: {value: Genre; label: string; image: string}[] = [
  {value: 'drama', label: 'Drama', image: '/docs/princess-drama.png'},
  {value: 'action', label: 'Action', image: '/docs/princess-action.png'},
  {value: 'comedy', label: 'Comedy', image: '/docs/princess-comedy.png'},
  {value: 'horror', label: 'Horror', image: '/docs/princess-horror.png'},
];

const STORY_TYPE_OPTIONS: {value: StoryType; label: string; image: string}[] = [
  {
    value: 'character-journey',
    label: 'Character Journey',
    image: '/docs/princess-character-journey.png',
  },
  {
    value: 'situation',
    label: 'Situation',
    image: '/docs/princess-situation.png',
  },
  {
    value: 'discovery',
    label: 'Discovery',
    image: '/docs/princess-discovery.png',
  },
];

const ENERGY_OPTIONS: {value: Energy; label: string; image: string}[] = [
  {value: 'fast', label: 'Fast', image: '/docs/princess-fast.png'},
  {value: 'medium', label: 'Medium', image: '/docs/princess-medium.png'},
  {
    value: 'contemplative',
    label: 'Contemplative',
    image: '/docs/princess-contemplative.png',
  },
];

export default function QuickStartModal({
  isOpen,
  onClose,
  onStoryGenerated,
}: QuickStartModalProps) {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [selectedType, setSelectedType] = useState<StoryType | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<Energy | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = selectedGenre && selectedType && selectedEnergy;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/story/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          mode: 'quick',
          params: {
            genre: selectedGenre,
            type: selectedType,
            energy: selectedEnergy,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.story) {
        onStoryGenerated(data.story);
        onClose();
      } else {
        setError(data.error || 'Failed to generate story');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Story generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Quick Start
              </h2>
              <p className="text-sm text-gray-600">
                Choose genre, type, and energy to generate your story
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isGenerating}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Genre Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              1. Select Genre
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {GENRE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedGenre(option.value)}
                  disabled={isGenerating}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedGenre === option.value
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 bg-white'
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <img
                    src={option.image}
                    alt={option.label}
                    className="w-24 h-24 mx-auto rounded-lg object-cover mb-2"
                  />
                  <p className="text-sm font-medium text-gray-900 text-center">
                    {option.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Story Type Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              2. Select Story Type
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {STORY_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedType(option.value)}
                  disabled={isGenerating}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedType === option.value
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 bg-white'
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <img
                    src={option.image}
                    alt={option.label}
                    className="w-24 h-24 mx-auto rounded-lg object-cover mb-2"
                  />
                  <p className="text-sm font-medium text-gray-900 text-center">
                    {option.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              3. Select Energy/Pacing
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {ENERGY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedEnergy(option.value)}
                  disabled={isGenerating}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedEnergy === option.value
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 bg-white'
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <img
                    src={option.image}
                    alt={option.label}
                    className="w-24 h-24 mx-auto rounded-lg object-cover mb-2"
                  />
                  <p className="text-sm font-medium text-gray-900 text-center">
                    {option.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {!canGenerate && 'Select all three options to continue'}
            {canGenerate && !isGenerating && 'Ready to generate your story'}
            {isGenerating && 'Generating your story...'}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Story
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
