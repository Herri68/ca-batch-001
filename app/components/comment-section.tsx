import { useRef } from "react";
import { useFetcher } from "react-router";
import { Trash2, UserCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { UserRole } from "~/db/schema";

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  userName: string;
  userAvatarUrl: string | null;
  userRole: UserRole;
};

interface CommentSectionProps {
  comments: Comment[];
  currentUserId: number;
  instructorId: number;
  lessonId: number;
}

export function CommentSection({
  comments,
  currentUserId,
  instructorId,
  lessonId,
}: CommentSectionProps) {
  const addFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInstructor = currentUserId === instructorId;

  const isSubmitting = addFetcher.state !== "idle";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const content = (form.elements.namedItem("content") as HTMLTextAreaElement).value.trim();
    if (!content) return;
    addFetcher.submit({ intent: "add-comment", content }, { method: "POST" });
    if (textareaRef.current) textareaRef.current.value = "";
  }

  function handleDelete(commentId: number) {
    deleteFetcher.submit(
      { intent: "delete-comment", commentId: String(commentId) },
      { method: "POST" }
    );
  }

  const optimisticIds = new Set(
    deleteFetcher.state !== "idle" && deleteFetcher.formData
      ? [Number(deleteFetcher.formData.get("commentId"))]
      : []
  );

  const visibleComments = comments.filter((c) => !optimisticIds.has(c.id));

  return (
    <div className="mt-10 space-y-6">
      <h3 className="text-lg font-semibold">Komentar ({visibleComments.length})</h3>

      <div className="space-y-4">
        {visibleComments.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada komentar. Jadilah yang pertama!</p>
        )}
        {visibleComments.map((comment) => {
          const canDelete = isInstructor || comment.userId === currentUserId;
          const isCommentFromInstructor = comment.userId === instructorId;
          return (
            <div key={comment.id} className="flex gap-3">
              <div className="mt-0.5 shrink-0">
                {comment.userAvatarUrl ? (
                  <img
                    src={comment.userAvatarUrl}
                    alt={comment.userName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.userName}</span>
                  {isCommentFromInstructor && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Instruktur
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className={cn(
                        "ml-auto text-muted-foreground hover:text-destructive transition-colors",
                        deleteFetcher.state !== "idle" && "opacity-50 pointer-events-none"
                      )}
                      aria-label="Hapus komentar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          ref={textareaRef}
          name="content"
          placeholder="Tulis komentar atau pertanyaan..."
          rows={3}
          maxLength={2000}
          required
          disabled={isSubmitting}
        />
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Mengirim..." : "Kirim Komentar"}
        </Button>
      </form>
    </div>
  );
}
