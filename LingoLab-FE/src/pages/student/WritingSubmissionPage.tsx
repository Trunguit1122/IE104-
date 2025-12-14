import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Clock,
  FileText,
  Send,
  Save,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { WritingSubmission } from "@/components/student/WritingSubmission";
import { ROUTES } from "@/constants";
import { promptsApi, practiceApi } from "@/services/api";
import type { Prompt, Attempt } from "@/types";
import { toast } from "sonner";

export function WritingSubmissionPage() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const [text, setText] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // API data
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  // Fetch prompt from API
  useEffect(() => {
    const fetchData = async () => {
      if (!assignmentId) return;
      
      setIsLoading(true);
      try {
        // Fetch the prompt
        const promptData = await promptsApi.getById(assignmentId);
        setPrompt(promptData);

        // Start a writing practice session
        try {
          const session = await practiceApi.startWriting(assignmentId);
          if (session.success && session.attemptId) {
            // Create attempt object from response
            setAttempt({
              id: session.attemptId,
              promptId: session.promptId,
              skillType: session.skillType,
              status: 'in_progress',
              startedAt: session.startedAt,
            } as any);
          }
        } catch {
          // Attempt might already exist, try to get active session
          const activeSession = await practiceApi.getActiveWritingSession();
          if (activeSession) {
            setAttempt(activeSession);
            if (activeSession.textContent) {
              setText(activeSession.textContent);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching prompt:", error);
        toast.error("Không thể tải đề bài");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [assignmentId]);

  // Auto-save effect
  useEffect(() => {
    if (text.length > 0 && attempt) {
      const timer = setTimeout(async () => {
        try {
          await practiceApi.updateWritingContent(attempt.id, text);
          setAutoSaved(true);
          setTimeout(() => setAutoSaved(false), 2000);
        } catch {
          // Silent fail for auto-save
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [text, attempt]);

  const wordLimit = { min: prompt?.wordLimit || 250, max: (prompt?.wordLimit || 250) + 50 };
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  const isWordCountValid = wordCount >= wordLimit.min && wordCount <= wordLimit.max;
  const isUnderMinimum = wordCount < wordLimit.min;

  const handleBack = () => {
    navigate(ROUTES.STUDENT.DASHBOARD);
  };

  const handleSaveDraft = async () => {
    if (!attempt) return;
    
    try {
      await practiceApi.updateWritingContent(attempt.id, text);
      setAutoSaved(true);
      toast.success("Đã lưu bản nháp");
      setTimeout(() => setAutoSaved(false), 2000);
    } catch (error) {
      toast.error("Không thể lưu bản nháp");
    }
  };

  const handleSubmit = async () => {
    if (isUnderMinimum) {
      setShowConfirmDialog(true);
      return;
    }
    await submitWork();
  };

  const submitWork = async () => {
    if (!attempt) return;
    
    setIsSubmitting(true);
    try {
      // First update the content, then submit
      await practiceApi.updateWritingContent(attempt.id, text);
      const submitResponse = await practiceApi.submitWriting(attempt.id);
      
      toast.success("Đã nộp bài thành công! Đang chuyển đến trang chấm điểm...");
      
      // Navigate to scoring progress page
      navigate(`/student/scoring/${submitResponse.attemptId}?type=writing`);
    } catch (error) {
      toast.error("Không thể nộp bài");
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const getDaysUntilDue = () => {
    // Mock deadline since prompts don't have due dates
    return 7;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy đề bài</p>
        <Button type="button" onClick={handleBack} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-600 p-1 rounded">
                <FileText size={16} />
              </span>
              <p className="text-sm text-slate-500">{prompt.topic?.name || "IELTS Writing"}</p>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Writing Task - {prompt.difficulty?.toUpperCase()}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <BadgeStatus variant="info">Writing Task</BadgeStatus>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock size={14} />
                Due in {getDaysUntilDue()} days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-slate-300"
              onClick={handleSaveDraft}
            >
              <Save size={16} />
              Save Draft
            </Button>
            <Button
              type="button"
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={handleSubmit}
              disabled={isSubmitting || wordCount === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Writing Area */}
        <div className="lg:col-span-2">
          <WritingSubmission
            text={text}
            onChange={setText}
            readOnly={false}
            autoSaved={autoSaved}
          />

          {/* Word Count Status */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isWordCountValid ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : isUnderMinimum ? (
                <AlertCircle size={16} className="text-amber-500" />
              ) : (
                <AlertCircle size={16} className="text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  isWordCountValid
                    ? "text-green-600"
                    : isUnderMinimum
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {wordCount} / {wordLimit.min}-{wordLimit.max} words
              </span>
            </div>
            {isUnderMinimum && (
              <span className="text-xs text-amber-600">
                {wordLimit.min - wordCount} more words needed
              </span>
            )}
          </div>
        </div>

        {/* Sidebar - Instructions */}
        <div className="space-y-6">
          {/* Task Description */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Info size={18} className="text-purple-600" />
              Task Description
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {prompt.content}
            </p>
          </div>

          {/* Instructions */}
          {prompt.instructions && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Instructions
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {prompt.instructions}
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              💡 Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Use paragraphs to organize your ideas</li>
              <li>• Include an introduction and conclusion</li>
              <li>• Proofread before submitting</li>
              <li>• Your work is auto-saved every few seconds</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowConfirmDialog(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle size={24} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Word Count Below Minimum
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  Your essay has {wordCount} words, but the minimum requirement is{" "}
                  {wordLimit.min} words. Are you sure you want to submit?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="border-slate-300"
              >
                Keep Writing
              </Button>
              <Button
                type="button"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={submitWork}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Anyway"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WritingSubmissionPage;
