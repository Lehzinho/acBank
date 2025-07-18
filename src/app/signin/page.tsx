import { SignInForm } from "./components/form";
import styles from "./signin.module.css";

export default async function Signin() {
  return (
    <section className={styles.Container}>
      <SignInForm />
    </section>
  );
}
