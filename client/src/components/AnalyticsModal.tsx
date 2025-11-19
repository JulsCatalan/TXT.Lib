"use client";

import { X, BarChart3, Clock, Flame, ListOrdered } from "lucide-react";
import { useEffect, useState } from "react";
import { getAnalyticsAll } from "../utils/api";

export default function AnalyticsModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);

  // Datos unificados
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

      // Asignamos según tu nuevo backend unificado
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

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          Analytics
        </h2>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando métricas…</div>
        ) : (
          <div className="space-y-10">

            {/* === OVERVIEW CARDS === */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <OverviewCard
                title="Reproducciones Totales"
                value={overview?.total_plays ?? 0}
              />
              <OverviewCard
                title="Textos Creados"
                value={overview?.total_texts_created ?? 0}
              />
              <OverviewCard
                title="Compartidos"
                value={overview?.total_texts_shared ?? 0}
              />
            </div>

            {/* === TEXTOS POR MES === */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Textos creados por mes</h3>
              <div className="space-y-3">
                {textsByMonth.map((m: any) => (
                  <div key={m.month} className="flex justify-between border-b border-gray-900 py-2">
                    <span className="text-gray-400">{m.month}</span>
                    <span className="font-medium">{m.count}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* === TOP TEXTS === */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                Más reproducidos
              </h3>

              {topTexts.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay reproducciones aún</p>
              ) : (
                <div className="space-y-3">
                  {topTexts.map((t, i) => (
                    <div
                      key={t.id}
                      className="border border-gray-900 rounded-lg p-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{i + 1}. {t.title}</p>
                        <p className="text-xs text-gray-500">{t.play_count} reproducciones</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* === RECENT === */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-purple-400" />
                Actividad reciente
              </h3>

              {recent.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay actividad reciente.</p>
              ) : (
                <div className="space-y-3">
                  {recent.map((r) => (
                    <div
                      key={r.id}
                      className="border border-gray-900 rounded-lg p-3 flex justify-between"
                    >
                      <div>
                        <p className="font-medium">{r.text.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(r.played_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        {r.duration_played}s
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* === TOTAL AUDIO TIME === */}
            <section>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                Tiempo total de audio
              </h3>

              <p className="text-gray-300 font-medium text-xl">
                {totalAudio?.formatted ?? "0h 0m"}
              </p>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="p-4 border border-gray-900 rounded-lg bg-gray-950">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
