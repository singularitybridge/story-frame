/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import {useState} from 'react';
import {X, Sparkles, Loader2, Lightbulb} from 'lucide-react';
import {StoryDraft} from '../types/story-creation';

interface CustomStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryGenerated: (story: StoryDraft) => void;
}

export default function CustomStoryModal({
  isOpen,
  onClose,
  onStoryGenerated,
}: CustomStoryModalProps) {
  const [concept, setConcept] = useState('');
  const [character, setCharacter] = useState('');
  const [mood, setMood] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = concept.trim().length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/story/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          mode: 'custom',
          params: {
            concept: concept.trim(),
            character: character.trim() || undefined,
            mood: mood.trim() || undefined,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.story) {
        onStoryGenerated(data.story);
        onClose();
        // Reset form
        setConcept('');
        setCharacter('');
        setMood('');
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey && canGenerate) {
      handleGenerate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Custom Story
              </h2>
              <p className="text-sm text-gray-600">
                Describe your concept and let AI bring it to life
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
        <div className="p-6 space-y-6">
          {/* Story Concept */}
          <div>
            <label
              htmlFor="concept"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Story Concept <span className="text-red-500">*</span>
            </label>
            <textarea
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isGenerating}
              placeholder="e.g., A young artist discovers a magical paintbrush that brings paintings to life"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Describe the core idea or theme of your story
            </p>
          </div>

          {/* Character (Optional) */}
          <div>
            <label
              htmlFor="character"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Character Description{' '}
              <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="character"
              type="text"
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isGenerating}
              placeholder="e.g., Maya, a shy but talented 12-year-old painter"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Describe the main character or leave blank for AI to decide
            </p>
          </div>

          {/* Mood/Tone (Optional) */}
          <div>
            <label
              htmlFor="mood"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Mood/Tone <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="mood"
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isGenerating}
              placeholder="e.g., Whimsical and wonder-filled"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Set the emotional tone or leave blank for AI to decide
            </p>
          </div>

          {/* Example Ideas */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Example Ideas
            </h3>
            <ul className="text-xs text-purple-700 space-y-1.5">
              <li>
                • A robot learns about emotions through interactions with a
                child
              </li>
              <li>
                • An elderly gardener discovers their plants can communicate
              </li>
              <li>
                • A musician finds an instrument that controls the weather
              </li>
              <li>
                • A lonely lighthouse keeper befriends a mysterious sea creature
              </li>
            </ul>
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
            {!canGenerate && 'Enter a story concept to continue'}
            {canGenerate && !isGenerating && (
              <>
                Ready to generate{' '}
                <span className="text-gray-400">(⌘+Enter)</span>
              </>
            )}
            {isGenerating && 'Generating your story...'}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
