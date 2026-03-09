import { legalDocuments, type LegalDocument } from "@/lib/data/animg";

type LegalDocKey = "terms" | "privacy" | "refund";

export function LegalPage({ docKey }: { docKey: LegalDocKey }) {
  const doc: LegalDocument = legalDocuments[docKey];

  return (
    <div className="animg-container max-w-5xl space-y-6">
      <header>
        <h1 className="text-4xl font-bold">{doc.title}</h1>
        <p className="mt-2 animg-muted">{doc.lastUpdated}</p>
      </header>

      <section className="animg-card p-6 md:p-8">
        <div className="animg-markdown space-y-4">
          {doc.sections.map((section) => (
            <article key={section.title}>
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets?.length ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
