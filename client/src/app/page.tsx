// app/page.tsx
'use client';

import Link from 'next/link';
import { Mic2, Zap, Share2, ArrowRight, Github, AlertCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      
      {/* Header - Challenge Info */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Challenge: <span className="text-white font-medium">SALMA</span>
        </div>

        <a
          href="https://github.com/tu-usuario/tu-repo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-gray-800 rounded-lg hover:border-gray-600 transition-all text-sm"
        >
          <Github className="w-4 h-4" />
          Repositorio
        </a>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl w-full space-y-16">
        
        {/* Hero Section */}
        <div className="space-y-6 text-center">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            TXT.Lib
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Convierte texto en audio con IA, comparte y crea!
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="/auth/login"
              className="group px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              Iniciar Sesión
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/auth/register"
              className="px-6 py-3 border border-gray-800 text-white rounded-lg font-medium hover:border-gray-600 transition-all"
            >
              Registrarse
            </Link>
          </div>

          {/* Server Notice */}
          <div className="inline-flex items-start gap-3 px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-lg text-left max-w-lg mx-auto mt-8">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-400">
              <span className="text-gray-300 font-medium">Nota:</span> Si la carga del sitio fue lenta, 
              es debido al downtime de los servidores gratuitos de Render que se desactivan por inactividad.
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="p-6 border border-gray-900 rounded-lg hover:border-gray-700 transition-all">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
              <Mic2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Voces Naturales</h3>
            <p className="text-sm text-gray-400">
              IA avanzada para audio realista
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 border border-gray-900 rounded-lg hover:border-gray-700 transition-all">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ultra Rápido</h3>
            <p className="text-sm text-gray-400">
              Generación en segundos
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 border border-gray-900 rounded-lg hover:border-gray-700 transition-all">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Comparte</h3>
            <p className="text-sm text-gray-400">
              Comparte con tu equipo
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center space-y-2">
        <div className="text-gray-600 text-sm">
          Desarrollado por <span className="text-gray-400 font-medium">Juls Catalan</span>
        </div>
        <div className="text-gray-700 text-xs">
          © 2024 TXTLib · Coding Challenge SALMA
        </div>
      </div>
    </div>
  );
}
