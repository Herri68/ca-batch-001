import { Star } from "lucide-react";
import { useFetcher } from "react-router";
import { cn } from "~/lib/utils";

interface StarRatingProps {
  courseId?: number;
  averageRating: number | null;
  ratingCount: number;
  userRating?: number | null;
  interactive?: boolean;
}

export function StarRating({
  courseId,
  averageRating,
  ratingCount,
  userRating,
  interactive = false,
}: StarRatingProps) {
  const fetcher = useFetcher();
  const displayRating = averageRating ?? 0;

  function handleRate(star: number) {
    if (!interactive || !courseId) return;
    fetcher.submit({ intent: "rate", rating: String(star) }, { method: "POST" });
  }

  const activeRating = interactive ? (userRating ?? 0) : displayRating;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = interactive ? star <= activeRating : star <= Math.round(displayRating);
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => handleRate(star)}
              className={cn(
                "transition-colors",
                interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
              )}
              aria-label={interactive ? `Rate ${star} stars` : undefined}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  filled ? "fill-yellow-400 text-yellow-400" : "fill-none text-muted-foreground"
                )}
              />
            </button>
          );
        })}
      </div>
      {ratingCount > 0 ? (
        <span className="text-sm text-muted-foreground">
          {averageRating?.toFixed(1)} ({ratingCount})
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">Belum ada rating</span>
      )}
    </div>
  );
}
