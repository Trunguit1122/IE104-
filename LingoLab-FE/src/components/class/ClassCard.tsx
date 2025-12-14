import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ClassCardProps {
  id: string;
  name: string;
  studentCount: number;
  onManage: (id: string) => void;
}

export function ClassCard({ id, name, studentCount, onManage }: ClassCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow shadow-sm border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">{name}</h3>
            <p className="text-sm text-slate-500">
              {studentCount} {studentCount === 1 ? "Student" : "Students"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border-slate-300 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600"
          onClick={() => onManage(id)}
        >
          Manage Class
        </Button>
      </CardContent>
    </Card>
  );
}

export default ClassCard;

