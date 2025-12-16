import { useState } from "react";
import { useNavigate } from "react-router";
import {
  X,
  FileText,
  Mic,
  Download,
  Bot,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Button } from "@/components/ui/button";

interface SubScore {
  label: string;
  value: number;
}

interface AIFeedback {
  overallBand: number;
  subScores: SubScore[];
  feedback: string;
  detailedFeedback?: {
    strengths: string[];
    areasForImprovement: string[];
    suggestions: string[];
  };
}

interface FeedbackSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId?: string;
  assignmentTitle: string;
  assignmentClassName: string;
  submissionStatus: "PENDING" | "SUBMITTED" | "GRADED" | "NOT_STARTED";
  submittedAt?: string;
  mediaType?: string;
  writingContent?: string;
  audioUrl?: string;
  aiFeedback?: AIFeedback;
  onRetake?: () => void;
}

export function FeedbackSidebar({
  isOpen,
  onClose,
  submissionId,
  assignmentTitle,
  assignmentClassName,
  submissionStatus,
  submittedAt,
  mediaType,
  writingContent,
  audioUrl,
  aiFeedback,
  onRetake,
}: FeedbackSidebarProps) {
  const navigate = useNavigate();
  const [showSubmission, setShowSubmission] = useState(false);

  if (!isOpen) return null;

  const handleViewFullReport = () => {
    if (submissionId) {
      navigate(`/student/report/${submissionId}`);
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex justify-end'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity'
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside className='relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-slate-100'>
          <h2 className='text-xl font-bold text-slate-900'>Feedback Details</h2>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors'
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className='flex-1 p-6 space-y-8 overflow-y-auto'>
          {/* Assignment Info */}
          <div>
            <p className='text-sm text-slate-400'>{assignmentClassName}</p>
            <h3 className='text-2xl font-bold mt-1 text-slate-900'>
              {assignmentTitle}
            </h3>
            <div className='flex items-center gap-2 mt-3'>
              <BadgeStatus
                variant={submissionStatus === "GRADED" ? "success" : "warning"}
              >
                {submissionStatus}
              </BadgeStatus>
              {submittedAt && (
                <p className='text-sm text-slate-400'>
                  Submitted on {new Date(submittedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Submission File */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h4 className='text-lg font-semibold text-slate-900'>
                Bài làm của bạn
              </h4>
              <button
                onClick={() => setShowSubmission(!showSubmission)}
                className='flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium'
              >
                {showSubmission ? (
                  <>
                    Ẩn <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    Xem <ChevronDown size={16} />
                  </>
                )}
              </button>
            </div>
            
            <div className='bg-slate-50 rounded-lg border border-slate-200 overflow-hidden'>
              <div className='flex items-center gap-3 p-4'>
                <div className='text-purple-600'>
                  {mediaType?.startsWith("audio") ? (
                    <Mic size={32} />
                  ) : (
                    <FileText size={32} />
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-slate-900 truncate'>
                    {mediaType?.startsWith("audio")
                      ? "Audio Recording"
                      : "Bài viết"}
                  </p>
                  <p className='text-xs text-slate-400'>
                    {mediaType?.startsWith("audio")
                      ? "MP3 Audio"
                      : "Text Content"}
                  </p>
                </div>
              </div>

              {/* Expandable Content */}
              {showSubmission && (
                <div className='border-t border-slate-200 bg-white'>
                  {mediaType?.startsWith("audio") && audioUrl ? (
                    <div className='p-4'>
                      <audio controls className='w-full'>
                        <source src={audioUrl} type='audio/mpeg' />
                        Trình duyệt không hỗ trợ audio player.
                      </audio>
                    </div>
                  ) : writingContent ? (
                    <div className='p-4 max-h-96 overflow-y-auto'>
                      <div className='prose prose-sm max-w-none'>
                        <p className='text-slate-700 leading-relaxed whitespace-pre-wrap'>
                          {writingContent}
                        </p>
                      </div>
                      <div className='mt-4 pt-4 border-t border-slate-200'>
                        <p className='text-xs text-slate-400'>
                          Số từ: {writingContent.split(/\s+/).length} từ
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className='p-4 text-center text-slate-400 text-sm'>
                      Không có nội dung
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Feedback & Scores */}
          {aiFeedback && (
            <div className='space-y-6'>
              {/* Overall Band Score */}
              <div className='bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-xl text-white'>
                <div className='flex items-center gap-3 mb-3'>
                  <Bot size={24} />
                  <h4 className='text-lg font-bold'>Điểm AI</h4>
                </div>
                <div className='flex items-baseline gap-2'>
                  <p className='text-5xl font-bold'>
                    {aiFeedback.overallBand.toFixed(1)}
                  </p>
                  <p className='text-2xl opacity-80'>/9.0</p>
                </div>
                <p className='text-sm opacity-90 mt-2'>IELTS Band Score</p>
              </div>

              {/* Sub-Scores Breakdown */}
              <div className='bg-slate-50 p-5 rounded-xl border border-slate-200'>
                <h5 className='font-semibold text-slate-900 mb-4'>Phân tích chi tiết</h5>
                <div className='space-y-3'>
                  {aiFeedback.subScores.map((sub, idx) => (
                    <div key={idx} className='space-y-1'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-slate-600'>{sub.label}</span>
                        <span className='font-semibold text-purple-600'>
                          {sub.value.toFixed(1)}
                        </span>
                      </div>
                      <div className='w-full bg-slate-200 rounded-full h-2'>
                        <div
                          className='bg-purple-500 h-2 rounded-full transition-all'
                          style={{ width: `${(sub.value / 9) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Summary */}
              <div className='bg-white border border-slate-200 p-5 rounded-xl space-y-4'>
                <h5 className='font-semibold text-slate-900'>Nhận xét tổng quan</h5>
                <p className='text-slate-600 leading-relaxed text-sm'>
                  {aiFeedback.feedback}
                </p>
              </div>

              {/* Detailed Feedback */}
              {aiFeedback.detailedFeedback && (
                <div className='space-y-4'>
                  {/* Strengths */}
                  {aiFeedback.detailedFeedback.strengths.length > 0 && (
                    <div className='bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg'>
                      <h5 className='font-semibold text-slate-900 mb-3 flex items-center gap-2'>
                        <CheckCircle size={18} className='text-green-500' />
                        Điểm mạnh
                      </h5>
                      <ul className='space-y-2'>
                        {aiFeedback.detailedFeedback.strengths.map((str, i) => (
                          <li key={i} className='text-sm text-slate-600 leading-relaxed flex items-start gap-2'>
                            <span className='text-green-500 mt-0.5'>•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {aiFeedback.detailedFeedback.areasForImprovement.length > 0 && (
                    <div className='bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg'>
                      <h5 className='font-semibold text-slate-900 mb-3 flex items-center gap-2'>
                        <Lightbulb size={18} className='text-amber-500' />
                        Cần cải thiện
                      </h5>
                      <ul className='space-y-2'>
                        {aiFeedback.detailedFeedback.areasForImprovement.map((area, i) => (
                          <li key={i} className='text-sm text-slate-600 leading-relaxed flex items-start gap-2'>
                            <span className='text-amber-500 mt-0.5'>•</span>
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {aiFeedback.detailedFeedback.suggestions.length > 0 && (
                    <div className='bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg'>
                      <h5 className='font-semibold text-slate-900 mb-3 flex items-center gap-2'>
                        <Lightbulb size={18} className='text-blue-500' />
                        Gợi ý
                      </h5>
                      <ul className='space-y-2'>
                        {aiFeedback.detailedFeedback.suggestions.map((sug, i) => (
                          <li key={i} className='text-sm text-slate-600 leading-relaxed flex items-start gap-2'>
                            <span className='text-blue-500 mt-0.5'>•</span>
                            <span>{sug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* View Full Report Button */}
              <Button
                onClick={handleViewFullReport}
                className='w-full bg-purple-600 hover:bg-purple-700 text-white font-medium gap-2'
              >
                Xem báo cáo đầy đủ
                <ArrowRight size={16} />
              </Button>

              {/* Retake Button */}
              {onRetake && (
                <Button
                  onClick={onRetake}
                  variant='outline'
                  className='w-full border-purple-600 text-purple-600 hover:bg-purple-50 font-medium gap-2 mt-3'
                >
                  <RotateCcw size={16} />
                  Làm lại
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default FeedbackSidebar;
