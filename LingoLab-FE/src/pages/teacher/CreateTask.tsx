import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Calendar, Search, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants";
import { toast } from "sonner";
import { promptsApi, topicsApi } from "@/services/api";
import type { Topic, SkillType, Difficulty } from "@/types";

export function CreateTaskPage() {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<SkillType>("writing");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [minWordCount, setMinWordCount] = useState(250);
  const [timeLimit, setTimeLimit] = useState(40);

  // Topic State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Scoring State
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [criteria, setCriteria] = useState<string[]>(["Grammar", "Vocabulary", "Coherence", "Task Achievement"]);
  const [tone, setTone] = useState("Formal & Encouraging");

  // Scheduling State
  const [dueDate, setDueDate] = useState("");

  // File Upload State
  const [attachments, setAttachments] = useState<File[]>([]);

  // Fetch topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true);
      try {
        const topicsData = await topicsApi.getAll();
        setTopics(topicsData);
        if (topicsData.length > 0) {
          setSelectedTopicId(topicsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching topics:", error);
        toast.error("Failed to load topics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
    // Reset input value to allow uploading the same file again
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext || "")) return "📄";
    if (["doc", "docx"].includes(ext || "")) return "📝";
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) return "🖼️";
    if (["mp3", "wav", "ogg"].includes(ext || "")) return "🎵";
    if (["mp4", "mov", "avi"].includes(ext || "")) return "🎬";
    return "📎";
  };

  const toggleCriteria = (crit: string) => {
    setCriteria(prev => 
      prev.includes(crit) 
        ? prev.filter(c => c !== crit)
        : [...prev, crit]
    );
  };

  const handleSave = async () => {
    if (!instructions) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await promptsApi.create({
        content: instructions,
        skillType: type,
        difficulty,
        prepTime: 60, // 1 minute prep time
        responseTime: timeLimit * 60, // convert minutes to seconds
        description: title, // use title as description
      });

      toast.success("Prompt created successfully!");
      navigate(ROUTES.TEACHER.DASHBOARD);
    } catch (error: any) {
      console.error("Error creating prompt:", error);
      toast.error(error.response?.data?.message || "Failed to create prompt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(ROUTES.TEACHER.DASHBOARD);
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
      <div className='flex flex-wrap justify-between gap-3 mb-8'>
        <p className='text-slate-900 text-4xl font-black leading-tight tracking-tight'>
          Create New Prompt
        </p>
      </div>

      <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8'>
        {/* Task Details Section */}
        <div className='space-y-6'>
          <h2 className='text-xl font-bold text-slate-900'>Prompt Details</h2>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='title'
              className='text-slate-900 text-base font-medium'
            >
              Prompt Title
            </Label>
            <Input
              id='title'
              className='h-14 bg-slate-50 border-slate-300 focus:border-purple-600 focus:ring-purple-600/50'
              placeholder='e.g., IELTS Writing Task 2: Opinion Essay'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <p className='text-slate-900 text-base font-medium leading-normal pb-2'>
              Skill Type
            </p>
            <div className='grid grid-cols-2 gap-4'>
              <label
                className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                  type === "writing"
                    ? "border-purple-600 bg-purple-50 ring-2 ring-purple-600/20"
                    : "border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type='radio'
                  name='task_type'
                  value='writing'
                  checked={type === "writing"}
                  onChange={() => setType("writing")}
                  className='w-4 h-4 text-purple-600 focus:ring-purple-600'
                />
                <span className='font-medium text-slate-900'>Writing</span>
              </label>
              <label
                className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                  type === "speaking"
                    ? "border-purple-600 bg-purple-50 ring-2 ring-purple-600/20"
                    : "border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type='radio'
                  name='task_type'
                  value='speaking'
                  checked={type === "speaking"}
                  onChange={() => setType("speaking")}
                  className='w-4 h-4 text-purple-600 focus:ring-purple-600'
                />
                <span className='font-medium text-slate-900'>
                  Speaking
                </span>
              </label>
            </div>
          </div>

          <div>
            <p className='text-slate-900 text-base font-medium leading-normal pb-2'>
              Difficulty
            </p>
            <div className='grid grid-cols-3 gap-4'>
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <label
                  key={d}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                    difficulty === d
                      ? "border-purple-600 bg-purple-50 ring-2 ring-purple-600/20"
                      : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type='radio'
                    name='difficulty'
                    value={d}
                    checked={difficulty === d}
                    onChange={() => setDifficulty(d)}
                    className='w-4 h-4 text-purple-600 focus:ring-purple-600'
                  />
                  <span className='font-medium text-slate-900 capitalize'>{d}</span>
                </label>
              ))}
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='description'
              className='text-slate-900 text-base font-medium'
            >
              Description
            </Label>
            <textarea
              id='description'
              className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 min-h-[144px] placeholder:text-slate-400 p-4 text-base resize-y'
              placeholder="Provide an overview of the task's purpose and learning goals..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='instructions'
              className='text-slate-900 text-base font-medium'
            >
              Instructions
            </Label>
            <textarea
              id='instructions'
              className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 min-h-[144px] placeholder:text-slate-400 p-4 text-base resize-y'
              placeholder='Add step-by-step instructions for the students...'
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* File Attachments */}
          <div className='flex flex-col gap-2'>
            <Label className='text-slate-900 text-base font-medium'>
              Attachments (Optional)
            </Label>
            <p className='text-sm text-slate-500 -mt-1'>
              Upload reference materials, rubrics, or example files for students
            </p>

            {/* Upload Area */}
            <label className='border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 hover:border-purple-400 transition-colors bg-slate-50/50'>
              <div className='w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center'>
                <Upload size={24} />
              </div>
              <div className='text-center'>
                <p className='text-sm font-medium text-slate-900'>
                  Click to upload or drag and drop
                </p>
                <p className='text-xs text-slate-500 mt-1'>
                  PDF, DOC, Images, Audio, Video (Max 10MB each)
                </p>
              </div>
              <input
                type='file'
                className='hidden'
                multiple
                accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.mov'
                onChange={handleFileUpload}
              />
            </label>

            {/* Uploaded Files List */}
            {attachments.length > 0 && (
              <div className='mt-3 space-y-2'>
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg group hover:border-purple-200 transition-colors'
                  >
                    <div className='flex items-center gap-3 min-w-0'>
                      <span className='text-xl'>{getFileIcon(file.name)}</span>
                      <div className='min-w-0'>
                        <p className='text-sm font-medium text-slate-900 truncate'>
                          {file.name}
                        </p>
                        <p className='text-xs text-slate-500'>
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={() => removeAttachment(index)}
                      className='p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors'
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Scoring Section */}
        <div className='space-y-6 pt-8 border-t border-slate-200'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold text-slate-900'>
              AI Automated Scoring & Feedback
            </h2>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                className='sr-only peer'
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              <span className='ml-3 text-sm font-medium text-slate-900'>
                Enable AI
              </span>
            </label>
          </div>

          <div
            className={`${
              !aiEnabled ? "opacity-50 pointer-events-none" : ""
            } space-y-6 transition-opacity`}
          >
            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='aiPrompt'
                className='text-slate-900 text-base font-medium'
              >
                AI Evaluation Prompt
              </Label>
              <textarea
                id='aiPrompt'
                className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 min-h-[144px] placeholder:text-slate-400 p-4 text-base resize-y'
                placeholder="Describe how the AI should evaluate student submissions. For example: 'As an IELTS examiner, assess this writing task based on coherence, vocabulary, and grammar...'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>

            <div>
              <p className='text-slate-900 text-base font-medium leading-normal pb-2'>
                Scoring Criteria
              </p>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {[
                  "Grammar",
                  "Vocabulary",
                  "Coherence",
                  "Fluency",
                  "Task Achievement",
                ].map((crit) => (
                  <label
                    key={crit}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      criteria.includes(crit)
                        ? "border-purple-600 bg-purple-50"
                        : "border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type='checkbox'
                      className='w-4 h-4 text-purple-600 rounded focus:ring-purple-600'
                      checked={criteria.includes(crit)}
                      onChange={() => toggleCriteria(crit)}
                    />
                    <span className='text-sm font-medium text-slate-900'>
                      {crit}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='tone'
                className='text-slate-900 text-base font-medium'
              >
                AI Feedback Tone
              </Label>
              <select
                id='tone'
                className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 h-14 px-4 text-base appearance-none cursor-pointer'
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option>Formal & Encouraging</option>
                <option>Direct & Concise</option>
                <option>In-depth & Analytical</option>
                <option>Custom Template...</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scheduling Section */}
        <div className='space-y-6 pt-8 border-t border-slate-200'>
          <h2 className='text-xl font-bold text-slate-900'>
            Scheduling & Assignment
          </h2>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='dueDate'
              className='text-slate-900 text-base font-medium'
            >
              Deadline
            </Label>
            <div className='relative'>
              <Calendar
                className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400'
                size={20}
              />
              <input
                id='dueDate'
                type='date'
                className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 h-14 placeholder:text-slate-400 pl-12 pr-4 text-base'
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='topicSelect'
              className='text-slate-900 text-base font-medium'
            >
              Topic
            </Label>
            <div className='relative'>
              <Search
                className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400'
                size={20}
              />
              <select
                id='topicSelect'
                className='w-full rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/50 border border-slate-300 bg-slate-50 focus:border-purple-600 h-14 pl-12 pr-4 text-base appearance-none cursor-pointer'
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
              >
                {topics.length > 0 ? topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                )) : (
                  <option value="">No topics available</option>
                )}
              </select>
            </div>
          </div>

          {type === "writing" && (
            <div className='flex flex-col gap-2'>
              <Label
                htmlFor='minWordCount'
                className='text-slate-900 text-base font-medium'
              >
                Minimum Word Count
              </Label>
              <Input
                id='minWordCount'
                type='number'
                className='h-14 bg-slate-50 border-slate-300 focus:border-purple-600 focus:ring-purple-600/50'
                placeholder='250'
                value={minWordCount}
                onChange={(e) => setMinWordCount(Number(e.target.value))}
              />
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <Label
              htmlFor='timeLimit'
              className='text-slate-900 text-base font-medium'
            >
              Time Limit (minutes)
            </Label>
            <Input
              id='timeLimit'
              type='number'
              className='h-14 bg-slate-50 border-slate-300 focus:border-purple-600 focus:ring-purple-600/50'
              placeholder='40'
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Actions */}
        <div className='flex justify-end gap-4 pt-8 border-t border-slate-200'>
          <Button
            variant='ghost'
            onClick={handleCancel}
            className='px-6 py-3 h-auto rounded-lg text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200'
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title || !selectedTopicId || isSubmitting}
            className='px-6 py-3 h-auto rounded-lg text-white font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200'
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
            {isSubmitting ? "Creating..." : "Create Prompt"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CreateTaskPage;
