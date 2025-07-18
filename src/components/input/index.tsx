// Imports - Dependências externas
import { useId } from "react";
import { RegisterOptions, UseFormRegister } from "react-hook-form";

// Imports - Dependências internas
import styles from "./input.module.css";

// INTERFACES
interface InputProps {
  label: string;
  name: string;
  placeholder: string;
  type: string;
  error?: string;
  register: UseFormRegister<any>;
  rules?: RegisterOptions;
}

export const Input = ({
  name,
  label,
  placeholder,
  type,
  rules,
  error,
  register,
}: InputProps) => {
  // HOOKS
  // Gera um ID único para o input baseado no nome
  const inputId = `input-${name}`;

  return (
    <div className={styles.Container}>
      <label htmlFor={inputId}>{label}</label>
      <input
        type={type}
        id={inputId}
        placeholder={placeholder}
        {...register(name, rules)}
      />
      {error && <p>{error}</p>}
    </div>
  );
};
