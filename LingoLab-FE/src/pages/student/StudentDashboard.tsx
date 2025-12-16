import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, MessageSquare, Lightbulb, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores";
import { TaskCard, FeedbackSidebar } from "@/components/student";
import { attemptsApi, scoresApi, promptsApi, attemptMediaApi, practiceApi } from "@/services/api";
import type { Attempt, Prompt, AverageBandStats } from "@/types";

// Types
type TaskFilter = "ALL" | "TODO" | "SUBMITTED";

interface TaskItem {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  image?: string;
  type: 'WRITING' | 'SPEAKING';
  isGraded: boolean;
  isSubmitted: boolean;
  score?: number;
  submissionId?: string;
  attemptCount?: number; // Number of times this prompt has been attempted
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  
  // API data state
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AverageBandStats | null>(null);
  const [selectedScore, setSelectedScore] = useState<any>(null);
  const [selectedAudioUrl, setSelectedAudioUrl] = useState<string | undefined>(undefined);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Fetch practice prompts
        const promptsResponse = await promptsApi.getAll({ limit: 20 });
        const prompts = promptsResponse.data;

        // Fetch user's attempts (get more to ensure we capture all completed ones)
        let userAttempts: Attempt[] = [];
        try {
          userAttempts = await attemptsApi.getByLearnerId(user.id, 200);
          setAttempts(userAttempts);
        } catch (error) {
          console.error('❌ Failed to fetch attempts:', error);
          // User might not have any attempts yet
        }

        // Convert prompts to tasks
        const taskItems: TaskItem[] = prompts.map((prompt: Prompt) => {
          // Get all attempts for this prompt
          const promptAttempts = userAttempts.filter(a => a.promptId === prompt.id);
          
          // Find the latest submitted/scored attempt (most relevant for showing feedback)
          const completedAttempts = promptAttempts.filter(
            a => a.status === 'submitted' || a.status === 'scored' || a.status === 'evaluated_by_teacher'
          );
          const latestAttempt = completedAttempts.length > 0 
            ? completedAttempts.reduce((latest, current) => {
                const latestTime = latest.submittedAt ? new Date(latest.submittedAt).getTime() : 0;
                const currentTime = current.submittedAt ? new Date(current.submittedAt).getTime() : 0;
                return currentTime > latestTime ? current : latest;
              })
            : null;
          
          const isSubmitted = !!latestAttempt;
          const isGraded = latestAttempt?.status === 'scored' || latestAttempt?.status === 'evaluated_by_teacher';
          
          return {
            id: prompt.id,
            title: prompt.content.slice(0, 60) + (prompt.content.length > 60 ? '...' : ''),
            className: prompt.topic?.name || 'IELTS Practice',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Mock deadline
            image: undefined,
            type: prompt.skillType === 'speaking' ? 'SPEAKING' : 'WRITING',
            isGraded,
            isSubmitted,
            score: undefined, // Will be fetched from scores API if needed
            submissionId: latestAttempt?.id,
            attemptCount: completedAttempts.length,
          };
        });

        setTasks(taskItems);

        // Fetch average band stats
        try {
          const avgStats = await scoresApi.getAverageBand();
          setStats(avgStats);
        } catch (error) {
          console.error('❌ Failed to fetch average band stats:', error);
          // Stats not available
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Find selected submission and assignment for sidebar
  const selectedAttempt = attempts.find((a) => a.id === selectedSubmissionId);
  const selectedTask = selectedAttempt
    ? tasks.find((t) => t.submissionId === selectedAttempt.id)
    : null;

  // Filter assignments based on selected tab
  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === "TODO") return !task.isSubmitted;
    if (taskFilter === "SUBMITTED") return task.isSubmitted;
    return true;
  });

  // Get upcoming deadlines (tasks not yet submitted)
  const upcomingDeadlines = [...tasks]
    .filter((t) => !t.isSubmitted)
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 3);

  const handleTaskAction = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    
    if (task?.isSubmitted && task.submissionId) {
      // Show feedback sidebar for submitted/graded tasks
      setSelectedSubmissionId(task.submissionId);
      setSelectedAudioUrl(undefined); // Reset audio URL
      
      // Fetch audio URL for speaking tasks
      if (task.type === 'SPEAKING') {
        try {
          const mediaList = await attemptMediaApi.getByAttemptId(task.submissionId);
          const audioMedia = mediaList.find(m => m.mediaType === 'audio');
          if (audioMedia?.storageUrl) {
            // Build full URL from storage path
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const audioUrl = audioMedia.storageUrl.startsWith('http') 
              ? audioMedia.storageUrl 
              : `${baseUrl}/uploads/${audioMedia.storageUrl}`;
            setSelectedAudioUrl(audioUrl);
          }
        } catch (error) {
          console.error('Failed to fetch audio:', error);
        }
      }
      
      // Try to fetch score (might be graded now even if not yet reflected in UI)
      try {
        const scoreData = await scoresApi.getByAttemptId(task.submissionId);
        setSelectedScore(Array.isArray(scoreData) ? scoreData[0] : scoreData);
      } catch (error) {
        console.error('Failed to fetch score:', error);
        setSelectedScore(null);
      }
    } else if (task) {
      // Navigate to submission page based on task type
      if (task.type === "WRITING") {
        navigate(`/student/submit/writing/${taskId}`);
      } else if (task.type === "SPEAKING") {
        navigate(`/student/submit/speaking/${taskId}`);
      }
    }
  };

  // Handler for retaking a practice
  const handleRetake = async () => {
    if (!selectedAttempt?.id) return;
    
    try {
      const result = await practiceApi.retakePractice(selectedAttempt.id);
      
      if (result.success && result.newAttemptId) {
        // Close the sidebar
        setSelectedSubmissionId(null);
        setSelectedScore(null);
        setSelectedAudioUrl(undefined);
        
        // Navigate to the appropriate practice page based on skill type
        const skillType = selectedAttempt.skillType;
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
      // Could show a toast notification here
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className='relative'>
      <div className='grid grid-cols-12 gap-8'>
        {/* LEFT COLUMN */}
        <div className='col-span-12 lg:col-span-8 space-y-8'>
          <div className='flex flex-col gap-2'>
            <h1 className='text-3xl font-bold text-slate-900 leading-tight'>
              Welcome back, {user?.displayName?.split(" ")[0] || user?.name?.split(" ")[0] || "Student"}!
            </h1>
            <p className='text-slate-500'>Here's your summary for today.</p>
          </div>

          <section>
            <div className='flex items-center justify-between pb-4 pt-2'>
              <h2 className='text-xl font-bold text-slate-900'>My Tasks</h2>
            </div>

            {/* Filter Tabs */}
            <div className='flex gap-2 mb-6 overflow-x-auto pb-2'>
              {[
                { label: "All Tasks", value: "ALL" },
                { label: "To Do", value: "TODO" },
                { label: "Submitted", value: "SUBMITTED" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setTaskFilter(tab.value as TaskFilter)}
                  className={`flex h-9 items-center px-4 rounded-lg text-sm font-medium transition-colors ${
                    taskFilter === tab.value
                      ? "bg-purple-100 text-purple-700"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tasks List */}
            <div className='space-y-4'>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  className={task.className}
                  dueDate={task.dueDate}
                  image={task.image}
                  type={task.type}
                  isGraded={task.isGraded}
                  isSubmitted={task.isSubmitted}
                  score={task.score}
                  attemptCount={task.attemptCount}
                  onAction={handleTaskAction}
                />
              ))}
              {filteredTasks.length === 0 && (
                <div className='text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200'>
                  <p>No tasks found in this category.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (Widgets) */}
        <div className='col-span-12 lg:col-span-4 space-y-8'>
          {/* Upcoming Deadlines */}
          <section className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <h3 className='text-lg font-bold text-slate-900 mb-5'>
              Upcoming Deadlines
            </h3>
            <div className='space-y-5'>
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((task) => {
                  const date = new Date(task.dueDate);
                  const month = date
                    .toLocaleString("default", { month: "short" })
                    .toUpperCase();
                  const day = date.getDate();
                  const daysUntil = Math.ceil(
                    (date.getTime() - Date.now()) / (1000 * 3600 * 24)
                  );
                  return (
                    <div
                      key={task.id}
                      className='flex items-center gap-4'
                    >
                      <div className='flex flex-col items-center justify-center bg-purple-50 rounded-lg w-12 h-12 text-purple-700'>
                        <span className='text-[10px] font-bold leading-none'>
                          {month}
                        </span>
                        <span className='text-lg font-bold leading-none mt-0.5'>
                          {day}
                        </span>
                      </div>
                      <div className='overflow-hidden'>
                        <p className='font-semibold text-slate-900 truncate'>
                          {task.title}
                        </p>
                        <p className='text-xs text-slate-500'>
                          Due in {daysUntil} days
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className='text-slate-500 text-sm'>No upcoming deadlines.</p>
              )}
            </div>
          </section>

          {/* Course Progress */}
          <section>
            <h3 className='text-lg font-bold text-slate-900 mb-4'>
              Course Progress
            </h3>
            <div className='space-y-3'>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3'>
                <div className='flex justify-between items-center'>
                  <p className='font-semibold text-slate-900'>IELTS Writing</p>
                  <span className='text-xs font-bold text-slate-400'>
                    {stats?.bySkillType?.writing ? `Band ${stats.bySkillType.writing.toFixed(1)}` : 'No data'}
                  </span>
                </div>
                <div className='w-full bg-slate-100 rounded-full h-2'>
                  <div
                    className='bg-purple-500 h-2 rounded-full'
                    style={{ width: stats?.bySkillType?.writing ? `${(stats.bySkillType.writing / 9) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3'>
                <div className='flex justify-between items-center'>
                  <p className='font-semibold text-slate-900'>IELTS Speaking</p>
                  <span className='text-xs font-bold text-slate-400'>
                    {stats?.bySkillType?.speaking ? `Band ${stats.bySkillType.speaking.toFixed(1)}` : 'No data'}
                  </span>
                </div>
                <div className='w-full bg-slate-100 rounded-full h-2'>
                  <div
                    className='bg-blue-400 h-2 rounded-full'
                    style={{ width: stats?.bySkillType?.speaking ? `${(stats.bySkillType.speaking / 9) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <h3 className='text-lg font-bold text-slate-900 mb-4'>
              Recent Activity
            </h3>
            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <div className='bg-green-100 p-2 rounded-full text-green-600 shrink-0'>
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className='text-sm text-slate-800'>
                    Grade posted for{" "}
                    <span className='font-bold'>Writing Task 1</span>.
                  </p>
                  <p className='text-xs text-slate-400 mt-1'>2 hours ago</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='bg-blue-100 p-2 rounded-full text-blue-600 shrink-0'>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <p className='text-sm text-slate-800'>
                    New comment on{" "}
                    <span className='font-bold'>Speaking Practice</span>.
                  </p>
                  <p className='text-xs text-slate-400 mt-1'>1 day ago</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <div className='bg-amber-100 p-2 rounded-full text-amber-600 shrink-0'>
                  <Lightbulb size={16} />
                </div>
                <div>
                  <p className='text-sm text-slate-800'>
                    New tip:{" "}
                    <span className='font-bold'>Vocabulary expansion</span>.
                  </p>
                  <p className='text-xs text-slate-400 mt-1'>2 days ago</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* FEEDBACK SIDEBAR */}
      <FeedbackSidebar
        isOpen={!!(selectedAttempt && selectedTask)}
        onClose={() => {
          setSelectedSubmissionId(null);
          setSelectedScore(null);
          setSelectedAudioUrl(undefined);
        }}
        submissionId={selectedAttempt?.id}
        assignmentTitle={selectedTask?.title || ""}
        assignmentClassName={selectedTask?.className || ""}
        submissionStatus={selectedAttempt?.status === 'scored' ? 'GRADED' : 'SUBMITTED'}
        submittedAt={selectedAttempt?.submittedAt}
        mediaType={selectedAttempt?.skillType === 'speaking' ? 'audio' : 'text'}
        writingContent={selectedAttempt?.writingContent}
        audioUrl={selectedAudioUrl}
        aiFeedback={selectedScore ? {
          overallBand: selectedScore.overallBand,
          subScores: selectedScore.subScores || [],
          feedback: selectedScore.feedback,
          detailedFeedback: selectedScore.detailedFeedback,
        } : undefined}
        onRetake={handleRetake}
      />
    </div>
  );
}

export default StudentDashboard;
