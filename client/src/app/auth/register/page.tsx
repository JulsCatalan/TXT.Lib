// app/auth/register/page.tsx
'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '../../../utils/api';
import { ArrowRight, Loader2 } from 'lucide-react';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Crear Cuenta</h1>
          <p className="text-gray-500 text-sm">
            Únete a TXT.Lib hoy mismo
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg p-8 space-y-6">
          
          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* Username */}
            <div className="space-y-4">
              <label
                htmlFor="username"
                className="block text-base font-medium text-gray-200"
              >
                Nombre de Usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black border-b-2 border-gray-500 text-white placeholder-gray-600 focus:outline-none focus:border-white transition"
                placeholder="usuario123"
              />
            </div>

            {/* Email */}
            <div className="space-y-4">
              <label
                htmlFor="email"
                className="block text-base font-medium text-gray-200"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black border-b-2 border-gray-500 text-white placeholder-gray-600 focus:outline-none focus:border-white transition"
                placeholder="tu@email.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-4">
              <label
                htmlFor="password"
                className="block text-base font-medium text-gray-200"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black border-b-2 border-gray-500 text-white placeholder-gray-600 focus:outline-none focus:border-white transition"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-4">
              <label
                htmlFor="confirmPassword"
                className="block text-base font-medium text-gray-200"
              >
                Confirmar Contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black border-b-2 border-gray-500 text-white placeholder-gray-600 focus:outline-none focus:border-white transition"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Crear Cuenta
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/auth/login"
            className="text-white hover:text-gray-300 font-medium transition"
          >
            Inicia sesión aquí
          </Link>
        </p>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-400 transition"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}