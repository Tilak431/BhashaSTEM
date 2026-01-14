'use client';

import { useEffect, useState } from 'react';
import {
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  doc,
  collection,
  updateDoc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Trash2,
  PlusCircle,
  Save,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { updateDocumentNonBlocking } from '@/firebase';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  correctAnswerId?: string;
}

interface Quiz {
  id: string;
  name: string;
  description: string;
}

export default function QuizPage({ params }: { params: { quizId: string } }) {
  const firestore = useFirestore();
  const [userType, setUserType] = useState<'student' | 'teacher' | null>(null);
  const [loading, setLoading] = useState(true);

  // Firestore references
  const quizRef = useMemoFirebase(
    () => doc(firestore, `classSections/IS-B/quizzes/${params.quizId}`),
    [firestore, params.quizId]
  );
  const questionsRef = useMemoFirebase(
    () => collection(quizRef, 'questions'),
    [quizRef]
  );

  // Data fetching
  const { data: quiz, isLoading: isQuizLoading } = useDoc<Quiz>(quizRef);
  const { data: questions, isLoading: areQuestionsLoading } =
    useCollection<Question>(questionsRef);

  useEffect(() => {
    const type = localStorage.getItem('userType') as
      | 'student'
      | 'teacher'
      | null;
    setUserType(type);
    setLoading(false);
  }, []);

  if (isQuizLoading || areQuestionsLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return <div>Quiz not found.</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">
            {quiz.name}
          </CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
        </CardHeader>
      </Card>

      {userType === 'teacher' ? (
        <TeacherView questions={questions} questionsRef={questionsRef} />
      ) : (
        <StudentView questions={questions} questionsRef={questionsRef} />
      )}
    </div>
  );
}

// --- Teacher View ---
function TeacherView({ questions, questionsRef }: any) {
  const handleAddQuestion = async () => {
    await addDoc(questionsRef, { text: 'New Question' });
  };

  return (
    <div className="space-y-6">
      {questions?.map((q: Question, index: number) => (
        <EditableQuestion key={q.id} question={q} index={index} />
      ))}
      <Button onClick={handleAddQuestion} variant="outline">
        <PlusCircle className="mr-2" /> Add Question
      </Button>
    </div>
  );
}

function EditableQuestion({
  question,
  index,
}: {
  question: Question;
  index: number;
}) {
  const firestore = useFirestore();
  const [questionText, setQuestionText] = useState(question.text);

  const questionDocRef = useMemoFirebase(
    () => doc(firestore, `${question.ref.path}`),
    [firestore, question]
  );
  const answersRef = useMemoFirebase(
    () => collection(questionDocRef, 'answers'),
    [questionDocRef]
  );
  const { data: answers, isLoading: areAnswersLoading } =
    useCollection<Answer>(answersRef);

  const handleQuestionSave = async () => {
    if (questionText !== question.text) {
      updateDocumentNonBlocking(questionDocRef, { text: questionText });
    }
  };

  const handleQuestionDelete = async () => {
    await deleteDoc(questionDocRef);
  };

  const handleAddAnswer = async () => {
    await addDoc(answersRef, { text: 'New Answer', isCorrect: false });
  };

  if (areAnswersLoading) return <Loader2 className="animate-spin" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Label
            htmlFor={`q-${question.id}`}
            className="text-lg font-semibold"
          >
            Question {index + 1}
          </Label>
          <Input
            id={`q-${question.id}`}
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            onBlur={handleQuestionSave}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleQuestionDelete}
            aria-label="Delete question"
          >
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pl-12">
        {answers?.map(answer => (
          <EditableAnswer
            key={answer.id}
            answer={answer}
            questionDocRef={questionDocRef}
          />
        ))}
        <Button onClick={handleAddAnswer} variant="ghost" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Answer
        </Button>
      </CardContent>
    </Card>
  );
}

function EditableAnswer({
  answer,
  questionDocRef,
}: {
  answer: Answer;
  questionDocRef: any;
}) {
  const [answerText, setAnswerText] = useState(answer.text);
  const answerDocRef = doc(questionDocRef, 'answers', answer.id);

  const handleAnswerSave = async () => {
    if (answerText !== answer.text) {
      updateDocumentNonBlocking(answerDocRef, { text: answerText });
    }
  };

  const handleSetCorrect = async () => {
    // This is a simplified approach. A real app should use a transaction
    // to ensure only one answer is marked as correct.
    updateDocumentNonBlocking(questionDocRef, { correctAnswerId: answer.id });
    updateDocumentNonBlocking(answerDocRef, { isCorrect: true });
  };

  const handleDeleteAnswer = async () => {
    await deleteDoc(answerDocRef);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={answer.isCorrect ? 'default' : 'outline'}
        size="icon"
        onClick={handleSetCorrect}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Input
        value={answerText}
        onChange={e => setAnswerText(e.target.value)}
        onBlur={handleAnswerSave}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDeleteAnswer}
        aria-label="Delete answer"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

// --- Student View ---
function StudentView({ questions, questionsRef }: any) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerChange = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = () => {
    let newScore = 0;
    questions.forEach((q: Question) => {
      if (selectedAnswers[q.id] === q.correctAnswerId) {
        newScore++;
      }
    });
    setScore(newScore);
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {questions?.map((q: Question, index: number) => (
        <QuestionDisplay
          key={q.id}
          question={q}
          index={index}
          selectedAnswer={selectedAnswers[q.id]}
          onAnswerChange={handleAnswerChange}
          submitted={submitted}
        />
      ))}
      <CardFooter className="justify-end p-0 pt-4">
        {!submitted ? (
          <Button onClick={handleSubmit}>Submit Quiz</Button>
        ) : (
          <div className="text-xl font-bold">
            Your Score: {score} / {questions.length}
          </div>
        )}
      </CardFooter>
    </div>
  );
}

function QuestionDisplay({
  question,
  index,
  selectedAnswer,
  onAnswerChange,
  submitted,
}: {
  question: Question;
  index: number;
  selectedAnswer: string;
  onAnswerChange: (questionId: string, answerId: string) => void;
  submitted: boolean;
}) {
  const firestore = useFirestore();
  const answersRef = useMemoFirebase(
    () => collection(firestore, `${question.ref.path}/answers`),
    [firestore, question]
  );
  const { data: answers, isLoading: areAnswersLoading } =
    useCollection<Answer>(answersRef);

  const isCorrect = selectedAnswer === question.correctAnswerId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Question {index + 1}: {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {areAnswersLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <RadioGroup
            value={selectedAnswer}
            onValueChange={value => onAnswerChange(question.id, value)}
            disabled={submitted}
            className="space-y-2"
          >
            {answers?.map(answer => {
              const isSelected = selectedAnswer === answer.id;
              const showResult = submitted && isSelected;
              const isTheCorrectAnswer = answer.id === question.correctAnswerId;

              return (
                <div
                  key={answer.id}
                  className={`flex items-center space-x-3 rounded-md border p-3 ${
                    submitted && isTheCorrectAnswer ? 'border-green-500 bg-green-100 dark:bg-green-900' : ''
                  } ${
                    showResult && !isTheCorrectAnswer ? 'border-red-500 bg-red-100 dark:bg-red-900' : ''
                  }`}
                >
                  <RadioGroupItem value={answer.id} id={answer.id} />
                  <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                    {answer.text}
                  </Label>
                  {showResult && (isCorrect ? <Check className="text-green-600"/> : <X className="text-red-600"/>)}
                </div>
              );
            })}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
