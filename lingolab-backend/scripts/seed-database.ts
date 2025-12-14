import "reflect-metadata";
import { AppDataSource } from "../src/data-source";
import { User, UserRole, UserStatus, UILanguage } from "../src/entities/User";
import { Topic } from "../src/entities/Topic";
import { Prompt, SkillType, DifficultyLevel, WritingTaskType } from "../src/entities/Prompt";
import { Class } from "../src/entities/Class";
import { LearnerProfile } from "../src/entities/LearnerProfile";
import { Attempt, AttemptStatus } from "../src/entities/Attempt";
import { Score } from "../src/entities/Score";
import { Feedback, FeedbackType, FeedbackVisibility } from "../src/entities/Feedback";
import { ScoringJob, ScoringJobStatus } from "../src/entities/ScoringJob";
import * as bcrypt from "bcrypt";

/**
 * Comprehensive Database Seeder
 * Creates realistic demo data for LingoLab IELTS platform
 */
async function seedDatabase() {
  try {
    console.log("🚀 Initializing database connection...");
    await AppDataSource.initialize();
    console.log("✅ Database connected successfully");

    // Clear existing data (optional - comment out if you want to preserve data)
    console.log("\n🧹 Clearing existing data...");
    try {
      await AppDataSource.query("TRUNCATE TABLE class_learners CASCADE");
      await AppDataSource.query("TRUNCATE TABLE classes CASCADE");
      await AppDataSource.query("TRUNCATE TABLE feedbacks CASCADE");
      await AppDataSource.query("TRUNCATE TABLE scores CASCADE");
      await AppDataSource.query("TRUNCATE TABLE scoring_jobs CASCADE");
      await AppDataSource.query("TRUNCATE TABLE attempt_media CASCADE");
      await AppDataSource.query("TRUNCATE TABLE attempts CASCADE");
      await AppDataSource.query("TRUNCATE TABLE prompts CASCADE");
      await AppDataSource.query("TRUNCATE TABLE topics CASCADE");
      await AppDataSource.query("TRUNCATE TABLE learner_profiles CASCADE");
      await AppDataSource.query("TRUNCATE TABLE users CASCADE");
      console.log("✅ Data cleared");
    } catch (error) {
      console.log("⚠️  Some tables don't exist yet, continuing...");
    }

    // =================================================================
    // 1. CREATE USERS
    // =================================================================
    console.log("\n👥 Creating users...");
    const userRepo = AppDataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // Admin user
    const admin = userRepo.create({
      email: "admin@lingolab.com",
      password: hashedPassword,
      displayName: "System Administrator",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      uiLanguage: UILanguage.EN,
    });
    await userRepo.save(admin);
    console.log(`✅ Admin created: ${admin.email}`);

    // Teachers - Thêm nhiều giáo viên hơn
    const teachers = [];
    const teacherData = [
      { email: "teacher.john@lingolab.com", name: "John Smith", lang: UILanguage.EN },
      { email: "teacher.nguyen@lingolab.com", name: "Nguyễn Văn A", lang: UILanguage.VI },
      { email: "teacher.sarah@lingolab.com", name: "Sarah Johnson", lang: UILanguage.EN },
      { email: "teacher.tran@lingolab.com", name: "Trần Thị Bích", lang: UILanguage.VI },
      { email: "teacher.michael@lingolab.com", name: "Michael Brown", lang: UILanguage.EN },
      { email: "teacher1@lingolab.com", name: "Teacher Demo 1", lang: UILanguage.EN },
      { email: "teacher2@lingolab.com", name: "Giáo Viên Demo 2", lang: UILanguage.VI },
    ];

    for (const data of teacherData) {
      const teacher = userRepo.create({
        email: data.email,
        password: hashedPassword,
        displayName: data.name,
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        uiLanguage: data.lang,
      });
      await userRepo.save(teacher);
      teachers.push(teacher);
      console.log(`✅ Teacher created: ${teacher.email}`);
    }

    // Learners - Thêm nhiều học sinh hơn để test
    const learners = [];
    const learnerData = [
      { email: "learner.alice@example.com", name: "Alice Brown", lang: UILanguage.EN },
      { email: "learner.minh@example.com", name: "Trần Minh", lang: UILanguage.VI },
      { email: "learner.bob@example.com", name: "Bob Wilson", lang: UILanguage.EN },
      { email: "learner.lan@example.com", name: "Nguyễn Thị Lan", lang: UILanguage.VI },
      { email: "learner.charlie@example.com", name: "Charlie Davis", lang: UILanguage.EN },
      { email: "learner.hung@example.com", name: "Lê Văn Hùng", lang: UILanguage.VI },
      { email: "learner.diana@example.com", name: "Diana Martinez", lang: UILanguage.EN },
      { email: "learner.thu@example.com", name: "Phạm Thu Thảo", lang: UILanguage.VI },
      { email: "learner.emma@example.com", name: "Emma Johnson", lang: UILanguage.EN },
      { email: "learner.nam@example.com", name: "Hoàng Nam", lang: UILanguage.VI },
      { email: "learner.frank@example.com", name: "Frank Thompson", lang: UILanguage.EN },
      { email: "learner.linh@example.com", name: "Vũ Thị Linh", lang: UILanguage.VI },
      { email: "learner.george@example.com", name: "George Miller", lang: UILanguage.EN },
      { email: "learner.hanh@example.com", name: "Đỗ Thị Hạnh", lang: UILanguage.VI },
      { email: "learner.henry@example.com", name: "Henry Adams", lang: UILanguage.EN },
      { email: "student1@lingolab.com", name: "Student Demo 1", lang: UILanguage.EN },
      { email: "student2@lingolab.com", name: "Học Sinh Demo 2", lang: UILanguage.VI },
      { email: "student3@lingolab.com", name: "Student Demo 3", lang: UILanguage.EN },
    ];

    for (const data of learnerData) {
      const learner = userRepo.create({
        email: data.email,
        password: hashedPassword,
        displayName: data.name,
        role: UserRole.LEARNER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        uiLanguage: data.lang,
      });
      await userRepo.save(learner);
      learners.push(learner);
      console.log(`✅ Learner created: ${learner.email}`);
    }

    // =================================================================
    // 2. CREATE LEARNER PROFILES
    // =================================================================
    console.log("\n📊 Creating learner profiles...");
    const profileRepo = AppDataSource.getRepository(LearnerProfile);

    const learnerGoals = [
      "Achieve IELTS 7.0 for university admission",
      "Improve speaking fluency and confidence",
      "Master academic writing for IELTS",
      "Practice daily to maintain English skills",
      "Prepare for IELTS exam in 3 months",
      "Enhance vocabulary and grammar",
    ];

    for (let i = 0; i < learners.length; i++) {
      const learner = learners[i];
      const profile = profileRepo.create({
        userId: learner.id,
        targetBand: 6 + Math.floor(Math.random() * 3), // Random between 6-8
        currentBand: 5 + Math.floor(Math.random() * 2), // Random between 5-6
        nativeLanguage: learner.uiLanguage === UILanguage.VI ? "Vietnamese" : "English",
        learningGoals: learnerGoals[i % learnerGoals.length],
      });
      await profileRepo.save(profile);
    }
    console.log(`✅ Created ${learners.length} learner profiles`);

    // =================================================================
    // 3. CREATE TOPICS
    // =================================================================
    console.log("\n📚 Creating topics...");
    const topicRepo = AppDataSource.getRepository(Topic);

    const topicsData = [
      { name: "Education", description: "Topics related to learning, schools, and academic life", icon: "🎓", order: 1 },
      { name: "Technology", description: "Modern technology, social media, and digital life", icon: "💻", order: 2 },
      { name: "Environment", description: "Climate change, pollution, and sustainability", icon: "🌍", order: 3 },
      { name: "Health", description: "Physical and mental health, fitness, and lifestyle", icon: "🏥", order: 4 },
      { name: "Work", description: "Career, jobs, workplace, and professional development", icon: "💼", order: 5 },
      { name: "Culture", description: "Arts, traditions, customs, and cultural diversity", icon: "🎭", order: 6 },
      { name: "Travel", description: "Tourism, exploration, and experiencing new places", icon: "✈️", order: 7 },
      { name: "Family", description: "Relationships, parenting, and family dynamics", icon: "👨‍👩‍👧‍👦", order: 8 },
      { name: "Media", description: "News, entertainment, advertising, and communication", icon: "📺", order: 9 },
      { name: "Society", description: "Social issues, community, and urban development", icon: "🏙️", order: 10 },
    ];

    const topics = [];
    for (const data of topicsData) {
      const topic = topicRepo.create({
        name: data.name,
        description: data.description,
        icon: data.icon,
        sortOrder: data.order,
        isActive: true,
      });
      await topicRepo.save(topic);
      topics.push(topic);
      console.log(`✅ Topic created: ${topic.name}`);
    }

    // =================================================================
    // 4. CREATE PROMPTS (Speaking & Writing)
    // =================================================================
    console.log("\n💬 Creating prompts...");
    const promptRepo = AppDataSource.getRepository(Prompt);

    // Speaking Prompts
    const speakingPrompts = [
      // Education
      { 
        topic: topics[0], 
        content: "Describe your favorite subject at school. You should say: what the subject is, why you like it, how it has helped you, and explain why you think it's important.",
        difficulty: DifficultyLevel.EASY,
        prepTime: 60,
        responseTime: 120,
        description: "Part 2 - Individual long turn"
      },
      {
        topic: topics[0],
        content: "Some people believe that university education should be free for all students. Others think students should pay fees. Discuss both views and give your opinion.",
        difficulty: DifficultyLevel.HARD,
        prepTime: 45,
        responseTime: 180,
        description: "Part 3 - Two-way discussion"
      },
      // Technology
      {
        topic: topics[1],
        content: "Do you use social media? How often do you use it and what for?",
        difficulty: DifficultyLevel.EASY,
        prepTime: 30,
        responseTime: 60,
        description: "Part 1 - Introduction"
      },
      {
        topic: topics[1],
        content: "Describe a piece of technology you find useful. You should say: what it is, how you use it, when you got it, and explain why it is useful to you.",
        difficulty: DifficultyLevel.MEDIUM,
        prepTime: 60,
        responseTime: 120,
        description: "Part 2 - Individual long turn"
      },
      // Environment
      {
        topic: topics[2],
        content: "What do you think are the main environmental problems in your country?",
        difficulty: DifficultyLevel.MEDIUM,
        prepTime: 30,
        responseTime: 90,
        description: "Part 3 - Discussion"
      },
      {
        topic: topics[2],
        content: "How can individuals contribute to protecting the environment in their daily lives?",
        difficulty: DifficultyLevel.MEDIUM,
        prepTime: 45,
        responseTime: 120,
        description: "Part 3 - Discussion"
      },
      // Health
      {
        topic: topics[3],
        content: "Do you think it's important to exercise regularly? Why or why not?",
        difficulty: DifficultyLevel.EASY,
        prepTime: 30,
        responseTime: 60,
        description: "Part 1 - Introduction"
      },
      {
        topic: topics[3],
        content: "Describe a healthy lifestyle change you have made. You should say: what the change was, when you made it, why you made it, and explain how it has affected your life.",
        difficulty: DifficultyLevel.MEDIUM,
        prepTime: 60,
        responseTime: 120,
        description: "Part 2 - Individual long turn"
      },
      // Work
      {
        topic: topics[4],
        content: "What do you do? Do you work or are you a student?",
        difficulty: DifficultyLevel.EASY,
        prepTime: 15,
        responseTime: 45,
        description: "Part 1 - Introduction"
      },
      {
        topic: topics[4],
        content: "In the future, do you think people will have more flexible working arrangements? Why or why not?",
        difficulty: DifficultyLevel.HARD,
        prepTime: 45,
        responseTime: 150,
        description: "Part 3 - Abstract discussion"
      },
    ];

    for (const prompt of speakingPrompts) {
      const createdPrompt = promptRepo.create({
        createdBy: teachers[0].id,
        topicId: prompt.topic.id,
        skillType: SkillType.SPEAKING,
        content: prompt.content,
        difficulty: prompt.difficulty,
        prepTime: prompt.prepTime,
        responseTime: prompt.responseTime,
        description: prompt.description,
        isActive: true,
      });
      await promptRepo.save(createdPrompt);
    }
    console.log(`✅ Created ${speakingPrompts.length} speaking prompts`);

    // Writing Prompts
    const writingPrompts = [
      // Task 1 - Academic
      {
        topic: topics[0],
        content: "The chart below shows the percentage of students who passed their high school exams in different subjects in 2020 and 2023. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
        difficulty: DifficultyLevel.MEDIUM,
        taskType: WritingTaskType.TASK_1,
        minWords: 150,
        maxWords: 200,
        prepTime: 60,
        responseTime: 1200, // 20 minutes
        description: "Academic Writing Task 1 - Data description"
      },
      {
        topic: topics[2],
        content: "The diagrams below show the changes in a town center between 1990 and 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
        difficulty: DifficultyLevel.MEDIUM,
        taskType: WritingTaskType.TASK_1,
        minWords: 150,
        maxWords: 200,
        prepTime: 60,
        responseTime: 1200,
        description: "Academic Writing Task 1 - Map/diagram"
      },
      // Task 2 - Opinion Essays
      {
        topic: topics[0],
        content: "Some people believe that the best way to improve public health is by increasing the number of sports facilities. Others think that this would have little effect on public health and other measures are required. Discuss both views and give your own opinion.",
        difficulty: DifficultyLevel.HARD,
        taskType: WritingTaskType.TASK_2,
        minWords: 250,
        maxWords: 350,
        prepTime: 120,
        responseTime: 2400, // 40 minutes
        description: "Academic Writing Task 2 - Discussion essay"
      },
      {
        topic: topics[1],
        content: "In many countries, children are becoming more dependent on technology for education and entertainment. What are the advantages and disadvantages of this trend?",
        difficulty: DifficultyLevel.MEDIUM,
        taskType: WritingTaskType.TASK_2,
        minWords: 250,
        maxWords: 350,
        prepTime: 120,
        responseTime: 2400,
        description: "Academic Writing Task 2 - Advantages/disadvantages"
      },
      {
        topic: topics[2],
        content: "Climate change is now an accepted threat to our planet, but there is not enough political action to control excessive consumerism and pollution. Do you agree or disagree?",
        difficulty: DifficultyLevel.HARD,
        taskType: WritingTaskType.TASK_2,
        minWords: 250,
        maxWords: 350,
        prepTime: 120,
        responseTime: 2400,
        description: "Academic Writing Task 2 - Opinion essay"
      },
      {
        topic: topics[4],
        content: "Some people think that employers should not care about the way their employees dress, because what matters is the quality of their work. To what extent do you agree or disagree?",
        difficulty: DifficultyLevel.MEDIUM,
        taskType: WritingTaskType.TASK_2,
        minWords: 250,
        maxWords: 350,
        prepTime: 120,
        responseTime: 2400,
        description: "Academic Writing Task 2 - Opinion essay"
      },
      {
        topic: topics[8],
        content: "In some countries, TV programs and movies are watched more than reading books. Why is this happening? Is it a positive or negative development?",
        difficulty: DifficultyLevel.MEDIUM,
        taskType: WritingTaskType.TASK_2,
        minWords: 250,
        maxWords: 350,
        prepTime: 120,
        responseTime: 2400,
        description: "Academic Writing Task 2 - Cause/effect essay"
      },
    ];

    for (const prompt of writingPrompts) {
      const createdPrompt = promptRepo.create({
        createdBy: teachers[1].id,
        topicId: prompt.topic.id,
        skillType: SkillType.WRITING,
        content: prompt.content,
        difficulty: prompt.difficulty,
        writingTaskType: prompt.taskType,
        minWordCount: prompt.minWords,
        maxWordCount: prompt.maxWords,
        prepTime: prompt.prepTime,
        responseTime: prompt.responseTime,
        description: prompt.description,
        isActive: true,
      });
      await promptRepo.save(createdPrompt);
    }
    console.log(`✅ Created ${writingPrompts.length} writing prompts`);

    // =================================================================
    // 5. CREATE CLASSES
    // =================================================================
    console.log("\n🏫 Creating classes...");
    const classRepo = AppDataSource.getRepository(Class);

    const classesData = [
      {
        teacher: teachers[0],
        name: "IELTS Speaking Band 7+",
        description: "Advanced speaking practice for students targeting Band 7 and above",
        code: "SPEAK7PLUS",
        learners: [learners[0], learners[2], learners[4], learners[6], learners[8]],
      },
      {
        teacher: teachers[0],
        name: "IELTS Writing Fundamentals",
        description: "Essential writing skills for IELTS Academic and General Training",
        code: "WRITE101",
        learners: [learners[1], learners[3], learners[5], learners[9], learners[11]],
      },
      {
        teacher: teachers[1],
        name: "Luyện thi IELTS Toàn diện",
        description: "Khóa học IELTS 4 kỹ năng cho người Việt",
        code: "IELTS4SKILL",
        learners: [learners[1], learners[3], learners[5], learners[7], learners[9], learners[11], learners[13]],
      },
      {
        teacher: teachers[2],
        name: "IELTS Express - 8 Week Program",
        description: "Intensive 8-week program for quick IELTS preparation",
        code: "EXPRESS8W",
        learners: [learners[0], learners[1], learners[2], learners[3], learners[4], learners[10], learners[12]],
      },
      {
        teacher: teachers[3],
        name: "Speaking Practice Daily",
        description: "Luyện Speaking hàng ngày cho người mới bắt đầu",
        code: "SPEAK101",
        learners: [learners[7], learners[9], learners[11], learners[13], learners[15], learners[16]],
      },
      {
        teacher: teachers[4],
        name: "Academic Writing Mastery",
        description: "Master IELTS Academic Writing Task 1 & Task 2",
        code: "ACAWRITE",
        learners: [learners[6], learners[8], learners[10], learners[12], learners[14]],
      },
      {
        teacher: teachers[5],
        name: "Demo Class - Speaking",
        description: "Demo class for testing speaking features",
        code: "DEMO-SPK",
        learners: [learners[15], learners[16], learners[17]],
      },
      {
        teacher: teachers[6],
        name: "Demo Class - Writing",
        description: "Demo class for testing writing features",
        code: "DEMO-WRT",
        learners: [learners[15], learners[16], learners[17]],
      },
    ];

    for (const classData of classesData) {
      const newClass = classRepo.create({
        teacherId: classData.teacher.id,
        name: classData.name,
        description: classData.description,
        code: classData.code,
        learners: classData.learners,
      });
      await classRepo.save(newClass);
      console.log(`✅ Class created: ${newClass.name} (${newClass.code})`);
    }

    // =================================================================
    // 6. CREATE SAMPLE ATTEMPTS (Bài làm của học sinh)
    // =================================================================
    console.log("\n📝 Creating sample attempts...");
    const attemptRepo = AppDataSource.getRepository(Attempt);
    const scoreRepo = AppDataSource.getRepository(Score);
    const feedbackRepo = AppDataSource.getRepository(Feedback);
    const scoringJobRepo = AppDataSource.getRepository(ScoringJob);

    // Lấy danh sách prompts đã tạo
    const allPrompts = await promptRepo.find();
    const speakingPromptsList = allPrompts.filter(p => p.skillType === SkillType.SPEAKING);
    const writingPromptsList = allPrompts.filter(p => p.skillType === SkillType.WRITING);

    const attempts: Attempt[] = [];
    let attemptCount = 0;
    let scoreCount = 0;
    let feedbackCount = 0;

    // Sample writing content for attempts
    const sampleWritingContents = [
      `In recent years, the reliance on technology for education and entertainment among children has increased significantly. This essay will discuss both the advantages and disadvantages of this trend.

On the positive side, technology provides children with access to a vast amount of educational resources. Online platforms offer interactive learning experiences that can make education more engaging and personalized. Moreover, educational apps and games can help children develop problem-solving skills and creativity in ways that traditional methods might not achieve.

However, there are notable concerns about excessive technology use. Prolonged screen time can lead to health issues such as eye strain, obesity, and sleep disturbances. Furthermore, children may become socially isolated if they spend more time interacting with devices than with peers. The exposure to inappropriate content online is another significant risk that parents must carefully monitor.

In conclusion, while technology offers valuable educational benefits, its use must be balanced and supervised to prevent potential negative effects on children's health and social development. Parents and educators should work together to establish healthy technology habits.`,

      `The question of whether universities should be free is a complex one that divides opinion. While some argue that free education is a fundamental right, others believe that students should contribute to the cost of their studies.

Proponents of free university education argue that it promotes equality of opportunity. When education is free, students from all economic backgrounds can pursue higher education without the burden of debt. This can lead to a more educated workforce and ultimately benefit the economy as a whole.

On the other hand, opponents argue that free education places an unsustainable burden on taxpayers. Universities require significant funding for facilities, research, and staff, and without tuition fees, this cost falls entirely on the public purse. Additionally, when students pay for their education, they may be more motivated to complete their studies and make the most of the opportunity.

In my opinion, a balanced approach is best. While some form of government support is essential to ensure access for all, students who can afford to contribute should do so. This could take the form of income-contingent loans that are repayable only after graduation and above a certain income threshold.`,

      `Climate change is undoubtedly one of the most pressing issues of our time, yet political action to address it remains insufficient. I strongly agree that there is not enough being done to control excessive consumerism and pollution.

Firstly, many governments prioritize economic growth over environmental protection. Industries that contribute significantly to pollution, such as fossil fuels and manufacturing, often have powerful lobbying influence. This results in policies that favor short-term economic gains rather than long-term environmental sustainability.

Secondly, consumer culture continues to drive demand for products that are harmful to the environment. Fast fashion, single-use plastics, and disposable electronics all contribute to pollution and resource depletion. Despite growing awareness, many consumers are reluctant to change their habits without stronger incentives or regulations.

However, there are signs of progress. The Paris Agreement represents a global commitment to reducing emissions, and many countries are investing in renewable energy. Consumer movements for sustainability are also growing, putting pressure on businesses to adopt greener practices.

In conclusion, while some progress has been made, much more needs to be done. Governments must take bolder action to regulate polluting industries and incentivize sustainable consumption. Only through concerted political effort can we hope to address the climate crisis effectively.`,

      `The chart illustrates the percentage of students who successfully passed their high school examinations across various subjects in two different years: 2020 and 2023.

Overall, it is evident that pass rates improved in most subjects over the three-year period, with Mathematics and Sciences showing the most significant gains. However, performance in Arts subjects showed a slight decline.

Looking at the details, Mathematics had the lowest pass rate in 2020 at approximately 62%, but this increased dramatically to 78% by 2023, representing a 16 percentage point improvement. Similarly, Science subjects saw pass rates rise from 68% to 82% over the same period.

In contrast, English language pass rates remained relatively stable, showing only a marginal increase from 75% to 77%. The Arts subjects, which had the highest pass rate in 2020 at 80%, actually declined slightly to 78% in 2023.

In summary, the data suggests that educational initiatives during this period were particularly effective in improving student performance in Mathematics and Sciences, while Arts education may require additional attention.`,
    ];

    // Tạo attempts cho mỗi learner
    for (let learnerIndex = 0; learnerIndex < learners.length; learnerIndex++) {
      const learner = learners[learnerIndex];
      
      // Mỗi learner có 2-4 writing attempts
      const numWritingAttempts = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numWritingAttempts && i < writingPromptsList.length; i++) {
        const prompt = writingPromptsList[i % writingPromptsList.length];
        const writingContent = sampleWritingContents[i % sampleWritingContents.length];
        const wordCount = writingContent.split(/\s+/).length;
        
        // Random status - mostly scored
        const statusOptions = [AttemptStatus.SCORED, AttemptStatus.SCORED, AttemptStatus.SCORED, AttemptStatus.EVALUATED_BY_TEACHER, AttemptStatus.SUBMITTED];
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        const attempt = attemptRepo.create({
          learnerId: learner.id,
          promptId: prompt.id,
          skillType: SkillType.WRITING,
          status: status,
          writingContent: writingContent,
          wordCount: wordCount,
          startedAt: createdAt,
          submittedAt: status !== AttemptStatus.IN_PROGRESS ? new Date(createdAt.getTime() + 30 * 60 * 1000) : undefined,
          scoredAt: status === AttemptStatus.SCORED || status === AttemptStatus.EVALUATED_BY_TEACHER ? new Date(createdAt.getTime() + 35 * 60 * 1000) : undefined,
        });
        
        await attemptRepo.save(attempt);
        attempts.push(attempt);
        attemptCount++;
        
        // Tạo Score cho những attempts đã scored
        if (status === AttemptStatus.SCORED || status === AttemptStatus.EVALUATED_BY_TEACHER) {
          const overallBand = 5 + Math.floor(Math.random() * 8) * 0.5; // 5.0 - 8.5
          const score = scoreRepo.create({
            attemptId: attempt.id,
            skillType: SkillType.WRITING,
            overallBand: overallBand,
            taskAchievement: overallBand + (Math.random() - 0.5),
            coherenceCohesion: overallBand + (Math.random() - 0.5),
            lexicalResource: overallBand + (Math.random() - 0.5),
            grammaticalRange: overallBand + (Math.random() - 0.5),
            confidence: 0.75 + Math.random() * 0.2,
            feedback: `Your essay demonstrates a ${overallBand >= 7 ? 'good' : 'developing'} understanding of the topic. ${overallBand >= 7 ? 'You have addressed the task well with clear arguments.' : 'Consider developing your arguments more fully.'}`,
            detailedFeedback: {
              strengths: [
                "Clear introduction and conclusion",
                "Good use of linking words",
                "Relevant examples provided"
              ],
              areasForImprovement: [
                "Develop ideas more fully in body paragraphs",
                "Vary sentence structures more",
                "Use more academic vocabulary"
              ],
              suggestions: [
                "Practice writing complex sentences",
                "Read academic texts to expand vocabulary",
                "Review task response criteria"
              ]
            }
          });
          await scoreRepo.save(score);
          scoreCount++;
          
          // Tạo Feedback từ teacher cho một số attempts
          if (status === AttemptStatus.EVALUATED_BY_TEACHER || Math.random() > 0.6) {
            const teacher = teachers[Math.floor(Math.random() * teachers.length)];
            const feedback = feedbackRepo.create({
              attemptId: attempt.id,
              authorId: teacher.id,
              type: FeedbackType.TEACHER_COMMENT,
              content: `Good effort on this essay! ${overallBand >= 7 ? 'You have shown strong writing skills.' : 'Keep practicing to improve your writing.'} Focus on ${['vocabulary development', 'grammar accuracy', 'coherence', 'task achievement'][Math.floor(Math.random() * 4)]} for your next attempt.`,
              visibility: FeedbackVisibility.TEACHER_AND_LEARNER,
            });
            await feedbackRepo.save(feedback);
            feedbackCount++;
          }
        }
        
        // Tạo ScoringJob cho submitted attempts
        if (status === AttemptStatus.SUBMITTED) {
          const scoringJob = scoringJobRepo.create({
            attemptId: attempt.id,
            status: ScoringJobStatus.QUEUED,
          });
          await scoringJobRepo.save(scoringJob);
        }
      }
      
      // Mỗi learner có 1-3 speaking attempts (chỉ có status, không có audio thực)
      const numSpeakingAttempts = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numSpeakingAttempts && i < speakingPromptsList.length; i++) {
        const prompt = speakingPromptsList[i % speakingPromptsList.length];
        
        const statusOptions = [AttemptStatus.SCORED, AttemptStatus.SCORED, AttemptStatus.SUBMITTED, AttemptStatus.IN_PROGRESS];
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        
        const attempt = attemptRepo.create({
          learnerId: learner.id,
          promptId: prompt.id,
          skillType: SkillType.SPEAKING,
          status: status,
          startedAt: createdAt,
          submittedAt: status !== AttemptStatus.IN_PROGRESS ? new Date(createdAt.getTime() + 5 * 60 * 1000) : undefined,
          scoredAt: status === AttemptStatus.SCORED ? new Date(createdAt.getTime() + 10 * 60 * 1000) : undefined,
        });
        
        await attemptRepo.save(attempt);
        attempts.push(attempt);
        attemptCount++;
        
        // Tạo Score cho speaking attempts đã scored
        if (status === AttemptStatus.SCORED) {
          const overallBand = 5 + Math.floor(Math.random() * 8) * 0.5;
          const score = scoreRepo.create({
            attemptId: attempt.id,
            skillType: SkillType.SPEAKING,
            overallBand: overallBand,
            fluencyCoherence: overallBand + (Math.random() - 0.5),
            pronunciation: overallBand + (Math.random() - 0.5),
            lexicalResource: overallBand + (Math.random() - 0.5),
            grammaticalRange: overallBand + (Math.random() - 0.5),
            confidence: 0.7 + Math.random() * 0.25,
            feedback: `Your speaking performance shows ${overallBand >= 7 ? 'good fluency and coherence' : 'developing fluency'}. ${overallBand >= 7 ? 'You speak with natural rhythm and clear pronunciation.' : 'Focus on speaking more naturally and clearly.'}`,
            detailedFeedback: {
              strengths: [
                "Clear pronunciation of most words",
                "Good use of discourse markers",
                "Relevant responses to questions"
              ],
              areasForImprovement: [
                "Work on natural intonation patterns",
                "Expand vocabulary range",
                "Practice speaking at a more consistent pace"
              ],
              suggestions: [
                "Listen to native speakers and mimic their rhythm",
                "Record yourself and analyze your speech",
                "Practice with a speaking partner regularly"
              ]
            }
          });
          await scoreRepo.save(score);
          scoreCount++;
        }
      }
    }
    
    console.log(`✅ Created ${attemptCount} attempts`);
    console.log(`✅ Created ${scoreCount} scores`);
    console.log(`✅ Created ${feedbackCount} feedbacks`);

    // =================================================================
    // SUMMARY
    // =================================================================
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log(`   👥 Users: 1 Admin + ${teachers.length} Teachers + ${learners.length} Learners`);
    console.log(`   📚 Topics: ${topics.length}`);
    console.log(`   💬 Speaking Prompts: ${speakingPrompts.length}`);
    console.log(`   ✍️  Writing Prompts: ${writingPrompts.length}`);
    console.log(`   🏫 Classes: ${classesData.length}`);
    console.log(`   📝 Attempts: ${attemptCount}`);
    console.log(`   🎯 Scores: ${scoreCount}`);
    console.log(`   💬 Feedbacks: ${feedbackCount}`);
    console.log("\n🔑 Default Password for all users: Password123!");
    console.log("\n📧 Sample Login Credentials:");
    console.log("   Admin:   admin@lingolab.com / Password123!");
    console.log("   Teacher: teacher.john@lingolab.com / Password123!");
    console.log("   Teacher: teacher1@lingolab.com / Password123!");
    console.log("   Learner: learner.alice@example.com / Password123!");
    console.log("   Learner: student1@lingolab.com / Password123!");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("\n✅ Database connection closed");
    }
  }
}

// Run the seeder
seedDatabase()
  .then(() => {
    console.log("✅ Seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding process failed:", error);
    process.exit(1);
  });
