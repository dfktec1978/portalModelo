import { Suspense } from "react";
import dynamic from "next/dynamic";

const ClassificadosClient = dynamic(() => import("./ClassificadosClient"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">Carregando classificados...</div>}>
      <ClassificadosClient />
    </Suspense>
  );
}
