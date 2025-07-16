"use client";
import { Input } from "@/components/input";
import style from "./form.module.css";

export const SignInForm = () => {
  return (
    <form action="" className={style.form}>
      <Input />
      <Input />
      <button>Entrar</button>
    </form>
  );
};
