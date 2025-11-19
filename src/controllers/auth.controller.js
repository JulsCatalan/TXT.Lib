import bcrypt from "bcrypt";
import { supabase } from '../config/supabase.js';
import { createToken } from "../middlewares/jwt.js";

// ============================
// REGISTER USER
// ============================
export const register_user = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log(req.body)

    // Validar campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Validar si ya existe el correo
    const { data: existing_email } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing_email) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    // Validar si ya existe el username
    const { data: existing_username } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (existing_username) {
      return res.status(409).json({ error: "El username ya está en uso" });
    }

    // Encriptar contraseña
    const hashed_password = await bcrypt.hash(password, 10);

    // Crear usuario en la DB
    const { data: new_user, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          email,
          password_hash: hashed_password,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al registrar usuario" });
    }

    // Crear token JWT
    const token = createToken({ id: new_user.id });

    // Guardar token en cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: new_user.id,
        username: new_user.username,
        email: new_user.email,
      },
    });
  } catch (err) {
    console.error("Error register_user:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ============================
// LOGIN USER
// ============================
export const login_user = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email y contraseña requeridos" });

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!user)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch)
      return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = createToken({ id: user.id });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error login_user:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ============================
// LOGOUT
// ============================
export const logout_user = (req, res) => {
  res.clearCookie("token", { path: "/" });
  return res.status(200).json({ message: "Sesión cerrada" });
};
