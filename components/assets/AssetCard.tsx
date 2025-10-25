/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
'use client';

import { useState } from 'react';
import { Edit2, Trash2, Eye, MoreVertical, Tag } from 'lucide-react';
import type { Asset } from '@/types/asset';

interface AssetCardProps {
  asset: Asset;
  onDelete: (assetId: string) => void;
  onEdit: (assetId: string) => void;
}

export default function AssetCard({ asset, onDelete, onEdit }: AssetCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'character':
        return 'bg-blue-100 text-blue-700';
      case 'prop':
        return 'bg-green-100 text-green-700';
      case 'location':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getProviderColor = (provider: string): string => {
    switch (provider) {
      case 'gemini':
        return 'bg-indigo-100 text-indigo-700';
      case 'openai':
        return 'bg-emerald-100 text-emerald-700';
      case 'fal':
        return 'bg-pink-100 text-pink-700';
      case 'replicate':
        return 'bg-orange-100 text-orange-700';
      case 'uploaded':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative aspect-video bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}
        <img
          src={asset.imageUrl || '/placeholder-asset.png'}
          alt={asset.name}
          className={`w-full h-full object-cover ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-asset.png';
            setImageLoaded(true);
          }}
        />

        {/* Overlay with actions (shown on hover) */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => window.open(asset.imageUrl, '_blank')}
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
            title="View full size"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => onEdit(asset.id)}
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
            title="Edit asset"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(asset.id)}
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full text-red-600 hover:bg-gray-100 transition-colors"
            title="Delete asset"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(
              asset.type
            )}`}
          >
            {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
          </span>
        </div>

        {/* Provider badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${getProviderColor(
              asset.provider
            )}`}
          >
            {asset.provider === 'uploaded' ? 'Uploaded' : asset.provider.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 truncate" title={asset.name}>
          {asset.name}
        </h3>
        {asset.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2" title={asset.description}>
            {asset.description}
          </p>
        )}

        {/* Tags */}
        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {new Date(asset.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {asset.usedInScenes.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Used in {asset.usedInScenes.length} scene{asset.usedInScenes.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
