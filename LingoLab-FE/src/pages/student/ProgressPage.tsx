import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Filter,
  ChevronDown,
  TrendingUp,
  ClipboardCheck,
  Sparkles,
  Brain,
  CheckCircle,
  AlertTriangle,
  Eye,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import { practiceApi, attemptsApi, scoresApi, learnerProfilesApi } from "@/services/api";
import type { Attempt, Score, LearnerProfile } from "@/types";
import { ROUTES } from "@/constants";

interface PracticeHistoryItem {
  attemptId: string;
  promptId: string;
  promptContent: string;
  skillType: 'speaking' | 'writing';
  status: string;
  createdAt: string;
  submittedAt: string | null;
  scoredAt: string | null;
}

interface AttemptWithScore extends Attempt {
  score?: Score;
}

export function ProgressPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // State for API data
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithScore[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<AttemptWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  
  // Stats
  const [currentBand, setCurrentBand] = useState(0);
  const [targetBand, setTargetBand] = useState(7);
  const [completedCount, setCompletedCount] = useState(0);
  const [bandChange, setBandChange] = useState(0);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Fetch learner profile for current/target band
        try {
          const profileData = await learnerProfilesApi.getByUserId(user.id);
          setProfile(profileData);
          setCurrentBand(profileData.currentBand || 0);
          setTargetBand(profileData.targetBand || 7);
        } catch {
          // No profile found, use defaults
        }

        // Fetch practice history (getHistory already returns items array)
        const historyItems = await practiceApi.getHistory();
        
        // Count completed attempts (scored or submitted)
        const completed = historyItems.filter(
          (item) => item.status === 'scored' || item.status === 'submitted'
        );
        setCompletedCount(completed.length);

        // Fetch scored attempts for score history chart
        const scoredAttempts = await attemptsApi.getAll({ status: 'scored', limit: 10 });
        const attemptsData = scoredAttempts || [];
        
        // Fetch scores for each scored attempt
        const attemptsWithScores: AttemptWithScore[] = [];
        const scores: number[] = [];
        
        for (const attempt of attemptsData.slice(0, 8)) {
          try {
            const score = await scoresApi.getByAttemptId(attempt.id);
            const scoreData = Array.isArray(score) ? score[0] : score;
            attemptsWithScores.push({ ...attempt, score: scoreData });
            if (scoreData?.overallBand) {
              scores.push(scoreData.overallBand);
            }
          } catch {
            attemptsWithScores.push(attempt);
          }
        }
        
        setAttempts(attemptsWithScores);
        setScoreHistory(scores.reverse()); // oldest first for chart
        
        // Calculate band change (compare first vs last score)
        if (scores.length >= 2) {
          const change = scores[scores.length - 1] - scores[0];
          setBandChange(change);
        }
        
        // Get recent submissions with scores
        setRecentSubmissions(attemptsWithScores.slice(0, 3));
        
      } catch (error) {
        console.error("Error fetching progress data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleViewSubmission = (attemptId: string) => {
    navigate(`${ROUTES.STUDENT.REPORT}/${attemptId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Use fetched data or defaults
  const displayScores = scoreHistory.length > 0 ? scoreHistory : [5.5, 5.5, 6.0, 6.0, 6.5, 7.0, 6.5, 7.0];

  return (
    <div className='w-full max-w-[1280px] mx-auto flex flex-col gap-8 pb-12 animate-in fade-in duration-300'>
      {/* Page Heading */}
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900'>
          Your Progress Analytics
        </h1>
        <p className='text-slate-500 text-base font-normal'>
          Track your IELTS band score improvements and AI insights.
        </p>
      </div>

      {/* Filters Section */}
      <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200'>
        <div className='flex flex-wrap items-end gap-4'>
          {/* Task Type Filter */}
          <div className='flex flex-col flex-1 min-w-[200px]'>
            <label className='text-sm font-medium mb-2 text-slate-700'>
              Task Type
            </label>
            <div className='relative'>
              <select className='w-full appearance-none rounded-lg border border-slate-300 bg-white text-base py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-slate-900'>
                <option>All Tasks</option>
                <option>Writing Task 1</option>
                <option>Writing Task 2</option>
                <option>Speaking Part 2</option>
              </select>
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500'>
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className='flex flex-col flex-1 min-w-[200px]'>
            <label className='text-sm font-medium mb-2 text-slate-700'>
              Date Range
            </label>
            <div className='relative'>
              <select className='w-full appearance-none rounded-lg border border-slate-300 bg-white text-base py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-slate-900'>
                <option>Last 3 Months</option>
                <option>Last 30 Days</option>
                <option>This Year</option>
                <option>All Time</option>
              </select>
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500'>
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          {/* Comparison Mode Filter */}
          <div className='flex flex-col flex-1 min-w-[200px]'>
            <label className='text-sm font-medium mb-2 text-slate-700'>
              Comparison Mode
            </label>
            <div className='relative'>
              <select className='w-full appearance-none rounded-lg border border-slate-300 bg-white text-base py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-slate-900'>
                <option>vs. Self</option>
                <option>vs. Class Average</option>
                <option>vs. Global Average</option>
              </select>
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500'>
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <button className='h-[50px] px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 min-w-[120px] justify-center mt-4 sm:mt-0 shadow-sm'>
            <Filter size={20} />
            Update
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* KPI 1 */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-40'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-slate-500'>
                Current Band Score
              </p>
              <h3 className='text-4xl font-bold mt-2 text-slate-900'>{currentBand || "N/A"}</h3>
            </div>
            {bandChange !== 0 && (
              <div className={`${bandChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} px-2 py-1 rounded text-xs font-semibold flex items-center gap-1`}>
                <TrendingUp size={14} className={bandChange < 0 ? 'rotate-180' : ''} />
                {bandChange > 0 ? '+' : ''}{bandChange.toFixed(1)}
              </div>
            )}
          </div>
          <p className='text-sm text-slate-500'>Target: Band {targetBand}</p>
        </div>

        {/* KPI 2 */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-40'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-slate-500'>
                Tasks Completed
              </p>
              <h3 className='text-4xl font-bold mt-2 text-slate-900'>{completedCount}</h3>
            </div>
            <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600'>
              <ClipboardCheck size={24} />
            </div>
          </div>
          <p className='text-sm text-slate-500'>Writing & Speaking tasks</p>
        </div>

        {/* KPI 3 */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-40'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-sm font-medium text-slate-500'>
                Target Score
              </p>
              <h3 className='text-4xl font-bold mt-2 text-purple-600'>{targetBand}</h3>
            </div>
            <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600'>
              <Sparkles size={24} />
            </div>
          </div>
          <p className='text-sm text-slate-500'>{currentBand > 0 ? `${((currentBand / targetBand) * 100).toFixed(0)}% progress` : 'Set your goal'}</p>
        </div>
      </div>

      {/* Main Chart & Error Heatmap */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Trend Chart */}
        <div className='lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-bold text-slate-900'>
              Score History Trend
            </h3>
            <button className='text-sm text-purple-600 font-medium hover:underline'>
              View Details
            </button>
          </div>

          {/* Chart Placeholder Simulation */}
          <div className='flex-1 min-h-[300px] w-full bg-slate-50 rounded-lg relative overflow-hidden flex items-end justify-between px-4 pb-4 gap-2 border border-slate-100'>
            {/* Grid Lines Overlay */}
            <div
              className='absolute inset-0 opacity-10 pointer-events-none'
              style={{
                backgroundImage:
                  "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Bars */}
            {displayScores.map((score, idx) => (
              <div
                key={idx}
                className='w-[10%] relative group'
                style={{ height: `${(score / 9) * 100}%` }}
              >
                <div
                  className={`w-full h-full rounded-t-sm transition-all duration-300 ${
                    idx === displayScores.length - 1
                      ? "bg-purple-600 shadow-lg shadow-purple-200"
                      : "bg-purple-300 hover:bg-purple-400 opacity-70"
                  }`}
                />
                <div className='absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold z-10 whitespace-nowrap'>
                  Band {score}
                </div>
              </div>
            ))}

            {/* Line Chart SVG Overlay (Decorative) */}
            <svg
              className='absolute inset-0 w-full h-full pointer-events-none text-purple-600 opacity-80'
              preserveAspectRatio='none'
            >
              <path
                d='M 20 180 L 60 165 L 100 135 L 140 150 L 180 105 L 220 90 L 260 120 L 300 75'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='3'
                className='drop-shadow-sm'
                transform='scale(1, 0.8) translate(0, 50)'
              />
            </svg>
          </div>
        </div>

        {/* AI Insights / Error Heatmap */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <Brain className='text-purple-600' size={24} />
              AI Error Insights
            </h3>
          </div>

          <div className='flex flex-col gap-6'>
            {/* Insight Item 1 */}
            <div className='group'>
              <div className='flex justify-between items-center mb-1'>
                <span className='text-sm font-medium text-slate-700'>
                  Grammar & Mechanics
                </span>
                <span className='text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded'>
                  High Frequency
                </span>
              </div>
              <div className='w-full bg-slate-100 rounded-full h-2.5'>
                <div
                  className='bg-red-500 h-2.5 rounded-full'
                  style={{ width: "75%" }}
                />
              </div>
              <p className='text-xs text-slate-500 mt-2'>
                Focus on Subject-Verb Agreement.
              </p>
            </div>

            {/* Insight Item 2 */}
            <div className='group'>
              <div className='flex justify-between items-center mb-1'>
                <span className='text-sm font-medium text-slate-700'>
                  Vocabulary Range
                </span>
                <span className='text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded'>
                  Medium
                </span>
              </div>
              <div className='w-full bg-slate-100 rounded-full h-2.5'>
                <div
                  className='bg-amber-500 h-2.5 rounded-full'
                  style={{ width: "45%" }}
                />
              </div>
              <p className='text-xs text-slate-500 mt-2'>
                Try to use more academic synonyms.
              </p>
            </div>

            {/* Insight Item 3 */}
            <div className='group'>
              <div className='flex justify-between items-center mb-1'>
                <span className='text-sm font-medium text-slate-700'>
                  Coherence & Cohesion
                </span>
                <span className='text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded'>
                  Low Frequency
                </span>
              </div>
              <div className='w-full bg-slate-100 rounded-full h-2.5'>
                <div
                  className='bg-green-500 h-2.5 rounded-full'
                  style={{ width: "15%" }}
                />
              </div>
              <p className='text-xs text-slate-500 mt-2'>
                Great use of linking words!
              </p>
            </div>

            <div className='mt-auto pt-4 border-t border-slate-100'>
              <button className='w-full py-2.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors'>
                View Full AI Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses + Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Strengths & Weaknesses */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full'>
          <h3 className='text-lg font-bold text-slate-900 mb-6'>
            Performance Summary
          </h3>
          <div className='flex flex-col sm:flex-row gap-6'>
            {/* Strengths */}
            <div className='flex-1'>
              <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2'>
                <span className='w-2 h-2 rounded-full bg-green-500' />
                Top Strengths
              </h4>
              <ul className='space-y-3'>
                <li className='flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100'>
                  <CheckCircle size={18} className='text-green-600 mt-0.5' />
                  <span className='text-sm text-slate-800'>
                    Excellent range of vocabulary in Writing Task 2.
                  </span>
                </li>
                <li className='flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100'>
                  <CheckCircle size={18} className='text-green-600 mt-0.5' />
                  <span className='text-sm text-slate-800'>
                    Strong pronunciation clarity in Speaking Part 1.
                  </span>
                </li>
              </ul>
            </div>

            {/* Weaknesses */}
            <div className='flex-1'>
              <h4 className='text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2'>
                <span className='w-2 h-2 rounded-full bg-orange-500' />
                Focus Areas
              </h4>
              <ul className='space-y-3'>
                <li className='flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100'>
                  <AlertTriangle size={18} className='text-orange-600 mt-0.5' />
                  <span className='text-sm text-slate-800'>
                    Pacing in Speaking Part 2 often exceeds limits.
                  </span>
                </li>
                <li className='flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100'>
                  <AlertTriangle size={18} className='text-orange-600 mt-0.5' />
                  <span className='text-sm text-slate-800'>
                    Minor article usage errors in written tasks.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-bold text-slate-900'>
              Recent Submissions
            </h3>
            <button className='text-sm text-purple-600 font-medium hover:underline'>
              View All
            </button>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='border-b border-slate-100'>
                  <th className='py-3 px-2 text-xs font-medium text-slate-500 uppercase'>
                    Task
                  </th>
                  <th className='py-3 px-2 text-xs font-medium text-slate-500 uppercase'>
                    Date
                  </th>
                  <th className='py-3 px-2 text-xs font-medium text-slate-500 uppercase text-center'>
                    Score
                  </th>
                  <th className='py-3 px-2 text-xs font-medium text-slate-500 uppercase text-right'>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className='text-sm'>
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.map((attempt, idx) => {
                    const score = attempt.score?.overallBand;
                    const scoreColor = score && score >= 7 ? 'bg-green-100 text-green-700' : 
                                       score && score >= 6 ? 'bg-amber-100 text-amber-700' : 
                                       'bg-slate-100 text-slate-700';
                    return (
                      <tr key={attempt.id} className={`group hover:bg-slate-50 transition-colors ${idx < recentSubmissions.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <td className='py-3 px-2 font-medium text-slate-900'>
                          {attempt.skillType === 'writing' ? 'Writing Task' : 'Speaking Task'}
                          <div className='text-xs font-normal text-slate-500'>
                            {attempt.skillType === 'writing' ? 'Essay' : 'Audio'}
                          </div>
                        </td>
                        <td className='py-3 px-2 text-slate-500 whitespace-nowrap'>
                          {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : '-'}
                        </td>
                        <td className='py-3 px-2 text-center'>
                          {score ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 ${scoreColor} font-bold rounded-full text-xs`}>
                              {score}
                            </span>
                          ) : (
                            <span className='text-slate-400'>-</span>
                          )}
                        </td>
                        <td className='py-3 px-2 text-right'>
                          <button 
                            onClick={() => handleViewSubmission(attempt.id)}
                            className='text-purple-600 hover:bg-purple-50 p-2 rounded-full transition-colors'
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className='py-8 text-center text-slate-500'>
                      No submissions yet. Start practicing to see your progress!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressPage;
