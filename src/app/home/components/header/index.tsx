"use client";
import { AuthContext } from "@/context/AuthContext";
import { formatarReal } from "@/utils/formataReal";
import { useContext } from "react";
import styles from "./header.module.css";
import { IoLogOutOutline } from "react-icons/io5";

export const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className={styles.Header}>
      <div>
        <div>
          <h3>{user?.nome ?? "Carregando Usuario"}</h3>
          <p>Saldo: {formatarReal(user?.saldo as number)}</p>
        </div>
        <button onClick={logout}>
          Logout <IoLogOutOutline size={28} />
        </button>
      </div>
    </header>
  );
};
