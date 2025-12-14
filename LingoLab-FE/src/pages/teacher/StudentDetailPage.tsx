import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Edit3,
  FilePlus,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  FileText,
  Mic,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import {
  mockStudents,
  mockClasses,
  mockAssignments,
  mockSubmissions,
  type TaskType,
  type SubmissionStatus,
  type Submission,
} from "@/data";

type TaskFilter = "ALL" | "WRITING" | "SPEAKING";

export function StudentDetailPage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL");

  // Find student
  const student = mockStudents.find((s) => s.id === studentId);

  if (!student) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <p className='text-slate-500'>Student not found</p>
        <Button
          variant='ghost'
          onClick={() => navigate(ROUTES.TEACHER.STUDENTS)}
          className='mt-4'
        >
          <ArrowLeft size={16} className='mr-2' />
          Back to Student List
        </Button>
      </div>
    );
  }

  // Get student's submissions
  const submissions = mockSubmissions.filter((s) => s.studentId === student.id);

  // Identify Student Classes
  const enrolledClassIds = mockClasses
    .filter((c) => c.studentIds.includes(student.id))
    .map((c) => c.id);

  // Identify All Assigned Tasks for those classes
  const allStudentAssignments = mockAssignments.filter((a) =>
    enrolledClassIds.includes(a.classId)
  );

  // Filter assignments based on selected task type
  const studentAssignments =
    taskFilter === "ALL"
      ? allStudentAssignments
      : allStudentAssignments.filter((a) => a.type === taskFilter);

  // Stats Calculation
  const gradedSubmissions = submissions.filter((s) => s.status === "GRADED");

  const getAverage = (subs: Submission[]) => {
    if (subs.length === 0) return 0;
    const sum = subs.reduce(
      (acc, curr) => acc + (curr.aiFeedback?.score || 0),
      0
    );
    return (sum / subs.length).toFixed(1);
  };

  const overallScore =
    gradedSubmissions.length > 0 ? getAverage(gradedSubmissions) : "N/A";

  // Calculate average by type
  const writingGraded = gradedSubmissions.filter((s) => {
    const a = mockAssignments.find((assign) => assign.id === s.assignmentId);
    return a?.type === "WRITING";
  });
  const speakingGraded = gradedSubmissions.filter((s) => {
    const a = mockAssignments.find((assign) => assign.id === s.assignmentId);
    return a?.type === "SPEAKING";
  });

  const writingScore = getAverage(writingGraded);
  const speakingScore = getAverage(speakingGraded);
  const readingScore = "6.5"; // Mock

  const getTaskIcon = (type?: TaskType) => {
    if (type === "WRITING") return <FileText size={20} />;
    if (type === "SPEAKING") return <Mic size={20} />;
    return <BookOpen size={20} />;
  };

  const getTaskColorClass = (type?: TaskType) => {
    if (type === "WRITING") return "bg-blue-50 text-blue-600 border-blue-100";
    if (type === "SPEAKING")
      return "bg-purple-50 text-purple-600 border-purple-100";
    return "bg-green-50 text-green-600 border-green-100";
  };

  const handleBack = () => {
    navigate(ROUTES.TEACHER.STUDENTS);
  };

  return (
    <div className='flex flex-col gap-6 animate-in slide-in-from-right duration-300 pb-12'>
      {/* Top Header Navigation */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex flex-col gap-1'>
          <button
            onClick={handleBack}
            className='inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2 transition-colors'
          >
            <ArrowLeft size={16} />
            Back to Learner List
          </button>
          <h1 className='text-3xl font-bold text-slate-900'>{student.name}</h1>
          <p className='text-base text-slate-500'>
            Student ID: #{student.id.toUpperCase()} • Joined Jan 2024
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            className='gap-2 hover:text-purple-600 hover:border-purple-600 hover:bg-purple-50'
          >
            <Edit3 size={16} /> Edit Profile
          </Button>
          <Button className='gap-2 bg-purple-600 hover:bg-purple-700 shadow-purple-200'>
            <FilePlus size={16} /> Assign Task
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2'>
        {/* Left Sidebar: Profile & Stats */}
        <div className='lg:col-span-4 flex flex-col gap-6'>
          {/* Profile Card */}
          <div className='bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm'>
            <div className='p-6 flex flex-col items-center border-b border-slate-100'>
              {student.avatar ? (
                <img
                  className='w-24 h-24 rounded-full mb-4 object-cover ring-4 ring-slate-50'
                  src={student.avatar}
                  alt={student.name}
                />
              ) : (
                <div className='w-24 h-24 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-3xl mb-4 ring-4 ring-slate-50'>
                  {student.name[0]}
                </div>
              )}
              <h2 className='text-xl font-bold text-slate-900'>
                {student.name}
              </h2>
              <p className='text-sm text-slate-500'>{student.email}</p>
            </div>
            <div className='p-6 space-y-4'>
              <div>
                <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                  Contact
                </label>
                <div className='flex items-center gap-2 mt-1 text-slate-700'>
                  <Phone size={16} className='text-slate-400' />
                  <span>+84 912 345 678</span>
                </div>
                <div className='flex items-center gap-2 mt-1 text-slate-700'>
                  <MapPin size={16} className='text-slate-400' />
                  <span>Ho Chi Minh City, Vietnam</span>
                </div>
              </div>
              <div>
                <label className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>
                  Enrolled Course
                </label>
                <div className='mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100'>
                  <p className='font-medium text-slate-900 text-sm'>
                    {mockClasses
                      .filter((c) => c.studentIds.includes(student.id))
                      .map((c) => c.name)
                      .join(", ") || "No Course"}
                  </p>
                  <div className='flex items-center gap-2 mt-2'>
                    <div className='w-full bg-slate-200 rounded-full h-1.5'>
                      <div
                        className='bg-teal-400 h-1.5 rounded-full'
                        style={{ width: "65%" }}
                      />
                    </div>
                    <span className='text-xs font-medium text-slate-600'>
                      65%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className='bg-white rounded-xl border border-slate-200 p-6 shadow-sm'>
            <h3 className='text-lg font-bold text-slate-900 mb-4'>
              Performance Summary
            </h3>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm text-slate-600'>Current Band Score</span>
              <span className='text-2xl font-bold text-purple-600'>
                {overallScore}
              </span>
            </div>
            <p className='text-xs text-slate-500 mb-6'>
              Based on {gradedSubmissions.length} graded tasks
            </p>

            <div className='space-y-4'>
              {/* Writing */}
              <div>
                <div className='flex items-center justify-between text-sm mb-1'>
                  <span className='flex items-center gap-2 text-slate-700'>
                    <span className='w-2 h-2 bg-blue-500 rounded-full' />
                    Writing
                  </span>
                  <span className='font-medium text-slate-900'>
                    {writingScore || "-"}
                  </span>
                </div>
                <div className='w-full bg-slate-100 rounded-full h-1.5'>
                  <div
                    className='bg-blue-500 h-1.5 rounded-full'
                    style={{ width: `${(Number(writingScore) / 9) * 100}%` }}
                  />
                </div>
              </div>

              {/* Speaking */}
              <div>
                <div className='flex items-center justify-between text-sm mb-1'>
                  <span className='flex items-center gap-2 text-slate-700'>
                    <span className='w-2 h-2 bg-purple-500 rounded-full' />
                    Speaking
                  </span>
                  <span className='font-medium text-slate-900'>
                    {speakingScore || "-"}
                  </span>
                </div>
                <div className='w-full bg-slate-100 rounded-full h-1.5'>
                  <div
                    className='bg-purple-500 h-1.5 rounded-full'
                    style={{ width: `${(Number(speakingScore) / 9) * 100}%` }}
                  />
                </div>
              </div>

              {/* Reading (Mock) */}
              <div>
                <div className='flex items-center justify-between text-sm mb-1'>
                  <span className='flex items-center gap-2 text-slate-700'>
                    <span className='w-2 h-2 bg-green-500 rounded-full' />
                    Reading
                  </span>
                  <span className='font-medium text-slate-900'>
                    {readingScore}
                  </span>
                </div>
                <div className='w-full bg-slate-100 rounded-full h-1.5'>
                  <div
                    className='bg-green-500 h-1.5 rounded-full'
                    style={{ width: `${(Number(readingScore) / 9) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main: Task List */}
        <div className='lg:col-span-8'>
          <div className='bg-white rounded-xl border border-slate-200 h-full flex flex-col shadow-sm'>
            <div className='p-6 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between'>
              <div>
                <h3 className='text-lg font-bold text-slate-900'>
                  Task History
                </h3>
                <p className='text-sm text-slate-500 mt-1'>
                  All assignments and their current status.
                </p>
              </div>
              <div className='flex bg-slate-100 p-1 rounded-lg'>
                <button
                  onClick={() => setTaskFilter("ALL")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    taskFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTaskFilter("WRITING")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    taskFilter === "WRITING"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Writing
                </button>
                <button
                  onClick={() => setTaskFilter("SPEAKING")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    taskFilter === "SPEAKING"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Speaking
                </button>
              </div>
            </div>

            <div className='overflow-x-auto flex-1'>
              <table className='w-full text-sm text-left text-slate-500'>
                <thead className='text-xs text-slate-700 uppercase bg-slate-50'>
                  <tr>
                    <th className='px-6 py-3 font-medium'>Task Detail</th>
                    <th className='px-6 py-3 font-medium'>Due Date</th>
                    <th className='px-6 py-3 font-medium text-center'>Score</th>
                    <th className='px-6 py-3 font-medium'>Status</th>
                    <th className='px-6 py-3 font-medium text-right'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200'>
                  {studentAssignments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className='text-center py-8 text-slate-400 italic'
                      >
                        {taskFilter === "ALL"
                          ? "No tasks assigned yet."
                          : `No ${taskFilter.toLowerCase()} tasks found.`}
                      </td>
                    </tr>
                  ) : (
                    studentAssignments.map((assignment) => {
                      const sub = submissions.find(
                        (s) => s.assignmentId === assignment.id
                      );
                      const status: SubmissionStatus =
                        sub?.status || "NOT_STARTED";

                      return (
                        <tr
                          key={assignment.id}
                          className='hover:bg-slate-50 transition-colors'
                        >
                          <td className='px-6 py-4'>
                            <div className='flex items-start gap-3'>
                              <div
                                className={`p-2 rounded-lg border ${getTaskColorClass(
                                  assignment.type
                                )}`}
                              >
                                {getTaskIcon(assignment.type)}
                              </div>
                              <div className='max-w-[180px]'>
                                <p
                                  className='font-medium text-slate-900 truncate'
                                  title={assignment.title}
                                >
                                  {assignment.title}
                                </p>
                                <p className='text-xs text-slate-500 truncate'>
                                  {assignment.type} Task
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            {new Date(assignment.dueDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className='px-6 py-4 text-center'>
                            {sub?.aiFeedback?.score ? (
                              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200'>
                                {sub.aiFeedback.score}
                              </span>
                            ) : (
                              <span className='text-slate-400 text-xs'>-</span>
                            )}
                          </td>
                          <td className='px-6 py-4'>
                            {status === "GRADED" ? (
                              <div className='flex items-center gap-1.5'>
                                <CheckCircle
                                  size={16}
                                  className='text-green-500'
                                />
                                <span className='text-slate-700 text-xs'>
                                  Graded
                                </span>
                              </div>
                            ) : status === "SUBMITTED" ? (
                              <div className='flex items-center gap-1.5'>
                                <Clock size={16} className='text-amber-500' />
                                <span className='text-slate-700 text-xs'>
                                  Submitted
                                </span>
                              </div>
                            ) : status === "PENDING" ? (
                              <div className='flex items-center gap-1.5'>
                                <Clock size={16} className='text-slate-400' />
                                <span className='text-slate-700 text-xs'>
                                  Draft
                                </span>
                              </div>
                            ) : (
                              <div className='flex items-center gap-1.5'>
                                <div className='w-4 h-4 rounded-full border border-slate-300' />
                                <span className='text-slate-400 text-xs'>
                                  Not Started
                                </span>
                              </div>
                            )}
                          </td>
                          <td className='px-6 py-4 text-right'>
                            {sub ? (
                              <button className='text-purple-600 hover:text-purple-700 font-medium text-xs flex items-center justify-end gap-1 w-full group'>
                                View Details{" "}
                                <ArrowRight
                                  size={14}
                                  className='group-hover:translate-x-0.5 transition-transform'
                                />
                              </button>
                            ) : (
                              <span className='text-slate-300 text-xs'>
                                No Data
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className='p-4 border-t border-slate-200 flex justify-center'>
              <button className='text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors'>
                Load more history
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDetailPage;
