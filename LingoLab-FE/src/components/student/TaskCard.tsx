import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { RotateCcw } from "lucide-react";

export interface TaskCardProps {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  image?: string;
  type?: 'WRITING' | 'SPEAKING';
  isGraded?: boolean;
  isSubmitted?: boolean;
  score?: number;
  attemptCount?: number;
  onAction: (id: string) => void;
}

export function TaskCard({
  id,
  title,
  className,
  dueDate,
  image,
  type,
  isGraded = false,
  isSubmitted = false,
  score,
  attemptCount = 0,
  onAction,
}: TaskCardProps) {
  const defaultImage =
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60";

  const getButtonLabel = () => {
    // If submitted (even if not graded yet), show "View Feedback"
    if (isSubmitted) return "View Feedback";
    return "Submit Work";
  };

  const getButtonStyle = () => {
    if (isSubmitted) {
      return "bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none";
    }
    return "bg-purple-600 hover:bg-purple-700 shadow-purple-200";
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 rounded-xl bg-white p-5 border border-slate-200 shadow-sm hover:border-purple-200 transition-colors">
      <div className="flex flex-[2] flex-col justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            IELTS {type || 'PRACTICE'}
          </p>
          <h3 className="text-lg font-bold text-slate-900 leading-tight mt-1">
            {title}
          </h3>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {isGraded && score !== undefined ? (
              <BadgeStatus variant="success">Score: {score}/9.0</BadgeStatus>
            ) : isSubmitted ? (
              <BadgeStatus variant="warning">Submitted</BadgeStatus>
            ) : (
              <span className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Due:{" "}
                {new Date(dueDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
            {/* Show attempt count if has any attempts */}
            {attemptCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <RotateCcw size={12} />
                {attemptCount} lần làm
              </span>
            )}
          </div>
        </div>

        <Button
          className={`w-fit h-9 text-sm px-6 ${getButtonStyle()}`}
          onClick={() => onAction(id)}
        >
          {getButtonLabel()}
        </Button>
      </div>

      {/* Task Image */}
      <div
        className="w-full sm:w-48 bg-slate-100 bg-center bg-cover bg-no-repeat rounded-lg min-h-[120px]"
        style={{
          backgroundImage: `url(${image || defaultImage})`,
        }}
      />
    </div>
  );
}

export default TaskCard;

