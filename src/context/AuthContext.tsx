"use client";

// Imports - Dependências externas
import { createContext, ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";

// Imports - Dependências internas
import { UserProps } from "@/interfaces/user.type";
import { createNewUser, getUser } from "@/services/userServices";
import { createNewSession, getNewSession } from "@/services/sessionServices";

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

  // HOOKS DO NEXT.JS
  const router = useRouter();
  const pathname = usePathname();

  // ROTAS PÚBLICAS (acessíveis sem autenticação)
  const publicRoutes = ["/signin", "/signup"];

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

  // Controla o redirecionamento baseado na autenticação
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!user && !isPublicRoute) {
        // Se não há usuário e não está em rota pública, redireciona para signin
        router.push("/signin");
      } else if (user && isPublicRoute) {
        // Se há usuário e está em rota pública, redireciona para home ou dashboard
        router.push("/home");
      }
    }
  }, [user, loading, pathname, router]);

  // FUNÇÕES
  /**
   * Verifica se existe uma sessão válida no servidor
   * Se válida, busca os dados do usuário
   */
  const checkSession = async () => {
    try {
      const { data } = await getNewSession();
      if (data.valid) {
        await fetchUserData(data.email);
      }
    } catch (error: any) {
      console.log(error.response?.data?.message || "Erro ao verificar sessão");
    } finally {
      setLoading(false);
    }
  };

  /**
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
      router.push("/home"); // Redireciona para home após login
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao fazer login");
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
  const logout = () => {
    setUser(null);
    router.push("/signin");
    toast("Logout realizado com sucesso!");
  };

  // Renderiza loading enquanto verifica a sessão
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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
