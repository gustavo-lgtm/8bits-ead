// app/page.tsx
import { redirect } from "next/navigation";

export const dynamic = "force-static";

export default function Home() {
  redirect("/cursos");
}
