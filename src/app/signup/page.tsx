import { getSession } from "@/services/sessionServices";
import { SignUpForm } from "./components/form";
import styles from "./signup.module.css";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function SignUp() {
  const cookieStore = (await cookies()).toString();
  const data = await getSession(cookieStore);
  if (data.valid) {
    redirect("/home");
  }
  return (
    <main className={styles.Container}>
      <SignUpForm />
    </main>
  );
}
