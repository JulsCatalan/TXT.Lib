# 🎧 TXT.Lib - Plataforma de Gestión de Textos con Audio

**Proyecto para el proceso de entrevista de SALMA**

## 📋 Descripción del Proyecto

TXT.Lib es una plataforma completa para gestionar textos y generar audios a partir de ellos utilizando **ElevenLabs**. El proyecto incluye:

- ✅ **Generación de audio** con ElevenLabs (voces masculinas y femeninas)
- ✅ **Almacenamiento en la nube** con Supabase Storage (persistente)
- ✅ **Compartir textos** entre usuarios dentro de la plataforma
- ✅ **Analytics completos** con estadísticas de uso y reproducciones
- ✅ **Integración con WhatsApp** vía Kapso para enviar audios y textos
- ✅ **Sistema de favoritos** y gestión de biblioteca personal
- ✅ **Verificación de teléfono** y configuración de notificaciones

## 🏗️ Arquitectura

### Backend
- **Framework**: Node.js + Express
- **Arquitectura**: MVC (Modelo-Vista-Controlador)
- **Puerto**: 3000
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: JWT personalizado (sin usar Supabase Auth)
- **Almacenamiento de audio**: Supabase Storage (bucket `audiofiles`)
- **Text-to-Speech**: ElevenLabs SDK oficial

### Frontend
- **Framework**: Next.js
- **Build**: Estático (Static Site Generation)
- **Puerto dev**: 5173 (como React puro)
- **UI**: Tailwind CSS con diseño minimalista oscuro

### Despliegue
- **Plataforma**: Render
- **Configuración**: Mono-repo (frontend + backend en el mismo servidor)
- **Nota importante**: Render en tier gratuito puede tardar ~1 minuto en arrancar cuando está inactivo

## 🗄️ Base de Datos

### Configuración de Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve al **SQL Editor**
4. Copia y pega el contenido de `db.sql` (ubicado en la raíz del proyecto)
5. Ejecuta el script para crear todas las tablas, funciones y triggers

### Configuración de Storage

1. Ve a **Storage** en tu proyecto de Supabase
2. Crea un nuevo bucket llamado `audiofiles`
3. Marca la opción **Public bucket** (para que los audios sean accesibles)
4. Guarda el bucket

### Tablas Principales
- `users` - Usuarios con autenticación personalizada
- `texts` - Textos creados por usuarios
- `shared_texts` - Sistema de compartir entre usuarios
- `favorites` - Favoritos por usuario
- `audio_analytics` - Tracking de reproducciones
- `whatsapp_config` - Configuración de WhatsApp por usuario
- `whatsapp_notifications` - Historial de mensajes enviados

## ⚙️ Configuración

### 1. Variables de Entorno - Backend

Crea un archivo `.env` en la carpeta raíz:
```bash
# ==========================================
# SUPABASE
# ==========================================
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SECRET_KEY=tu-supabase-secret-key

# ==========================================
# JWT
# ==========================================
JWT_SECRET=tu-jwt-secret-super-seguro

# ==========================================
# SERVER
# ==========================================
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# ==========================================
# ELEVENLABS (Text-to-Speech)
# ==========================================
ELEVENLABS_API_KEY=tu-elevenlabs-api-key

# ==========================================
# KAPSO (WhatsApp)
# ==========================================
KAPSO_API_KEY=tu-kapso-api-key
KAPSO_PHONE_SANDBOX=tu-numero-sandbox-kapso
```

### 2. Variables de Entorno - Frontend

Crea un archivo `.env.local` en la carpeta `frontend`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Obtener Credenciales

#### Supabase
1. Ve a tu proyecto en Supabase
2. Settings → API
3. Copia `URL` y `service_role key`

#### ElevenLabs
1. Crea cuenta en [ElevenLabs](https://elevenlabs.io)
2. Ve a Profile → API Keys
3. Copia tu API key
4. **Nota**: El tier gratuito no funciona desde servidores/VPNs, requiere plan de pago ($5/mes mínimo)

#### Kapso (WhatsApp)
1. Crea cuenta en [Kapso](https://kapso.ai)
2. Obtén tu API key y número de sandbox

## 🚀 Instalación y Ejecución

### Desarrollo Local

Desde la **raíz del proyecto**, ejecuta:
```bash
npm run build
```

Este comando hace:
1. ✅ Instala dependencias del backend
2. ✅ Instala dependencias del frontend
3. ✅ Hace build estático de Next.js
4. ✅ Configura todo para correr en puerto 3000

Luego inicia el servidor:
```bash
npm start
```

La aplicación estará disponible en: **http://localhost:3000**

### Scripts Disponibles
```bash
# Instalar dependencias de ambos proyectos
npm install

# Build completo (backend + frontend)
npm run build

# Iniciar servidor en producción
npm start

# Desarrollo del backend (solo backend)
npm run dev

# Desarrollo del frontend (con hot reload)
cd frontend && npm run dev
```

## 📁 Estructura del Proyecto
```
TXT.Lib/
├── src/                          # Backend
│   ├── config/
│   │   ├── supabase.js          # Configuración Supabase
│   │   ├── kapso.js             # Configuración Kapso
│   │   └── elevenlabs.js        # Generación de audio + Storage
│   ├── controllers/             # Controladores MVC
│   │   ├── auth.controller.js
│   │   ├── texts.controller.js
│   │   ├── analytics.controller.js
│   │   ├── whatsapp.controller.js
│   │   ├── shared.controller.js
│   │   ├── favorites.controller.js
│   │   └── users.controller.js
│   ├── routes/                  # Rutas API
│   ├── middleware/              # Middlewares (auth, etc)
│   └── utils/                   # Utilidades
│   ├── app.js                   # Servidor Express principal
├── client/                      # Frontend Next.js
│   ├── app/                     # App router de Next.js
│   ├── components/              # Componentes React
│   ├── utils/                   # API calls y utilidades
│   └── types/                   # TypeScript types
├── db.txt                       # Script SQL de base de datos
├── package.json                 # Dependencias backend
└── README.md                    # Este archivo
```

## 🎨 Características Principales

### 1. Gestión de Textos
- Crear, editar y eliminar textos
- Organizar por categorías
- Sistema de búsqueda y filtros
- Contador de palabras automático
- Modal de confirmación para eliminación

### 2. Generación de Audio
- Integración con ElevenLabs SDK oficial
- Voces masculinas y femeninas
- Reproducción en línea con controles interactivos
- Timeline clickeable para navegar el audio
- Descarga de archivos MP3
- **Almacenamiento persistente en Supabase Storage**

### 3. Compartir y Colaborar
- Compartir textos con otros usuarios
- Búsqueda de usuarios estilo GitHub
- Permisos configurables (solo lectura o edición)
- Vista separada de "Mis Textos" y "Compartidos Conmigo"

### 4. Analytics Completo
- Dashboard con métricas principales
- Top 5 textos más reproducidos
- Actividad reciente
- Tiempo total de audio generado
- Gráficas de textos por mes
- Tracking automático de reproducciones

### 5. Favoritos
- Marcar textos favoritos
- Acceso rápido desde el dashboard
- Estadísticas de favoritos

### 6. Integración WhatsApp (Kapso)
- Enviar solo audio
- Enviar solo texto
- Enviar texto + audio
- Verificación de número con código
- Envío a uno mismo (envío a otros próximamente)
- Mensajes de error descriptivos para problemas comunes

### 7. Perfil de Usuario
- Información básica de cuenta
- Estadísticas personales
- Configuración de WhatsApp
- Verificación de número telefónico

## 🔐 Autenticación

Sistema personalizado con JWT:
- Registro de usuarios
- Login con email/password
- Tokens almacenados en cookies HTTP-only
- Middleware de autenticación en todas las rutas protegidas

## 📊 Analytics y Tracking

El sistema trackea automáticamente:
- Cada reproducción de audio
- Duración de escucha
- Audios completados
- Descargas de audio
- Textos compartidos
- Favoritos agregados

## 🌐 Despliegue en Producción

### Configuración para Render

1. Conecta tu repositorio a Render
2. Configura como **Web Service**
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Agrega todas las variables de entorno
6. Importante: Actualiza `BASE_URL` con tu dominio de producción

### Consideraciones
- ⚠️ En tier gratuito, el servidor se duerme después de inactividad
- ⚠️ Primera carga puede tardar ~1 minuto
- ✅ Audios almacenados en Supabase Storage (persistentes entre deploys)
- ✅ WhatsApp requiere URLs HTTPS (Render incluye SSL gratis)
- ✅ ElevenLabs requiere plan de pago para funcionar desde servidores

## 🎯 Decisiones Técnicas

### ¿Por qué Supabase Storage para los audios?
Inicialmente se usaba almacenamiento local, pero los archivos se perdían con cada redeploy en Render. Supabase Storage ofrece persistencia gratuita y URLs públicas para los audios.

### ¿Por qué autenticación personalizada?
Aunque Supabase tiene su propio sistema de auth, decidí implementar JWT personalizado para tener mayor control y demostrar conocimiento en autenticación custom.

### ¿Por qué Next.js estático en lugar de SSR?
Para simplificar el despliegue en Render y poder servir todo desde un solo servidor en el puerto 3000, evitando complejidad de infraestructura.

### ¿Por qué ElevenLabs SDK oficial?
Migramos de axios directo al SDK oficial de ElevenLabs para mejor manejo de streams, autenticación y errores.

## 🚀 Mejoras Futuras

### Alta Prioridad
- **Sistema de notificaciones**: Notificaciones en tiempo real cuando alguien comparte un texto contigo o reproduce tu audio
- **Compartir por WhatsApp a otros usuarios**: Actualmente solo se puede enviar a uno mismo, habilitar envío a cualquier número
- **Auth persistence en frontend**: Implementar persistencia de sesión en el cliente para mejor UX (no implementado por tiempo)

### Media Prioridad
- **Sistema de recomendaciones inteligente**: Usar el historial de reproducciones y favoritos para sugerir textos similares
- **Chat conversacional con MCP**: Integrar Model Context Protocol de Kapso para conversaciones interactivas por WhatsApp
- **Rate limiting**: Protección contra abuso y bots maliciosos en los endpoints de la API

### Baja Prioridad
- **Múltiples voces**: Expandir opciones de voces más allá de masculina/femenina
- **Exportación de analytics**: Descargar reportes en CSV/PDF
- **Modo offline**: Cachear audios para reproducción sin conexión
- **API pública**: Documentar y exponer API para integraciones de terceros

## 🛠️ Stack Tecnológico Completo

### Backend
- Node.js 18+
- Express.js
- Supabase (PostgreSQL + Storage)
- JWT (jsonwebtoken)
- bcryptjs
- ElevenLabs SDK (@elevenlabs/elevenlabs-js)
- Kapso SDK (@kapso/whatsapp-cloud-api)
- ES Modules

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (iconos)

### DevOps
- Render (hosting)
- Supabase (base de datos + storage)
- Git (control de versiones)

## 📝 Notas Importantes

1. **Primer arranque**: En Render gratuito, la primera carga tarda ~1 minuto
2. **Audios**: Se guardan en Supabase Storage (bucket `audiofiles`)
3. **Base de datos**: Ejecutar `db.sql` en Supabase antes de usar
4. **WhatsApp**: Requiere verificación de número y ventana de 24 horas activa
5. **ElevenLabs**: Requiere plan de pago para funcionar desde servidores

## 🐛 Troubleshooting

### El servidor no arranca
- Verifica que todas las variables de entorno estén configuradas
- Revisa que el puerto 3000 esté disponible
- Comprueba las credenciales de Supabase

### No se generan audios
- Verifica tu API key de ElevenLabs
- **Importante**: El tier gratuito de ElevenLabs no funciona desde servidores, necesitas plan de pago
- Comprueba que el bucket `audiofiles` exista en Supabase Storage
- Revisa los logs de error del servidor

### Error al enviar por WhatsApp
- **"Sesión expirada"**: Envía "hola" al número de TXT.Lib en WhatsApp para reactivar la ventana de 24 horas
- Verifica que tu número esté verificado en la app
- Comprueba las credenciales de Kapso

### Los audios no se reproducen
- Verifica que el bucket `audiofiles` sea público en Supabase
- Comprueba la URL del audio en la consola del navegador
- Para audios legacy (almacenados localmente), pueden haberse perdido con un redeploy

## 👨‍💻 Desarrollo

Este proyecto fue desarrollado por **Julián Catalán** como parte del proceso de entrevista para **SALMA**.

## 📄 Licencia

Este proyecto es de código privado para evaluación técnica.

---

**¡Gracias por revisar TXT.Lib!** 🎉