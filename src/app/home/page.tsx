import { requireAuth } from "@/utils/auth";

export default async function Home() {
  await requireAuth("/signin");
  return <div>Home</div>;
}
