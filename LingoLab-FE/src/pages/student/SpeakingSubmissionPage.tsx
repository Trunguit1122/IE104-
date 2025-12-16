import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Clock,
  Mic,
  Send,
  Save,
  AlertCircle,
  Info,
  Volume2,
  Play,
  Pause,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { SpeakingSubmission } from "@/components/student/SpeakingSubmission";
import { ROUTES } from "@/constants";
import { promptsApi, practiceApi, uploadApi } from "@/services/api";
import type { Prompt, Attempt } from "@/types";
import { toast } from "sonner";

export function SpeakingSubmissionPage() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // API data
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);

  const maxRecordingTime = prompt?.responseTime || 120;

  // Create audio URL when file changes
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
      setAudioDuration(0);
    }
  }, [audioFile]);

  // Fetch prompt from API
  useEffect(() => {
    const fetchData = async () => {
      if (!assignmentId) return;
      
      setIsLoading(true);
      try {
        // Fetch the prompt
        const promptData = await promptsApi.getById(assignmentId);
        setPrompt(promptData);

        // Start a speaking practice session
        try {
          const session = await practiceApi.startSpeaking(assignmentId);
          if (session.success && session.attemptId) {
            // Create attempt object from response
            setAttempt({
              id: session.attemptId,
              promptId: session.promptId,
              skillType: session.skillType,
              status: 'in_progress',
              startedAt: session.startedAt,
            } as Attempt);
          }
        } catch {
          // Session might already exist, that's okay
          toast.info("Phiên luyện tập đã được khởi tạo trước đó");
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

  // Recording timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxRecordingTime) {
            setIsRecording(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxRecordingTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // In a real app, this would save the recorded audio
    } else {
      // Start recording
      setRecordingTime(0);
      setIsRecording(true);
      setAudioFile(null);
    }
  };

  const handleBack = () => {
    navigate(ROUTES.STUDENT.DASHBOARD);
  };

  const handleSaveDraft = async () => {
    if (!attempt || !audioFile) {
      toast.info("Chưa có file audio để lưu");
      return;
    }
    
    try {
      // Upload audio file
      const uploadResponse = await uploadApi.uploadRecording(attempt.id, audioFile);
      if (uploadResponse.success) {
        toast.success("Đã lưu bản ghi âm");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Không thể lưu bản nháp");
    }
  };

  const handleSubmit = async () => {
    if (recordingTime === 0 && !audioFile) {
      setShowConfirmDialog(true);
      return;
    }
    await submitWork();
  };

  const submitWork = async () => {
    if (!attempt) {
      toast.error("Không tìm thấy phiên luyện tập");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Upload audio file if exists
      let uploadedMediaId = mediaId;
      if (audioFile && !uploadedMediaId) {
        const uploadResponse = await uploadApi.uploadRecording(attempt.id, audioFile);
        if (uploadResponse.success) {
          // Get the mediaId from the recordings
          const recordings = await practiceApi.getAttemptRecordings(attempt.id);
          if (recordings.length > 0) {
            uploadedMediaId = recordings[recordings.length - 1].id;
          }
        }
      }

      if (!uploadedMediaId) {
        // If no uploaded media, get existing recordings
        const recordings = await practiceApi.getAttemptRecordings(attempt.id);
        if (recordings.length > 0) {
          uploadedMediaId = recordings[recordings.length - 1].id;
        }
      }

      if (!uploadedMediaId) {
        toast.error("Vui lòng tải lên hoặc ghi âm trước khi nộp bài");
        setIsSubmitting(false);
        return;
      }

      // Step 2: Submit the attempt
      const submitResponse = await practiceApi.submitSpeaking(attempt.id, { 
        selectedRecordingId: uploadedMediaId 
      });

      if (submitResponse.success) {
        toast.success("Đã nộp bài thành công! Đang chuyển đến trang chấm điểm...");
        // Navigate to scoring progress page
        navigate(`/student/scoring/${submitResponse.attemptId}?type=speaking`);
      } else {
        toast.error(submitResponse.message || "Không thể nộp bài");
      }
    } catch (error: any) {
      console.error("Error submitting:", error);
      toast.error(error?.response?.data?.message || "Không thể nộp bài");
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const getDaysUntilDue = () => {
    // Mock deadline since prompts don't have due dates
    return 7;
  };

  const hasRecording = recordingTime > 0 || audioFile !== null;

  // Handle audio file upload
  const handleSetAudioFile = async (file: File | null) => {
    setAudioFile(file);
    
    // Auto upload when file is selected
    if (file && attempt) {
      try {
        const uploadResponse = await uploadApi.uploadRecording(attempt.id, file);
        if (uploadResponse.success) {
          // Get the mediaId from the recordings
          const recordings = await practiceApi.getAttemptRecordings(attempt.id);
          if (recordings.length > 0) {
            setMediaId(recordings[recordings.length - 1].id);
            toast.success("Đã tải lên file audio");
          }
        }
      } catch (error) {
        console.error("Error uploading audio:", error);
        toast.error("Không thể tải lên file audio");
      }
    } else if (!file) {
      setMediaId(null);
    }
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
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-purple-100 text-purple-600 p-1 rounded">
                <Mic size={16} />
              </span>
              <p className="text-sm text-slate-500">{prompt.topic?.name || "IELTS Speaking"}</p>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Speaking Task - {prompt.difficulty?.toUpperCase()}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <BadgeStatus variant="info">Speaking Task</BadgeStatus>
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock size={14} />
                Due in {getDaysUntilDue()} days
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2 border-slate-300"
              onClick={handleSaveDraft}
              disabled={!hasRecording}
            >
              <Save size={16} />
              Save Draft
            </Button>
            <Button
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={handleSubmit}
              disabled={isSubmitting || !hasRecording}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Topic Card */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Volume2 size={20} />
              <h3 className="font-bold">Topic Card</h3>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="whitespace-pre-line leading-relaxed">
                {prompt.content}
              </p>
            </div>
          </div>

          {/* Recording Area */}
          <SpeakingSubmission
            isRecording={isRecording}
            toggleRecording={toggleRecording}
            recordingTime={recordingTime}
            audioFile={audioFile}
            setAudioFile={handleSetAudioFile}
            readOnly={false}
            formatTime={formatTime}
          />

          {/* Recording Status */}
          {hasRecording && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              {/* Hidden audio element */}
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onLoadedMetadata={() => {
                    if (audioRef.current) {
                      setAudioDuration(audioRef.current.duration);
                    }
                  }}
                  onEnded={() => setIsPlaying(false)}
                />
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Mic size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {audioFile ? "Audio file uploaded" : "Recording complete"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Duration: {audioDuration > 0 ? formatTime(Math.floor(audioDuration)) : formatTime(recordingTime)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    if (!audioRef.current || !audioUrl) return;
                    
                    if (isPlaying) {
                      audioRef.current.pause();
                      setIsPlaying(false);
                    } else {
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  disabled={!audioUrl}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {isPlaying ? "Pause" : "Preview"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Description */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Info size={18} className="text-purple-600" />
              Task Description
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {prompt.description || "Speak clearly and naturally. Structure your response with an introduction, main points, and conclusion."}
            </p>
          </div>

          {/* Time Limit */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Time Limit
            </h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">Max Speaking Time</span>
              <span className="font-bold text-slate-900">
                {formatTime(prompt.responseTime || 120)}
              </span>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              💡 Speaking Tips
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                Speak clearly and at a natural pace
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                Use a variety of vocabulary and expressions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                Structure your response with an introduction, main points, and conclusion
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                Don't worry about minor mistakes - fluency is important
              </li>
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
                  No Recording Found
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  You haven't recorded any audio or uploaded a file. Please
                  record your speaking response before submitting.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="border-slate-300"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeakingSubmissionPage;

