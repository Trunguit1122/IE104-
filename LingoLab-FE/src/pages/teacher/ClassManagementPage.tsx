import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import {
  ClassCard,
  StudentListItem,
  AddStudentForm,
  CreateClassForm,
  EmptyClassState,
} from "@/components/class";
import { teacherApi, classesApi } from "@/services/api";
import type { Class, User } from "@/types";
import { toast } from "sonner";

export function ClassManagementPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  // Fetch classes from API
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      try {
        const classesData = await teacherApi.getClasses();
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Không thể tải danh sách lớp học");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleCreateClass = async (name: string) => {
    try {
      const newClass = await teacherApi.createClass({
        name,
        description: "",
      });
      setClasses([...classes, newClass]);
      setIsCreating(false);
      toast.success("Tạo lớp học thành công!");
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error("Không thể tạo lớp học");
    }
  };

  const handleAddStudent = async (name: string, email: string) => {
    if (!selectedClassId) return;

    // Note: This would typically involve enrolling a student by email
    // The actual API might have a different endpoint
    toast.info(`Thêm học sinh ${name} (${email}) vào lớp`);
    
    // Refresh class data
    try {
      const updatedClass = await classesApi.getById(selectedClassId);
      setClasses(classes.map((c) => 
        c.id === selectedClassId ? updatedClass : c
      ));
    } catch (error) {
      console.error("Error refreshing class:", error);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClassId) return;

    try {
      await classesApi.removeLearner(selectedClassId, studentId);
      
      // Update local state
      setClasses(classes.map((c) => {
        if (c.id === selectedClassId && c.learners) {
          return {
            ...c,
            learners: c.learners.filter((l) => l.id !== studentId),
          };
        }
        return c;
      }));
      
      toast.success("Đã xóa học sinh khỏi lớp");
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Không thể xóa học sinh khỏi lớp");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // --- DETAIL VIEW ---
  if (selectedClassId && selectedClass) {
    const classStudents = selectedClass.learners || [];

    return (
      <div className='space-y-6 animate-in fade-in duration-300 pb-12'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            onClick={() => setSelectedClassId(null)}
            className='pl-0 hover:bg-transparent hover:text-purple-600'
          >
            <ArrowLeft size={16} className='mr-2' /> Back to Classes
          </Button>
        </div>

        <div className='flex justify-between items-center'>
          <div>
            <h2 className='text-2xl font-bold text-slate-900'>
              {selectedClass.name}
            </h2>
            <p className='text-slate-500'>
              {classStudents.length} Students Enrolled
              {selectedClass.classCode && (
                <span className='ml-2 text-purple-600'>
                  • Code: {selectedClass.classCode}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Student List */}
          <Card className='lg:col-span-2 shadow-sm border-slate-200'>
            <CardHeader>
              <CardTitle>Class Roster</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              {classStudents.length === 0 ? (
                <p className='text-center text-slate-500 py-8 italic'>
                  No students in this class yet.
                </p>
              ) : (
                classStudents.map((student: User) => (
                  <StudentListItem
                    key={student.id}
                    id={student.id}
                    name={student.displayName || student.email}
                    email={student.email}
                    onRemove={handleRemoveStudent}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Add Student Form */}
          <AddStudentForm onAddStudent={handleAddStudent} />
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className='space-y-6 animate-in fade-in duration-300 pb-12'>
      <div className='flex flex-wrap justify-between items-center gap-4'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-3xl font-bold text-slate-900'>My Classes</h2>
          <p className='text-base font-normal text-slate-500'>
            Manage your classes and student enrollments.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className='bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-200'
        >
          <Plus size={18} className='mr-2' /> Create Class
        </Button>
      </div>

      {isCreating && (
        <CreateClassForm
          onCreateClass={handleCreateClass}
          onCancel={() => setIsCreating(false)}
        />
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {classes.map((c) => (
          <ClassCard
            key={c.id}
            id={c.id}
            name={c.name}
            studentCount={c.learnerCount || c.learners?.length || 0}
            onManage={setSelectedClassId}
          />
        ))}
        {classes.length === 0 && <EmptyClassState />}
      </div>
    </div>
  );
}

export default ClassManagementPage;
