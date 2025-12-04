import NewsReader from "@/components/NewsReader";

export default function NewsIdPage({ params }: { params: { id: string } }) {
  const { id } = params;
  // render full page reader for direct links
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <NewsReader id={id} />
      </div>
    </div>
  );
}
