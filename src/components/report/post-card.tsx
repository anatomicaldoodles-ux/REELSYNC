import type { PostSummary } from "@/lib/profile/report";
import { fmtCompact, fmtDate } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = { image: "Photo", video: "Video", carousel: "Carousel" };

export function PostCard({ post, timeZone, rank }: { post: PostSummary; timeZone?: string; rank?: number }) {
  const label = post.productType === "reel" ? "Reel" : TYPE_LABEL[post.type] ?? post.type;
  return (
    <a href={post.url} target="_blank" rel="noreferrer noopener" className="card p-3 flex gap-3 hover:border-accent/60 transition">
      <div className="h-16 w-16 shrink-0 rounded-lg bg-line overflow-hidden flex items-center justify-center text-faint text-xs">
        {post.displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.displayUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
        ) : (
          label
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-faint">
          {rank !== undefined && <span>#{rank}</span>}
          <span>{label}</span>
          <span>·</span>
          <span>{fmtDate(Math.floor(new Date(post.timestamp).getTime() / 1000), timeZone)}</span>
          {post.isSponsored && <span className="px-1 rounded bg-line text-muted">sponsored</span>}
        </div>
        <p className="text-sm truncate mt-0.5">{post.caption || <span className="text-faint">No caption</span>}</p>
        <div className="text-xs text-muted mt-1 tabular">
          ♥ {fmtCompact(post.likes)} · 💬 {fmtCompact(post.comments)}
          {post.views !== undefined && ` · ▶ ${fmtCompact(post.views)}`}
        </div>
      </div>
    </a>
  );
}
