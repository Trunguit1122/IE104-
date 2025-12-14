import { Users } from "lucide-react";

interface EmptyClassStateProps {
  message?: string;
}

export function EmptyClassState({ 
  message = 'No classes created yet. Click "Create Class" to get started.' 
}: EmptyClassStateProps) {
  return (
    <div className="col-span-2 text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
      <Users size={48} className="mx-auto mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );
}

export default EmptyClassState;

