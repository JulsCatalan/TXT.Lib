// middlewares/jwt.js
import jwt from "jsonwebtoken";

// Middleware de autenticación
export const validateToken = (req, res, next) => {
  console.log('🔍 Validando token...');
  
  const token = req.cookies.token;
  
  if (!token) {
    console.log('❌ No se encontró token en las cookies');
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido para usuario');
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ Error al validar token:', error.message);
    return res.status(401).json({ error: "Token inválido" });
  }
};

// Crear token
export const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
};