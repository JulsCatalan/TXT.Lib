'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, MessageCircle, CheckCircle, AlertCircle, Loader, Bell, BellOff } from 'lucide-react';
import { 
  getUserProfile, 
  updatePhoneNumber, 
  requestVerificationCode, 
  verifyWhatsAppCode,
  toggleNotifications,
  removePhoneNumber 
} from '../utils/api';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // Estados para teléfono
  const [phoneInput, setPhoneInput] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Estados para verificación
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // Estados para notificaciones
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      setPhoneInput(data.user.phone_number || '');
    } catch (err: any) {
      console.error('Error cargando perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!phoneInput.trim()) return;
    
    try {
      setPhoneLoading(true);
      await updatePhoneNumber(phoneInput);
      await loadProfile();
      setIsEditingPhone(false);
      
      // Si cambió el número, resetear verificación
      setShowVerification(false);
      setVerificationCode('');
      setCodeSent(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar número');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    try {
      setVerificationLoading(true);
      setVerificationError('');
      setVerificationCode(''); // Limpiar código anterior
      
      const response = await requestVerificationCode();
      
      // Mostrar input de código inmediatamente
      setShowVerification(true);
      setCodeSent(true);
      
 
    } catch (err: any) {
      setVerificationError(err.message || 'Error al enviar código');
      setShowVerification(false);
      setCodeSent(false);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setVerificationError('El código debe tener 6 dígitos');
      return;
    }

    try {
      setVerificationLoading(true);
      setVerificationError('');
      
      await verifyWhatsAppCode(verificationCode);
      
      // Recargar perfil para obtener estado actualizado
      await loadProfile();
      
      // Limpiar y cerrar
      setShowVerification(false);
      setVerificationCode('');
      setCodeSent(false);
      
      // Mostrar mensaje de éxito
      toast.success('✅ Número verificado correctamente');
    } catch (err: any) {
      setVerificationError(err.message || 'Código incorrecto');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!profile?.user?.whatsapp_verified) {
      toast.error('Primero debes verificar tu número de WhatsApp');
      return;
    }

    try {
      setNotificationsLoading(true);
      const newState = !profile.user.whatsapp_notifications_enabled;
      await toggleNotifications(newState);
      await loadProfile();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar notificaciones');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleRemovePhone = async () => {
    if (!confirm('¿Estás seguro de eliminar tu número de teléfono?')) return;

    try {
      setPhoneLoading(true);
      await removePhoneNumber();
      await loadProfile();
      setPhoneInput('');
      setIsEditingPhone(false);
      setShowVerification(false);
      setCodeSent(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar número');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleCancelVerification = () => {
    setShowVerification(false);
    setVerificationCode('');
    setVerificationError('');
    setCodeSent(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-black border border-gray-900 rounded-2xl p-8">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        </div>
      </div>
    );
  }

  const user = profile?.user;
  const stats = profile?.stats;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-900 rounded-2xl w-full max-w-2xl p-6 relative shadow-xl overflow-y-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Mi Perfil</h2>
              <p className="text-sm text-gray-500">Configura tu cuenta y preferencias</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          
          {/* Información básica */}
          <section className="border border-gray-900 rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Información de la cuenta
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Usuario</label>
                <p className="text-sm font-medium">{user?.username}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Miembro desde</label>
                <p className="text-sm font-medium">
                  {new Date(user?.created_at).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </section>

          {/* Estadísticas */}
          <section className="border border-gray-900 rounded-xl p-5">
            <h3 className="font-semibold mb-4">Estadísticas</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{stats?.texts_created || 0}</p>
                <p className="text-xs text-gray-500">Textos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats?.favorites || 0}</p>
                <p className="text-xs text-gray-500">Favoritos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{stats?.texts_shared || 0}</p>
                <p className="text-xs text-gray-500">Compartidos</p>
              </div>
            </div>
          </section>

          {/* Configuración de WhatsApp */}
          <section className="border border-gray-900 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-400" />
              Configuración de WhatsApp
            </h3>

            {/* Número de teléfono */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Número de teléfono</label>
              
              {isEditingPhone ? (
                <div className="space-y-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+52 123 456 7890"
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdatePhone}
                      disabled={phoneLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      {phoneLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPhone(false);
                        setPhoneInput(user?.phone_number || '');
                      }}
                      className="px-4 py-2 border border-gray-800 hover:bg-gray-900 rounded-lg text-sm transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {user?.phone_number || 'No configurado'}
                    </span>
                    {user?.whatsapp_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingPhone(true)}
                      className="px-3 py-1 text-xs border border-gray-800 hover:bg-gray-900 rounded transition"
                    >
                      {user?.phone_number ? 'Cambiar' : 'Agregar'}
                    </button>
                    {user?.phone_number && (
                      <button
                        onClick={handleRemovePhone}
                        className="px-3 py-1 text-xs border border-red-900 text-red-400 hover:bg-red-950 rounded transition"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Verificación */}
            {user?.phone_number && !user?.whatsapp_verified && (
              <>
                {!showVerification ? (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-yellow-500 font-medium">Número no verificado</p>
                        <p className="text-xs text-yellow-500/70 mt-1">
                          Verifica tu número para recibir notificaciones
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRequestVerification}
                      disabled={verificationLoading}
                      className="w-full mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {verificationLoading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Enviando código...
                        </>
                      ) : (
                        'Verificar número'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm font-medium text-blue-400 mb-1">Ingresa el código</p>
                      <p className="text-xs text-gray-500">
                        {codeSent ? 'Código enviado' : 'Enviando código'} a {user?.phone_number}
                      </p>
                    </div>
                    
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                        setVerificationError('');
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && verificationCode.length === 6) {
                          handleVerifyCode();
                        }
                      }}
                      placeholder="123456"
                      maxLength={6}
                      autoFocus
                      disabled={verificationLoading}
                      className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />

                    {verificationError && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {verificationError}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleVerifyCode}
                        disabled={verificationLoading || verificationCode.length !== 6}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {verificationLoading ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          'Verificar'
                        )}
                      </button>
                      <button
                        onClick={handleCancelVerification}
                        disabled={verificationLoading}
                        className="px-4 py-2 border border-gray-800 hover:bg-gray-900 rounded-lg text-sm transition disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>

                    <button
                      onClick={handleRequestVerification}
                      disabled={verificationLoading}
                      className="w-full text-xs text-gray-500 hover:text-gray-400 transition disabled:opacity-50"
                    >
                      {verificationLoading ? 'Enviando...' : 'Reenviar código'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Estado verificado */}
            {user?.whatsapp_verified && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500 font-medium">
                    Número verificado
                  </span>
                </div>
              </div>
            )}

            {/* Toggle de notificaciones */}
            {user?.whatsapp_verified && (
              <div className="pt-3 border-t border-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user?.whatsapp_notifications_enabled ? (
                      <Bell className="w-4 h-4 text-green-400" />
                    ) : (
                      <BellOff className="w-4 h-4 text-gray-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Notificaciones por WhatsApp</p>
                      <p className="text-xs text-gray-500">
                        {user?.whatsapp_notifications_enabled ? 'Activadas' : 'Desactivadas'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleNotifications}
                    disabled={notificationsLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      user?.whatsapp_notifications_enabled ? 'bg-blue-600' : 'bg-gray-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        user?.whatsapp_notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}