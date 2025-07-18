import { HTMLAttributes, ReactNode } from "react";
import styles from "./container.module.css";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Container = ({ children }: ContainerProps) => {
  return <div className={styles.Container}>{children}</div>;
};
