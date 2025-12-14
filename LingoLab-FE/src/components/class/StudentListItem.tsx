import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentListItemProps {
  id: string;
  name: string;
  email: string;
  onRemove: (id: string) => void;
}

export function StudentListItem({ id, name, email, onRemove }: StudentListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
          {name[0]}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-500 hover:bg-red-50 hover:text-red-600"
        onClick={() => onRemove(id)}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

export default StudentListItem;

