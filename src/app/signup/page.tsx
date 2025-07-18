import { SignUpForm } from "./components/form";
import styles from "./signup.module.css";

export default async function SignUp() {
  return (
    <main className={styles.Container}>
      <SignUpForm />
    </main>
  );
}
