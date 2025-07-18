"use client";

// Imports - Dependências externas
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Imports - Dependências internas
import { Input } from "@/components/input";
import { AuthContext } from "@/context/AuthContext";
import style from "./form.module.css";

// VALIDAÇÃO COM ZOD
const schema = z.object({
  password: z.string().min(1, "O campo senha é obrigatório"),
  email: z
    .string()
    .email("Digite um email válido.")
    .min(1, "O email é obrigatório."),
});

type FormData = z.infer<typeof schema>;

export const SignInForm = () => {
  // HOOKS E CONTEXTO
  const { login } = useContext(AuthContext);
  const router = useRouter();

  // ESTADO DO COMPONENTE
  const [isClient, setIsClient] = useState(false);

  // REACT HOOK FORM
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // EFEITOS
  // Marca quando o componente está hidratado no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // HANDLERS
  /**
   * Processa o login do usuário
   * @param email - Email do usuário
   * @param password - Senha do usuário
   */
  async function handleLogin({ email, password }: FormData) {
    await login(email, password);
    router.push("/home");
  }

  // Não renderizar até que o cliente esteja pronto (evita hidration mismatch)
  if (!isClient) {
    return (
      <div className={style.form}>
        <div>Carregando...</div>
      </div>
    );
  }

  // RENDER DO FORMULÁRIO
  return (
    <form className={style.form} onSubmit={handleSubmit(handleLogin)}>
      <Input
        label="E-mail:"
        placeholder="Digite seu e-mail"
        name="email"
        type="email"
        register={register}
        error={errors.email?.message}
      />
      <Input
        type="password"
        label="Senha:"
        placeholder="Digite sua senha"
        name="password"
        register={register}
        error={errors.password?.message}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Carregando..." : "Entrar"}
      </button>
      <Link href="/signup">
        Não possui conta? <span>Cadastre-se</span>
      </Link>
    </form>
  );
};
