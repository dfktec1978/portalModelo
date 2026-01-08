import { Suspense } from "react";
import AdminProfissionaisClient from "./AdminProfissionaisClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">Carregando profissionais...</div>}>
      <AdminProfissionaisClient />
    </Suspense>
  );
}
