'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Users, Trash2 } from 'lucide-react';
import { getSharedByMe, unshareText } from '../utils/api';
import type { SharedTextGroup } from '../types';

interface SharedTextsModalProps {
  onClose: () => void;
}

export default function SharedTextsModal({ onClose }: SharedTextsModalProps) {
  const [sentTexts, setSentTexts] = useState<SharedTextGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedTexts();
  }, []);

  const loadSharedTexts = async () => {
    try {
      const sent = await getSharedByMe();

      const grouped: Record<string, SharedTextGroup> = {};

      sent.forEach((share: any) => {
        const textId = share.text.id;

        if (!grouped[textId]) {
          grouped[textId] = {
            text: share.text,
            shared_at: share.shared_at,
            users: []
          };
        }

        grouped[textId].users.push({
          share_id: share.share_id,
          username: share.shared_with.username
        });
      });

      setSentTexts(Object.values(grouped));
    } catch (error) {
      console.error('Error loading shared texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (share_id: string) => {
    try {
      await unshareText(share_id);
      loadSharedTexts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-black border border-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-900">
          <h2 className="text-xl font-bold">Textos que compartí</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-900 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : sentTexts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-700" />
              <h3 className="text-lg font-semibold mb-2">No has compartido textos</h3>
              <p className="text-gray-500 text-sm">Comparte un texto para verlo aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentTexts.map((item) => (
                <div
                  key={item.text.id}
                  className="border border-gray-900 rounded-lg p-4 hover:border-gray-700 transition"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.text.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Compartido con:   
                        <span className="text-white ml-2">
                          {item.users.map(u => u.username).join(', ')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {item.text.content}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.users.map((u) => (
                      <button
                        key={u.share_id}
                        onClick={() => handleRevoke(u.share_id)}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        Revocar: {u.username}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-3">
                    <span>
                      Compartido {new Date(item.shared_at).toLocaleDateString()}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
