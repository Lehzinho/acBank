"use client";

// Imports - Dependências externas
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

// Imports - Dependências internas
import { Input } from "@/components/input";
import { AuthContext } from "@/context/AuthContext";
import style from "./form.module.css";

// VALIDAÇÃO COM ZOD
const schema = z
  .object({
    nome: z.string().min(1, "O nome é obrigatório"),
    email: z
      .string()
      .email("Digite um email válido.")
      .min(1, "O email é obrigatório."),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"], // Especifica onde mostrar o erro
  });

type FormData = z.infer<typeof schema>;

export const SignUpForm = () => {
  // HOOKS E CONTEXTO
  const { createUser } = useContext(AuthContext);
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
   * Processa o cadastro do usuário
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @param nome - Nome do usuário
   */
  async function handleSignUp({ email, password, nome }: FormData) {
    try {
      await createUser(email, password, nome);
    } catch (error: any) {
      toast(error.response.data.message);
    }
  }

  // RENDERIZAÇÃO CONDICIONAL
  // Não renderizar até que o cliente esteja pronto (evita hydration mismatch)
  if (!isClient) {
    return (
      <div className={style.form}>
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <form className={style.form} onSubmit={handleSubmit(handleSignUp)}>
      {/* Campo de Nome */}
      <Input
        label="Nome:"
        placeholder="Entre seu Nome"
        name="nome"
        type="nome"
        register={register}
        error={errors.nome?.message}
      />
      <Input
        label="Email:"
        placeholder="Entre seu Email"
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
      <Input
        type="password"
        label="Confirme a Senha:"
        placeholder="Confirme a senha"
        name="confirmPassword"
        register={register}
        error={errors.confirmPassword?.message}
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Carregando..." : "Registrar"}
      </button>
      <Link href="/signin">
        Já possue uma conta faça o <span>Login</span>
      </Link>
    </form>
  );
};
