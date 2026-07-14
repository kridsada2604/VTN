export function FormCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="card p-5 sm:p-6">
    <div className="mb-5"><h2 className="text-lg font-black">{title}</h2>{description && <p className="mt-1 text-sm text-gray-500">{description}</p>}</div>
    {children}
  </section>;
}
