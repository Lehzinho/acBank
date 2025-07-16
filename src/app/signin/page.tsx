import { requireGuest } from "@/utils/auth";
import { SignInForm } from "./components/form";

export default async function Signin() {
  await requireGuest();

  return (
    <section>
      <SignInForm />
    </section>
  );
}
