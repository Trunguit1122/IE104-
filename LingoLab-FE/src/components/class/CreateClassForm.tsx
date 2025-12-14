import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateClassFormProps {
  onCreateClass: (name: string) => void;
  onCancel: () => void;
}

export function CreateClassForm({ onCreateClass, onCancel }: CreateClassFormProps) {
  const [className, setClassName] = useState("");

  const handleCreate = () => {
    if (className) {
      onCreateClass(className);
      setClassName("");
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30 shadow-sm">
      <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 space-y-2 w-full">
          <Label>New Class Name</Label>
          <Input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. IELTS Evening Group A"
            autoFocus
            className="h-11 border-slate-300"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            disabled={!className}
            onClick={handleCreate}
            className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700"
          >
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CreateClassForm;

