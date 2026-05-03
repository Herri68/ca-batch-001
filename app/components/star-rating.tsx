import { useState } from "react";
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
  const [hover, setHover] = useState(0);
  const displayRating = averageRating ?? 0;

  function handleRate(star: number) {
    if (!interactive || !courseId) return;
    fetcher.submit({ intent: "rate", rating: String(star) }, { method: "POST" });
  }

  if (interactive) {
    const activeRating = hover || userRating || 0;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= activeRating;
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHover(star)}
                className="cursor-pointer p-0.5 transition-transform hover:scale-110"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    filled ? "fill-yellow-400 text-yellow-400" : "fill-none text-muted-foreground"
                  )}
                />
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {userRating
            ? `Your rating: ${userRating} ★`
            : "Click a star to rate this course"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(displayRating);
          return (
            <Star
              key={star}
              className={cn(
                "h-4 w-4",
                filled ? "fill-yellow-400 text-yellow-400" : "fill-none text-muted-foreground"
              )}
            />
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
