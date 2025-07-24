"use client";

// Imports - Dependências externas
import { createContext, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Imports - Dependências internas
import { UserProps } from "@/interfaces/user.type";
import { createNewUser, getUser } from "@/services/userServices";
import { createNewSession, getSession } from "@/services/sessionServices";

// INTERFACES E TIPOS
interface userProviderProps {
  user: UserProps | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  createUser: (email: string, password: string, nome: string) => Promise<void>;
  updateUserAccountValue(value: number): void;
  logout: () => void;
}

// CONTEXT CREATION
export const AuthContext = createContext<userProviderProps>(
  {} as userProviderProps
);

export function AuthProvider({ children }: { children: ReactNode }) {
  // ESTADO DO COMPONENTE
  const [user, setUser] = useState<UserProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  // HOOKS DO NEXT.JS
  const router = useRouter();

  // EFEITOS
  // Verifica a sessão automaticamente quando o componente é montado
  useEffect(() => {
    checkSession();
  }, []);

  function updateUserAccountValue(value: number) {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, saldo: value };
    });
  }

  // FUNÇÕES
  /**
   * Verifica se existe uma sessão válida no servidor
   * Se válida, busca os dados do usuário
   */
  const checkSession = async () => {
    try {
      const data = await getSession();
      if (data.valid) {
        await fetchUserData(data.email);
      }
    } catch (error: any) {
      console.log(error.response?.data?.message || "Erro ao verificar sessão");
    } finally {
      setLoading(false);
      setSessionChecked(true);
    }
  };

  /**
   *
   * Busca os dados completos do usuário pelo email
   * @param email - Email do usuário
   */
  const fetchUserData = async (email: string) => {
    try {
      const data = await getUser(email);
      setUser(data);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erro ao buscar dados do usuário"
      );
    }
  };

  /**
   * Realiza o login do usuário
   * @param email - Email do usuário
   * @param password - Senha do usuário
   */
  const login = async (email: string, password: string) => {
    try {
      await createNewSession(email, password);
      await fetchUserData(email);
      router.push("/home");
    } catch (error: any) {
      toast.error("Erro ao fazer login verifique suas credenciais");
    }
  };

  /**
   * Cria um novo usuário e realiza login automaticamente
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @param nome - Nome do usuário
   */
  const createUser = async (email: string, password: string, nome: string) => {
    try {
      const data = await createNewUser(nome, email, password);
      await fetchUserData(data.email);
      await login(email, password);
      toast.success("Usuário criado com sucesso!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao criar usuário");
    }
  };

  /**
   * Realiza o logout do usuário
   */
  const logout = async () => {
    try {
      // Limpa o cookie de sessão
      await fetch("/api/v1/logout", {
        method: "POST",
      });

      // Limpa o estado do usuário
      setUser(null);

      // Importante: manter sessionChecked como true após logout
      // para evitar loop infinito de loading
      setSessionChecked(true);
      setLoading(false);

      // Redireciona para signin
      router.push("/signin");

      toast("Logout realizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  // Renderiza loading enquanto verifica a sessão
  if (loading || !sessionChecked) {
    return (
      <div>
        <div></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        createUser,
        logout,
        updateUserAccountValue,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
