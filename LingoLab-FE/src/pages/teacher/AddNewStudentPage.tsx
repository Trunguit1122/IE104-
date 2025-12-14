import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import { teacherApi } from "@/services/api";
import type { Class, User } from "@/types";

export function AddNewStudentPage() {
  const navigate = useNavigate();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  
  // API data
  const [classes, setClasses] = useState<Class[]>([]);
  const [learners, setLearners] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
  }>({});

  // Fetch classes and learners on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [classesData, learnersData] = await Promise.all([
          teacherApi.getClasses(),
          teacherApi.getLearners()
        ]);
        setClasses(classesData);
        setLearners(learnersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: { fullName?: string; email?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (learners.some((l) => l.email?.toLowerCase() === email.toLowerCase())) {
      newErrors.email = "A student with this email already exists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Find learner ID by email
      const targetLearner = learners.find(
        (l) => l.email?.toLowerCase() === email.trim().toLowerCase()
      );
      
      if (!targetLearner) {
        toast.error("Student not found. Please check the email address.");
        setIsSubmitting(false);
        return;
      }

      // Add student to each selected class
      for (const classId of selectedCourses) {
        await teacherApi.addLearnersToClass(classId, [targetLearner.id]);
      }

      toast.success("Student added successfully!", {
        description: `${fullName} has been enrolled in ${selectedCourses.length} course(s).`,
      });

      navigate(ROUTES.TEACHER.STUDENTS);
    } catch (error: any) {
      console.error("Error adding student:", error);
      toast.error(error.response?.data?.message || "Failed to add student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.TEACHER.STUDENTS);
  };

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className='text-slate-500 mt-4'>Loading...</p>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto pb-12 animate-in fade-in duration-300'>
      {/* Page Header */}
      <div className='flex flex-col gap-2 mb-8'>
        <button
          onClick={handleCancel}
          className='inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2 transition-colors w-fit'
        >
          <ArrowLeft size={16} />
          Back to Students
        </button>
        <h1 className='text-3xl font-bold text-slate-900 tracking-tight'>
          Add New Student
        </h1>
        <p className='text-slate-500 text-base'>
          Enter the student's details and enroll them in a course.
        </p>
      </div>

      {/* Form Card */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-8'>
          {/* Student Information Section */}
          <div className='flex flex-col gap-6'>
            <h3 className='text-lg font-bold text-slate-900 border-b border-slate-200 pb-3'>
              Student Information
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Full Name */}
              <div className='flex flex-col gap-2'>
                <Label
                  htmlFor='fullName'
                  className='text-slate-900 text-base font-medium'
                >
                  Full Name <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='fullName'
                  type='text'
                  placeholder='e.g., Nguyen Van A'
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }
                  }}
                  className={`h-12 bg-slate-50 border-slate-300 focus:border-purple-600 focus:ring-purple-600/50 ${
                    errors.fullName ? "border-red-500 focus:border-red-500 focus:ring-red-500/50" : ""
                  }`}
                />
                {errors.fullName && (
                  <p className='text-red-500 text-sm'>{errors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div className='flex flex-col gap-2'>
                <Label
                  htmlFor='email'
                  className='text-slate-900 text-base font-medium'
                >
                  Email Address <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='e.g., nguyenvana@email.com'
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  className={`h-12 bg-slate-50 border-slate-300 focus:border-purple-600 focus:ring-purple-600/50 ${
                    errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/50" : ""
                  }`}
                />
                {errors.email && (
                  <p className='text-red-500 text-sm'>{errors.email}</p>
                )}
              </div>

              {/* Contact Number */}
              <div className='flex flex-col gap-2'>
                <Label
                  htmlFor='contactNumber'
                  className='text-slate-900 text-base font-medium'
                >
                  Contact Number
                </Label>
                <Input
                  id='contactNumber'
                  type='tel'
                  placeholder='e.g., +84 912 345 678'
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className='h-12 bg-slate-50 border-slate-300 focus:border-purple-600 focus:ring-purple-600/50'
                />
              </div>
            </div>
          </div>

          {/* Course Enrollment Section */}
          <div className='flex flex-col gap-6'>
            <h3 className='text-lg font-bold text-slate-900 border-b border-slate-200 pb-3'>
              Course Enrollment
            </h3>

            <div className='flex flex-col gap-4'>
              <p className='text-slate-900 text-base font-medium'>
                Enroll in Courses
              </p>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {classes.length > 0 ? classes.map((course) => (
                  <label
                    key={course.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedCourses.includes(course.id)
                        ? "bg-purple-50 border-purple-600 ring-2 ring-purple-600/20"
                        : "border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type='checkbox'
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => handleCourseToggle(course.id)}
                      className='w-4 h-4 text-purple-600 rounded focus:ring-purple-600'
                    />
                    <span className='text-slate-700 text-sm font-medium'>
                      {course.name}
                    </span>
                  </label>
                )) : (
                  <p className='text-slate-500 italic col-span-3'>No classes available. Create a class first.</p>
                )}
              </div>
              {selectedCourses.length > 0 && (
                <p className='text-sm text-slate-500'>
                  {selectedCourses.length} course(s) selected
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-4 pt-6 border-t border-slate-200'>
            <Button
              type='button'
              variant='ghost'
              onClick={handleCancel}
              className='px-6 py-3 h-11 rounded-lg text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!fullName.trim() || !email.trim() || isSubmitting}
              className='px-6 py-3 h-11 rounded-lg text-white font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 gap-2'
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              {isSubmitting ? "Adding..." : "Add Student"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddNewStudentPage;

