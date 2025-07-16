// utils/auth.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface SessionData {
  valid: boolean;
  user?: any; // Substitua por sua interface de usuário
}

export async function checkSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_id");

  if (!sessionCookie) {
    return null;
  }

  try {
    const response = await fetch(
      `${process.env.API_URL || "http://localhost:3000"}/api/v1/sessions`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionCookie.value}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Session check error:", error);
    return null;
  }
}

// Função para proteger páginas que requerem autenticação
export async function requireAuth(redirectTo: string = "/signin") {
  const session = await checkSession();

  if (!session || !session.valid) {
    redirect(redirectTo);
  }

  return session;
}

// Função para redirecionar usuários já autenticados para home
export async function requireGuest(redirectTo: string = "/home") {
  const session = await checkSession();

  if (session && session.valid) {
    redirect(redirectTo);
  }

  return session;
}

// Função para verificar autenticação sem redirecionar
export async function getAuthStatus(): Promise<{
  isAuthenticated: boolean;
  session: SessionData | null;
}> {
  const session = await checkSession();

  return {
    isAuthenticated: !!(session && session.valid),
    session,
  };
}

// Função para obter apenas os dados do usuário se autenticado
export async function getCurrentUser() {
  const session = await checkSession();

  if (session && session.valid) {
    return session.user;
  }

  return null;
}
