/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Play, Pause, SkipForward, Square, Repeat } from 'lucide-react';

interface PlaybackBarProps {
  isPlaying: boolean;
  isPlayingAll: boolean;
  loopEnabled: boolean;
  currentSceneIndex: number;
  totalScenes: number;
  currentSceneTitle: string;
  onPlayPause: () => void;
  onPlayAll: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
}

export const PlaybackBar: React.FC<PlaybackBarProps> = ({
  isPlaying,
  isPlayingAll,
  loopEnabled,
  currentSceneIndex,
  totalScenes,
  currentSceneTitle,
  onPlayPause,
  onPlayAll,
  onStop,
  onToggleLoop,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Playback Controls */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={onPlayPause}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              title="Play/Pause (Space)"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            {/* Play All */}
            <button
              onClick={onPlayAll}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                isPlayingAll
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title="Play All (Shift+Enter)"
            >
              <SkipForward size={18} />
              {isPlayingAll && <span className="text-xs font-medium">Playing All</span>}
            </button>

            {/* Stop */}
            {(isPlaying || isPlayingAll) && (
              <button
                onClick={onStop}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                title="Stop (Esc)"
              >
                <Square size={18} />
              </button>
            )}

            {/* Loop Toggle */}
            <button
              onClick={onToggleLoop}
              className={`p-2 rounded-lg transition-colors ${
                loopEnabled
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
              }`}
              title="Toggle Loop"
            >
              <Repeat size={18} />
            </button>
          </div>

          {/* Center: Scene Info */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-medium text-gray-900">{currentSceneTitle}</span>
              <span className="text-xs text-gray-500">
                ({currentSceneIndex + 1} of {totalScenes})
              </span>
            </div>
            {isPlayingAll && (
              <div className="mt-1">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden max-w-md mx-auto">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${((currentSceneIndex + 1) / totalScenes) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Keyboard Shortcut Hint */}
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono">Space</kbd>
            <span className="hidden sm:inline">Play/Pause</span>
          </div>
        </div>
      </div>
    </div>
  );
};
