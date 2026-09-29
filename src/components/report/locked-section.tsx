import { Section } from "./section";

interface Props {
  id: string;
  title: string;
  description: string;
  teaser: React.ReactNode;
  bullets: string[];
}

/** Placeholder shown in place of a pro section on free reports. */
export function LockedSection({ id, title, description, teaser, bullets }: Props) {
  return (
    <Section id={id} title={title} description={description} badge="pro">
      <div className="card relative overflow-hidden p-5">
        <div className="absolute inset-0 pointer-events-none opacity-30" aria-hidden>
          <div className="grid grid-cols-12 gap-1 h-full items-end px-4 pb-4">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="rounded-t bg-line" style={{ height: `${20 + ((i * 37) % 60)}%` }} />
            ))}
          </div>
        </div>
        <div className="relative">
          <p className="font-medium">{teaser}</p>
          <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span aria-hidden>•</span>
                {b}
              </li>
            ))}
          </ul>
          <a href="#unlock" className="inline-block mt-4 text-sm font-medium text-accent hover:underline">
            Unlock the full report ↓
          </a>
        </div>
      </div>
    </Section>
  );
}
