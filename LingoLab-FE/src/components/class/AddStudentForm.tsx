import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddStudentFormProps {
  onAddStudent: (name: string, email: string) => void;
}

export function AddStudentForm({ onAddStudent }: AddStudentFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (name && email) {
      onAddStudent(name, email);
      setName("");
      setEmail("");
    }
  };

  return (
    <Card className="h-fit shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle>Add Student</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Student Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="h-11 border-slate-300"
          />
        </div>
        <div className="space-y-2">
          <Label>Email Address</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="h-11 border-slate-300"
          />
        </div>
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={!name || !email}
          onClick={handleSubmit}
        >
          <Plus size={16} className="mr-2" /> Add to Class
        </Button>
        <p className="text-xs text-slate-400 mt-2">
          If the email exists, the existing student will be added. Otherwise, a
          new student account will be created.
        </p>
      </CardContent>
    </Card>
  );
}

export default AddStudentForm;

