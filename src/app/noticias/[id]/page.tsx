import NewsReader from "@/components/NewsReader";

export default async function NewsIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id === 'undefined') {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="p-6">Notícia não encontrada.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <NewsReader id={id} />
      </div>
    </div>
  );
}
