import NewsReader from "@/components/NewsReader";

export default function NewsIdPage({ params }: { params: { id: string } }) {
  const { id } = params;
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
