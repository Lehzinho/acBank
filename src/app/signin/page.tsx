import { getSession } from "@/services/sessionServices";
import { SignInForm } from "./components/form";
import styles from "./signin.module.css";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Signin() {
  const cookieStore = (await cookies()).toString();
  const data = await getSession(cookieStore);
  if (data.valid) {
    redirect("/home");
  }
  return (
    <section className={styles.Container}>
      <SignInForm />
    </section>
  );
}
