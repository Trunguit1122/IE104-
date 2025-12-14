import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Plus,
  ChevronDown,
  Eye,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { mockStudents, mockClasses, type Student } from "@/data";
import { toast } from "sonner";

export function StudentManagementPage() {
  const navigate = useNavigate();
  const [students] = useState(mockStudents);
  const [classes] = useState(mockClasses);
  const [searchQuery, setSearchQuery] = useState("");

  // Lock status state. test thôi
  const [lockedStudents, setLockedStudents] = useState<Set<string>>(new Set());

  // Modal state
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [lockAction, setLockAction] = useState<"lock" | "unlock">("lock");

  // Filter students based on search
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functions
  const getStudentCourse = (studentId: string) => {
    const c = classes.find((cls) => cls.studentIds.includes(studentId));
    return c ? c.name : "Unassigned";
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return "bg-emerald-400";
    if (pct >= 60) return "bg-teal-400";
    if (pct >= 30) return "bg-amber-400";
    return "bg-slate-400";
  };

  // Deterministic mock data for demo purposes based on ID
  const getMockData = (id: string) => {
    const num = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const progress = num % 100;
    const times = [
      "2 days ago",
      "5 hours ago",
      "1 week ago",
      "Just now",
      "1 month ago",
    ];
    const lastActive = times[num % times.length];
    return { progress, lastActive };
  };

  const handleSelectStudent = (studentId: string) => {
    navigate(`/teacher/students/${studentId}`);
  };

  const handleLockClick = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setLockAction(lockedStudents.has(student.id) ? "unlock" : "lock");
    setShowLockModal(true);
  };

  const handleConfirmLock = () => {
    if (!selectedStudent) return;

    if (lockAction === "lock") {
      setLockedStudents((prev) => new Set([...prev, selectedStudent.id]));
      toast.success(`Account locked`, {
        description: `${selectedStudent.name}'s account has been locked.`,
      });
    } else {
      setLockedStudents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(selectedStudent.id);
        return newSet;
      });
      toast.success(`Account unlocked`, {
        description: `${selectedStudent.name}'s account has been unlocked.`,
      });
    }

    setShowLockModal(false);
    setSelectedStudent(null);
  };

  const handleCancelLock = () => {
    setShowLockModal(false);
    setSelectedStudent(null);
  };

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-300 pb-12'>
      {/* Header */}
      <div className='flex flex-wrap justify-between items-center gap-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-3xl font-bold text-slate-900'>
            Student Management
          </p>
          <p className='text-base font-normal text-slate-500'>
            Oversee and manage all your students in one place.
          </p>
        </div>
        <Button
          onClick={() => navigate(ROUTES.TEACHER.ADD_STUDENT)}
          className='inline-flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-purple-600 text-white text-sm font-bold leading-normal tracking-wide hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200'
        >
          <Plus size={20} />
          <span className='truncate'>Add New Student</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col md:flex-row gap-4 w-full'>
        <div className='flex-1'>
          <div className='flex w-full items-center rounded-lg h-14 bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent transition-shadow shadow-sm'>
            <div className='text-slate-400 flex items-center justify-center pl-4'>
              <Search size={20} />
            </div>
            <input
              className='flex w-full min-w-0 flex-1 rounded-lg text-slate-900 focus:outline-none border-none bg-transparent h-full placeholder:text-slate-400 pl-3 pr-4 text-sm font-medium'
              placeholder='Search by name or email...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className='flex gap-3'>
          <button className='flex h-14 items-center justify-center gap-x-2 rounded-lg bg-white border border-slate-200 pl-6 pr-5 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm'>
            <p className='text-sm font-medium'>Course: All</p>
            <ChevronDown size={20} className='text-slate-400' />
          </button>
          <button className='flex h-14 items-center justify-center gap-x-2 rounded-lg bg-white border border-slate-200 pl-6 pr-5 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm'>
            <p className='text-sm font-medium'>Status: All</p>
            <ChevronDown size={20} className='text-slate-400' />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className='w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left text-slate-500'>
            <thead className='text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200'>
              <tr>
                <th className='p-4 w-10'>
                  <input
                    type='checkbox'
                    className='rounded border-slate-300 text-purple-600 focus:ring-purple-600 w-4 h-4'
                  />
                </th>
                <th className='px-6 py-3 font-medium tracking-wider'>
                  Student Name
                </th>
                <th className='px-6 py-3 font-medium tracking-wider'>
                  Enrolled Course
                </th>
                <th className='px-6 py-3 font-medium tracking-wider'>
                  Progress
                </th>
                <th className='px-6 py-3 font-medium tracking-wider'>
                  Last Active
                </th>
                <th className='px-6 py-3 font-medium text-right tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {filteredStudents.map((student) => {
                const { progress, lastActive } = getMockData(student.id);
                return (
                  <tr
                    key={student.id}
                    className='bg-white hover:bg-slate-50 transition-colors group cursor-pointer'
                    onClick={() => handleSelectStudent(student.id)}
                  >
                    <td className='p-4' onClick={(e) => e.stopPropagation()}>
                      <input
                        type='checkbox'
                        className='rounded border-slate-300 text-purple-600 focus:ring-purple-600 w-4 h-4'
                      />
                    </td>
                    <th className='px-6 py-4 font-medium text-slate-900 whitespace-nowrap'>
                      <div className='flex items-center gap-3'>
                        <div className='relative'>
                          {student.avatar ? (
                            <img
                              className={`w-10 h-10 rounded-full object-cover border ${
                                lockedStudents.has(student.id)
                                  ? "border-amber-300 opacity-60"
                                  : "border-slate-200"
                              }`}
                              src={student.avatar}
                              alt={student.name}
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border ${
                                lockedStudents.has(student.id)
                                  ? "bg-slate-100 text-slate-400 border-amber-300"
                                  : "bg-purple-100 text-purple-600 border-purple-200"
                              }`}
                            >
                              {student.name[0]}
                            </div>
                          )}
                          {lockedStudents.has(student.id) && (
                            <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center'>
                              <Lock size={10} className='text-white' />
                            </div>
                          )}
                        </div>
                        <div className='flex flex-col'>
                          <div className='flex items-center gap-2'>
                            <span
                              className={`text-sm font-semibold ${
                                lockedStudents.has(student.id)
                                  ? "text-slate-500"
                                  : ""
                              }`}
                            >
                              {student.name}
                            </span>
                            {lockedStudents.has(student.id) && (
                              <span className='inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700'>
                                Locked
                              </span>
                            )}
                          </div>
                          <span className='text-xs text-slate-500 font-normal'>
                            {student.email}
                          </span>
                        </div>
                      </div>
                    </th>
                    <td className='px-6 py-4 text-slate-600'>
                      {getStudentCourse(student.id)}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-24 bg-slate-100 rounded-full h-2 overflow-hidden'>
                          <div
                            className={`h-full rounded-full ${getProgressColor(
                              progress
                            )}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className='font-medium text-slate-700 text-xs'>
                          {progress}%
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-slate-600'>{lastActive}</td>
                    <td className='px-6 py-4 text-right'>
                      <div className='flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <button
                          className='p-2 rounded-md hover:bg-slate-100 text-slate-400 hover:text-purple-600 transition-colors'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStudent(student.id);
                          }}
                          title='View details'
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className='p-2 rounded-md hover:bg-slate-100 text-slate-400 hover:text-purple-600 transition-colors'
                          onClick={(e) => e.stopPropagation()}
                          title='Edit student'
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          className={`p-2 rounded-md transition-colors ${
                            lockedStudents.has(student.id)
                              ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600"
                              : "text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                          }`}
                          onClick={(e) => handleLockClick(student, e)}
                          title={
                            lockedStudents.has(student.id)
                              ? "Unlock account"
                              : "Lock account"
                          }
                        >
                          {lockedStudents.has(student.id) ? (
                            <Lock size={18} />
                          ) : (
                            <Unlock size={18} />
                          )}
                        </button>
                        <button
                          className='p-2 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors'
                          onClick={(e) => e.stopPropagation()}
                          title='Delete student'
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className='text-center py-8 text-slate-400 italic'
                  >
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className='flex flex-col sm:flex-row justify-between items-center gap-4 py-2'>
        <span className='text-sm text-slate-500'>
          Showing{" "}
          <span className='font-semibold text-slate-900'>
            1-{filteredStudents.length}
          </span>{" "}
          of{" "}
          <span className='font-semibold text-slate-900'>
            {filteredStudents.length}
          </span>
        </span>
        <div className='flex items-center gap-2'>
          <button className='flex items-center justify-center h-9 w-9 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'>
            <ChevronLeft size={20} />
          </button>
          <span className='text-sm font-medium text-slate-700'>
            Page 1 of 1
          </span>
          <button className='flex items-center justify-center h-9 w-9 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Lock/Unlock Confirmation Modal */}
      {showLockModal && selectedStudent && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          {/* Backdrop */}
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={handleCancelLock}
          />

          {/* Modal */}
          <div className='relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200'>
            {/* Close button */}
            <button
              onClick={handleCancelLock}
              className='absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors'
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className='p-6'>
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  lockAction === "lock"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {lockAction === "lock" ? (
                  <Lock size={24} />
                ) : (
                  <Unlock size={24} />
                )}
              </div>

              {/* Title */}
              <h3 className='text-lg font-bold text-slate-900 text-center mb-2'>
                {lockAction === "lock"
                  ? "Lock Student Account"
                  : "Unlock Student Account"}
              </h3>

              {/* Description */}
              <p className='text-slate-500 text-center mb-6'>
                {lockAction === "lock" ? (
                  <>
                    Are you sure you want to lock{" "}
                    <span className='font-semibold text-slate-700'>
                      {selectedStudent.name}
                    </span>
                    's account? They will not be able to access the platform
                    until unlocked.
                  </>
                ) : (
                  <>
                    Are you sure you want to unlock{" "}
                    <span className='font-semibold text-slate-700'>
                      {selectedStudent.name}
                    </span>
                    's account? They will regain full access to the platform.
                  </>
                )}
              </p>

              {/* Warning for lock action */}
              {lockAction === "lock" && (
                <div className='flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6'>
                  <AlertTriangle
                    size={18}
                    className='text-amber-600 mt-0.5 shrink-0'
                  />
                  <p className='text-sm text-amber-800'>
                    The student will be logged out immediately and won't be able
                    to submit any assignments.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className='flex gap-3'>
                <Button
                  variant='ghost'
                  onClick={handleCancelLock}
                  className='flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmLock}
                  className={`flex-1 h-11 font-semibold ${
                    lockAction === "lock"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {lockAction === "lock" ? "Lock Account" : "Unlock Account"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentManagementPage;
