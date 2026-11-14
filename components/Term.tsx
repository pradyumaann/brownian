/** A glossary term from Jargon Buster. Opens its definition, with today's number, in the Sheet. */
export function Term({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <button type="button" className="bw-term" data-term={id}>
      {children}
    </button>
  );
}
