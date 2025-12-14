import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { attemptsApi, scoresApi } from "@/services/api";
import { Loader2, CheckCircle, AlertCircle, ArrowRight, Clock } from "lucide-react";
import type { Attempt } from "@/types";

export function ScoringProgressPage() {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [searchParams] = useSearchParams();
  const skillType = searchParams.get("type") || "speaking";

  const [_attempt, setAttempt] = useState<Attempt | null>(null);
  const [status, setStatus] = useState<"processing" | "completed" | "failed">("processing");
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(30);

  useEffect(() => {
    if (!attemptId) return;

    const checkStatus = async () => {
      try {
        const attemptData = await attemptsApi.getById(attemptId);
        setAttempt(attemptData);

        if (attemptData.status === "scored" || attemptData.status === "evaluated_by_teacher") {
          setStatus("completed");
          setProgress(100);
        } else if (attemptData.status === "failed") {
          setStatus("failed");
        } else {
          // Still processing
          setStatus("processing");
        }
      } catch (error) {
        console.error("Error checking attempt status:", error);
        setStatus("failed");
      }
    };

    // Check immediately
    checkStatus();

    // Poll every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    // Simulate progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 2;
      });
      setEstimatedTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [attemptId]);

  // Auto navigate when completed
  useEffect(() => {
    if (status === "completed" && attemptId) {
      setTimeout(() => {
        navigate(`/student/report/${attemptId}`);
      }, 2000);
    }
  }, [status, attemptId, navigate]);

  const handleViewResult = () => {
    if (attemptId) {
      navigate(`/student/report/${attemptId}`);
    }
  };

  const handleBackToDashboard = () => {
    navigate(ROUTES.STUDENT.DASHBOARD);
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Processing State */}
        {status === "processing" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8 md:p-12 text-center space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Đang chấm điểm...
              </h1>
              <p className="text-slate-500">
                AI đang phân tích bài làm {skillType === "speaking" ? "Speaking" : "Writing"} của bạn
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3 pt-4">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-slate-400">
                Ước tính còn {estimatedTime}s...
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">
                💡 Trong lúc chờ đợi:
              </h3>
              <ul className="space-y-1 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>AI đang phân tích từng tiêu chí theo chuẩn IELTS</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>Quá trình này thường mất 20-40 giây</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  <span>Bạn sẽ nhận được báo cáo chi tiết sau khi hoàn tất</span>
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              onClick={handleBackToDashboard}
              className="border-slate-300"
            >
              Quay về Dashboard
            </Button>
          </div>
        )}

        {/* Completed State */}
        {status === "completed" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8 md:p-12 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
                Chấm điểm hoàn tất!
              </h1>
              <p className="text-slate-500">
                Bài làm của bạn đã được AI chấm điểm thành công
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleViewResult}
                className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
              >
                Xem kết quả
                <ArrowRight size={16} />
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToDashboard}
                className="w-full border-slate-300"
              >
                Quay về Dashboard
              </Button>
            </div>

            <p className="text-xs text-slate-400">
              Đang tự động chuyển đến trang kết quả...
            </p>
          </div>
        )}

        {/* Failed State */}
        {status === "failed" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8 md:p-12 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-red-600 mb-2">
                Chấm điểm thất bại
              </h1>
              <p className="text-slate-500">
                Có lỗi xảy ra trong quá trình chấm điểm. Vui lòng thử lại.
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm text-slate-600">
                Nếu lỗi tiếp tục xảy ra, vui lòng liên hệ hỗ trợ hoặc thử nộp bài lại.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleBackToDashboard}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Quay về Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScoringProgressPage;

