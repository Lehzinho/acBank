import { ReactNode } from "react";
import styles from "./modal.module.css";
export const Modal = ({ children }: { children: ReactNode }) => {
  return <div className={styles.Modal}>{children}</div>;
};
