import { Mic, Upload, FileAudio, Square } from "lucide-react";

interface SpeakingSubmissionProps {
  isRecording: boolean;
  toggleRecording: () => void;
  recordingTime: number;
  audioFile: File | null;
  setAudioFile: (file: File | null) => void;
  readOnly?: boolean;
  formatTime: (seconds: number) => string;
}

export function SpeakingSubmission({
  isRecording,
  toggleRecording,
  recordingTime,
  audioFile,
  setAudioFile,
  readOnly = false,
  formatTime,
}: SpeakingSubmissionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="bg-purple-100 text-purple-600 p-1.5 rounded-md">
            <Mic size={20} />
          </span>
          <h3 className="font-bold text-slate-900">Speaking Response</h3>
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Max 2:00 mins
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recording Interface */}
        <div
          className={`border border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center gap-4 bg-slate-50 transition-colors ${
            isRecording ? "border-red-300 bg-red-50" : ""
          }`}
        >
          {/* Visualizer */}
          <div className="flex items-end justify-center gap-1 h-12 w-full mb-2">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  isRecording ? "bg-red-500" : "bg-slate-300"
                }`}
                style={{
                  height: isRecording
                    ? `${Math.random() * 32 + 16}px`
                    : "4px",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          <div
            className={`text-3xl font-bold font-mono ${
              isRecording ? "text-red-600" : "text-slate-900"
            }`}
          >
            {formatTime(recordingTime)}
          </div>

          <div className="flex items-center gap-4 mt-2">
            {!readOnly ? (
              <button
                type="button"
                onClick={toggleRecording}
                className={`size-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 ${
                  isRecording
                    ? "bg-red-600 text-white shadow-red-500/30"
                    : "bg-red-500 text-white hover:bg-red-600 shadow-red-500/30"
                }`}
              >
                {isRecording ? (
                  <Square size={20} fill="currentColor" />
                ) : (
                  <Mic size={24} />
                )}
              </button>
            ) : (
              <div className="text-sm text-slate-500 italic">
                Recording locked
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isRecording ? "Recording..." : "Click mic to start"}
          </p>
        </div>

        {/* Upload Interface */}
        <div className="relative flex flex-col gap-4">
          <div className="text-sm font-medium text-slate-900 mb-1">
            Or upload an audio/video file
          </div>

          {!audioFile && !readOnly ? (
            <label className="flex-1 border border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors bg-white min-h-[200px]">
              <div className="size-10 rounded-full bg-blue-50 text-purple-600 flex items-center justify-center">
                <Upload size={20} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-900">
                  Click to upload
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  MP3, WAV, MP4, WebM, OGG, M4A up to 50MB
                </p>
              </div>
              <input
                accept="audio/*,video/*,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.mov,.avi,.flac,.aac"
                className="hidden"
                type="file"
                onChange={(e) =>
                  setAudioFile(e.target.files ? e.target.files[0] : null)
                }
              />
            </label>
          ) : (
            <div className="flex-1 border border-purple-200 bg-purple-50 rounded-lg p-4 flex flex-col items-center justify-center gap-3 min-h-[200px]">
              <FileAudio size={32} className="text-purple-600" />
              <p className="text-sm font-medium text-slate-900 text-center px-2 break-all">
                {audioFile ? audioFile.name : "Submitted Audio"}
              </p>
              
              {!readOnly && audioFile && (
                <button
                  type="button"
                  onClick={() => setAudioFile(null)}
                  className="text-xs text-red-500 hover:underline mt-2"
                >
                  Remove file
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpeakingSubmission;
