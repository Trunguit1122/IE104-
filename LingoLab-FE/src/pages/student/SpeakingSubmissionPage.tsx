import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeStatus } from "@/components/ui/badge-status";
import { SpeakingSubmission } from "@/components/student/SpeakingSubmission";
import { ROUTES } from "@/constants";

// Types
interface Assignment {
  id: string;
  title: string;
  className: string;
  type: "WRITING" | "SPEAKING";
  dueDate: string;
  description: string;
  prompt: string;
  speakingTime?: number; // in seconds
  tips: string[];
}

// Mock data
const mockAssignment: Assignment = {
  id: "a2",
  title: "IELTS Speaking Part 2 - Describe a Place",
  className: "IELTS Speaking",
  type: "SPEAKING",
  dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  description:
    "In this task, you will be given a topic card and asked to speak about a particular subject for 1-2 minutes.",
  prompt: `Describe a place you have visited that left a strong impression on you.

You should say:
• Where this place is
• When you visited it
• What you did there
• And explain why it left a strong impression on you`,
  speakingTime: 120,
  tips: [
    "Speak clearly and at a natural pace",
    "Use a variety of vocabulary and expressions",
    "Structure your response with an introduction, main points, and conclusion",
    "Don't worry about minor mistakes - fluency is important",
  ],
};

export function SpeakingSubmissionPage() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);

  const assignment = mockAssignment;
  const maxRecordingTime = assignment.speakingTime || 120;

  // Recording timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
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

  const handleSaveDraft = () => {
    // Simulate saving draft
    console.log("Draft saved");
  };

  const handleSubmit = async () => {
    if (recordingTime === 0 && !audioFile) {
      setShowConfirmDialog(true);
      return;
    }
    await submitWork();
  };

  const submitWork = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setShowConfirmDialog(false);
    navigate(ROUTES.STUDENT.DASHBOARD);
  };

  const getDaysUntilDue = () => {
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
  };

  const hasRecording = recordingTime > 0 || audioFile !== null;

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
              <p className="text-sm text-slate-500">{assignment.className}</p>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {assignment.title}
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
                {assignment.prompt}
              </p>
            </div>
          </div>

          {/* Recording Area */}
          <SpeakingSubmission
            isRecording={isRecording}
            toggleRecording={toggleRecording}
            recordingTime={recordingTime}
            audioFile={audioFile}
            setAudioFile={setAudioFile}
            readOnly={false}
            formatTime={formatTime}
          />

          {/* Recording Status */}
          {hasRecording && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Mic size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {audioFile ? "Audio file uploaded" : "Recording complete"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Duration: {formatTime(recordingTime)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? "Pause" : "Preview"}
              </Button>
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
              {assignment.description}
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
                {formatTime(assignment.speakingTime || 120)}
              </span>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-purple-50 rounded-xl border border-purple-100 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              💡 Speaking Tips
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {assignment.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-600">•</span>
                  {tip}
                </li>
              ))}
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

