"use client";

import { X, BarChart3, Clock, Flame, ListOrdered, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getAnalyticsAll } from "../utils/api";

export default function AnalyticsModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<any>(null);
  const [topTexts, setTopTexts] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [totalAudio, setTotalAudio] = useState<any>(null);
  const [textsByMonth, setTextsByMonth] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getAnalyticsAll();
      
      setOverview(data.overview);
      setTopTexts(data.topTexts || []);
      setRecent(data.recentActivity || []);
      setTotalAudio(data.totalAudio || null);
      setTextsByMonth(data.textsByMonth || []);
    } catch (err) {
      console.error("Error analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-900 rounded-2xl w-full max-w-4xl p-6 relative shadow-xl overflow-y-auto max-h-[90vh]">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          Analytics
        </h2>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando métricas…</div>
        ) : (
          <div className="space-y-8">

            {/* === OVERVIEW CARDS === */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <OverviewCard
                title="Reproducciones Totales"
                value={overview?.total_plays ?? 0}
                icon="🎵"
              />
              <OverviewCard
                title="Textos Creados"
                value={overview?.total_texts_created ?? 0}
                icon="📝"
              />
              <OverviewCard
                title="Compartidos"
                value={overview?.total_texts_shared ?? 0}
                icon="🔗"
              />
            </div>

            {/* === TOTAL AUDIO TIME === */}
            {totalAudio && (
              <section className="border border-gray-900 rounded-xl p-5 bg-linear-to-br from-green-950/20 to-transparent">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-400" />
                  Tiempo total de audio
                </h3>
                <p className="text-gray-300 font-bold text-3xl">
                  {totalAudio.formatted}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalAudio.total_seconds} segundos reproducidos
                </p>
              </section>
            )}

            {/* === TEXTOS POR MES === */}
            {textsByMonth.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Textos creados por mes
                </h3>
                <div className="space-y-2">
                  {textsByMonth.map((m: any) => (
                    <div 
                      key={m.month} 
                      className="flex justify-between items-center border-b border-gray-900 py-3 hover:bg-gray-950/50 transition-colors rounded px-2"
                    >
                      <span className="text-gray-400 font-medium">{formatMonth(m.month)}</span>
                      <span className="font-semibold text-blue-400">{m.count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* === TOP TEXTS === */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                Más reproducidos
              </h3>

              {topTexts.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-800 rounded-lg">
                  <p className="text-gray-500 text-sm">No hay reproducciones aún</p>
                  <p className="text-gray-600 text-xs mt-1">Genera y reproduce audios para ver estadísticas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topTexts.map((t, i) => (
                    <div
                      key={t.id}
                      className="border border-gray-900 rounded-lg p-4 flex justify-between items-center hover:border-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${i === 0 ? 'bg-orange-500/20 text-orange-400' : ''}
                          ${i === 1 ? 'bg-gray-500/20 text-gray-400' : ''}
                          ${i === 2 ? 'bg-amber-700/20 text-amber-600' : ''}
                          ${i > 2 ? 'bg-gray-900 text-gray-500' : ''}
                        `}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{t.title}</p>
                          {t.category && (
                            <p className="text-xs text-gray-600 mt-0.5">{t.category}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-400">{t.play_count}</p>
                        <p className="text-xs text-gray-500">plays</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* === RECENT ACTIVITY === */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-purple-400" />
                Actividad reciente
              </h3>

              {recent.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-800 rounded-lg">
                  <p className="text-gray-500 text-sm">No hay actividad reciente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.map((r) => (
                    <div
                      key={r.id}
                      className="border border-gray-900 rounded-lg p-3 flex justify-between items-center hover:border-gray-800 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{r.text.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatDate(r.played_at)}
                          </p>
                          {r.text.category && (
                            <span className="text-xs text-gray-600">· {r.text.category}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-400">
                          {r.duration_played}s
                        </p>
                        {r.completed && (
                          <p className="text-xs text-green-500">✓ Completado</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ title, value, icon }: { title: string; value: any; icon: string }) {
  return (
    <div className="p-5 border border-gray-900 rounded-xl bg-linear-to-br from-gray-950 to-transparent hover:border-gray-800 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}