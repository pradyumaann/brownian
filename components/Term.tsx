/** A glossary term from Jargon Buster. Opens a small pop-up anchored to it (`TermPop`, installed once in the layout)
 *  with a plain-language definition, today's number and a link to the full entry on /learn. TermPop sets aria-expanded. */
export function Term({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <button type="button" className="bw-term" data-term={id} aria-haspopup="dialog" aria-expanded={false}>
      {children}
    </button>
  );
}
