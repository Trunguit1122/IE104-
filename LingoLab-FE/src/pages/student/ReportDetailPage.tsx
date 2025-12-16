import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  FileText,
  Mic,
  Download,
  Bot,
  CheckCircle,
  Lightbulb,
  Clock,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { ROUTES } from "@/constants";
import { attemptsApi, feedbackApi, scoresApi, attemptMediaApi, practiceApi } from "@/services/api";
import type { Attempt, Feedback, Score } from "@/types";

// Helper to extract sub-score value
const getSubScore = (subScores: Array<{label: string; value: number}> | undefined, label: string): number | undefined => {
  if (!subScores) return undefined;
  const found = subScores.find(s => s.label.toLowerCase().includes(label.toLowerCase()));
  return found?.value;
};

export function ReportDetailPage() {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!submissionId) {
        setError("No submission ID provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch attempt details
        const attemptData = await attemptsApi.getById(submissionId);
        setAttempt(attemptData);

        // Fetch audio URL for speaking attempts
        if (attemptData.skillType === 'speaking') {
          try {
            const mediaList = await attemptMediaApi.getByAttemptId(submissionId);
            const audioMedia = mediaList.find(m => m.mediaType === 'audio');
            if (audioMedia?.storageUrl) {
              const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
              const url = audioMedia.storageUrl.startsWith('http') 
                ? audioMedia.storageUrl 
                : `${baseUrl}/uploads/${audioMedia.storageUrl}`;
              setAudioUrl(url);
            }
          } catch {
            // No audio found
          }
        }

        // Fetch scores for this attempt
        try {
          const scoreData = await scoresApi.getByAttemptId(submissionId);
          // API returns single object or array
          setScore(Array.isArray(scoreData) ? scoreData[0] : scoreData);
        } catch {
          setScore(null);
        }

        // Fetch feedback for this attempt
        try {
          const feedbackData = await feedbackApi.getByAttemptId(submissionId);
          setFeedbacks(Array.isArray(feedbackData) ? feedbackData : [feedbackData]);
        } catch {
          setFeedbacks([]);
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Failed to load report");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [submissionId]);

  const handleBack = () => {
    navigate(ROUTES.STUDENT.DASHBOARD);
  };

  const handleRetake = async () => {
    if (!submissionId || !attempt) return;
    
    try {
      const result = await practiceApi.retakePractice(submissionId);
      
      if (result.success && result.newAttemptId) {
        // Navigate to the appropriate practice page based on skill type
        const skillType = attempt.skillType;
        if (skillType === 'writing') {
          navigate(`/student/submit/writing/${result.promptId}?attemptId=${result.newAttemptId}`);
        } else if (skillType === 'speaking') {
          navigate(`/student/submit/speaking/${result.promptId}?attemptId=${result.newAttemptId}`);
        }
      } else {
        console.error('Retake failed:', result.message);
      }
    } catch (error) {
      console.error('Failed to retake practice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-slate-500">{error || "Report not found"}</p>
        <Button variant="ghost" onClick={handleBack} className="mt-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Get feedback by type (API returns 'type' field, not 'feedbackType')
  const aiFeedback = feedbacks.find(f => f.type === 'ai_feedback' || f.type === 'ai');
  const teacherFeedback = feedbacks.find(f => f.type === 'teacher_comment' || f.type === 'teacher');
  
  // Extract sub-scores for display
  const subScores = (score as any)?.subScores as Array<{label: string; value: number}> | undefined;
  const detailedFeedback = (score as any)?.detailedFeedback as {
    strengths?: string[];
    suggestions?: string[];
    areasForImprovement?: string[];
  } | undefined;

  // Map status to display status
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "scored": return "success";
      case "submitted": return "warning";
      case "in_progress": return "default";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scored": return "GRADED";
      case "submitted": return "SUBMITTED";
      case "in_progress": return "IN PROGRESS";
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm text-slate-400">{attempt.skillType?.toUpperCase()} Practice</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              {attempt.prompt?.title || `${attempt.skillType} Practice`}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <BadgeStatus
                variant={getStatusVariant(attempt.status)}
              >
                {getStatusLabel(attempt.status)}
              </BadgeStatus>
              {attempt.submittedAt && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock size={14} />
                  Submitted on{" "}
                  {new Date(attempt.submittedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            className="gap-2 border-slate-300"
            onClick={() => window.print()}
          >
            <Download size={16} />
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overall Score Card */}
          {score && (
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot size={32} />
                  <div>
                    <h2 className="text-lg font-bold">AI Assessment</h2>
                    <p className="text-purple-200 text-sm">Overall Band Score</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-bold">{score.overallBand}</p>
                  <p className="text-purple-200 text-sm">/9.0</p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Scores */}
          {score && subScores && subScores.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-600" />
                Detailed Band Scores
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {subScores.map((subScore, index) => {
                  const colors = ['purple', 'blue', 'emerald', 'amber', 'indigo', 'pink'];
                  const color = colors[index % colors.length];
                  return (
                    <div key={subScore.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {subScore.label}
                        </span>
                        <span className={`text-lg font-bold text-${color}-600`}>
                          {subScore.value.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`bg-${color}-600 h-2 rounded-full`}
                          style={{
                            width: `${(subScore.value / 9) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submission Content - Writing */}
          {attempt.textContent && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-slate-600" />
                Your Submission
              </h3>
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {attempt.textContent}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                <span>Word count: {attempt.textContent.split(/\s+/).filter(Boolean).length}</span>
              </div>
            </div>
          )}

          {/* Submission Content - Speaking Audio */}
          {attempt.skillType === 'speaking' && audioUrl && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Mic size={20} className="text-purple-600" />
                Your Recording
              </h3>
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                <source src={audioUrl} type="audio/webm" />
                Trình duyệt không hỗ trợ audio player.
              </audio>
            </div>
          )}
        </div>

        {/* Sidebar - Feedback */}
        <div className="space-y-6">
          {/* AI Feedback from Score */}
          {score && (score as any).feedback && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Bot size={20} className="text-purple-600" />
                AI Feedback
              </h3>
              <p className="text-slate-600 text-sm mb-4">{(score as any).feedback}</p>

              {detailedFeedback?.strengths && detailedFeedback.strengths.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {detailedFeedback.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailedFeedback?.areasForImprovement && detailedFeedback.areasForImprovement.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {detailedFeedback.areasForImprovement.map((weakness, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailedFeedback?.suggestions && detailedFeedback.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Lightbulb size={16} className="text-blue-500" />
                    Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {detailedFeedback.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Teacher Feedback */}
          {teacherFeedback && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" />
                Teacher Feedback
              </h3>
              <p className="text-slate-600 text-sm">{teacherFeedback.content}</p>
            </div>
          )}

          {/* No feedback yet */}
          {!score && !teacherFeedback && attempt.status !== "scored" && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
              <Clock size={32} className="mx-auto text-slate-400 mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pending Review</h3>
              <p className="text-slate-500 text-sm">
                Your submission is being reviewed. Check back soon for your results.
              </p>
            </div>
          )}

          {/* Retake Button */}
          <div className="mt-6">
            <Button
              onClick={handleRetake}
              variant="outline"
              className="w-full sm:w-auto border-purple-600 text-purple-600 hover:bg-purple-50 font-medium gap-2"
            >
              <RotateCcw size={16} />
              Làm lại
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDetailPage;