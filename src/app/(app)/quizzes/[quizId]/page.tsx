'use client';

import { useEffect, useState } from 'react';
import {
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import {
  doc,
  collection,
  writeBatch,
  DocumentReference,
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
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  ref: DocumentReference;
}

interface Question {
  id: string;
  text: string;
  correctAnswerId?: string;
  ref: DocumentReference; 
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
    () => (firestore ? doc(firestore, `classSections/IS-B/quizzes/${params.quizId}`) : null),
    [firestore, params.quizId]
  );
  const questionsRef = useMemoFirebase(
    () => (quizRef ? collection(quizRef, 'questions') : null),
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
      {userType === 'teacher' ? (
        <EditableQuizHeader quiz={quiz} quizRef={quizRef} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline">
              {quiz.name}
            </CardTitle>
            <CardDescription>{quiz.description}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {userType === 'teacher' ? (
        <TeacherView questions={questions} questionsRef={questionsRef} />
      ) : (
        <StudentView questions={questions} />
      )}
    </div>
  );
}


function EditableQuizHeader({ quiz, quizRef }: { quiz: Quiz, quizRef: any }) {
    const [name, setName] = useState(quiz.name);
    const [description, setDescription] = useState(quiz.description);

    const handleSave = () => {
        if (!quizRef) return;
        if (name !== quiz.name || description !== quiz.description) {
            updateDocumentNonBlocking(quizRef, { name, description });
        }
    }

    return (
         <Card>
            <CardHeader className="space-y-4">
               <div>
                 <Label htmlFor="quiz-title" className="text-sm font-medium">Quiz Title</Label>
                 <Input 
                    id="quiz-title"
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleSave}
                    className="text-3xl font-bold font-headline h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
               </div>
               <div>
                <Label htmlFor="quiz-description" className="text-sm font-medium">Description</Label>
                 <Textarea
                    id="quiz-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleSave}
                    className="border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground"
                />
               </div>
            </CardHeader>
        </Card>
    )
}

// --- Teacher View ---
function TeacherView({ questions, questionsRef }: any) {
  const handleAddQuestion = () => {
    if (!questionsRef) return;
    addDocumentNonBlocking(questionsRef, { text: 'New Question', correctAnswerId: null });
  };

  return (
    <div className="space-y-6">
      {questions?.map((q: Question, index: number) => (
        <EditableQuestion key={q.id} question={q} index={index} />
      ))}
      <Button onClick={handleAddQuestion} variant="outline" disabled={!questionsRef}>
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
    () => (firestore && question.ref ? doc(firestore, question.ref.path) : null),
    [firestore, question]
  );
  
  const answersRef = useMemoFirebase(
    () => (questionDocRef ? collection(questionDocRef, 'answers') : null),
    [questionDocRef]
  );

  const { data: answers, isLoading: areAnswersLoading } =
    useCollection<Answer>(answersRef);

  const handleQuestionSave = () => {
    if (questionDocRef && questionText !== question.text) {
      updateDocumentNonBlocking(questionDocRef, { text: questionText });
    }
  };

  const handleQuestionDelete = () => {
    if (questionDocRef) {
      deleteDocumentNonBlocking(questionDocRef);
    }
  };

  const handleAddAnswer = () => {
    if (answersRef) {
      addDocumentNonBlocking(answersRef, { text: 'New Answer', isCorrect: false });
    }
  };

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
            disabled={!questionDocRef}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleQuestionDelete}
            aria-label="Delete question"
            disabled={!questionDocRef}
          >
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pl-12">
       {areAnswersLoading ? (
           <Loader2 className="animate-spin" />
       ) : (
          answers?.map(answer => (
            <EditableAnswer
              key={answer.id}
              answer={answer}
              answers={answers}
              questionDocRef={questionDocRef}
            />
          ))
       )}
        {(!answers || answers.length < 5) && (
            <Button onClick={handleAddAnswer} variant="ghost" size="sm" disabled={!answersRef}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Answer
            </Button>
        )}
      </CardContent>
    </Card>
  );
}

function EditableAnswer({
  answer,
  answers,
  questionDocRef,
}: {
  answer: Answer;
  answers: Answer[];
  questionDocRef: DocumentReference | null;
}) {
  const [answerText, setAnswerText] = useState(answer.text);
  const firestore = useFirestore();

   const answerDocRef = useMemoFirebase(
    () => (firestore && questionDocRef ? doc(firestore, `${questionDocRef.path}/answers/${answer.id}`) : null),
    [firestore, questionDocRef, answer.id]
  );
  
  const handleAnswerSave = () => {
    if (answerDocRef && answerText !== answer.text) {
      updateDocumentNonBlocking(answerDocRef, { text: answerText });
    }
  };

  const handleSetCorrect = async () => {
     if (!questionDocRef || !firestore || !answers || !answerDocRef) return;

      const batch = writeBatch(firestore);
      
      // Set the new correct answer
      batch.update(answerDocRef, { isCorrect: true });
      batch.update(questionDocRef, { correctAnswerId: answer.id });

      // Unset all other answers
      answers.forEach(ans => {
        if (ans.id !== answer.id && ans.isCorrect) {
           const otherAnswerRef = doc(firestore, `${questionDocRef.path}/answers/${ans.id}`);
           batch.update(otherAnswerRef, { isCorrect: false });
        }
      });
      
      await batch.commit().catch(e => console.error("Failed to set correct answer", e));
  };

  const handleDeleteAnswer = () => {
    if (answerDocRef) {
      deleteDocumentNonBlocking(answerDocRef);
    }
  };
  
  const isCorrectAnswer = questionDocRef && (questionDocRef.parent.parent?.id === answer.id);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={answer.isCorrect ? 'default' : 'outline'}
        size="icon"
        onClick={handleSetCorrect}
        disabled={!answerDocRef || !questionDocRef}
        aria-label="Set as correct answer"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Input
        value={answerText}
        onChange={e => setAnswerText(e.target.value)}
        onBlur={handleAnswerSave}
        disabled={!answerDocRef}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDeleteAnswer}
        aria-label="Delete answer"
        disabled={!answerDocRef}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

// --- Student View ---
function StudentView({ questions }: { questions: Question[] | null }) {
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
    questions?.forEach((q: Question) => {
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
          <Button onClick={handleSubmit} disabled={!questions || Object.keys(selectedAnswers).length !== questions.length}>Submit Quiz</Button>
        ) : (
          <div className="text-xl font-bold">
            Your Score: {score} / {questions?.length}
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
    () => (firestore && question.ref ? collection(firestore, `${question.ref.path}/answers`) : null),
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
                  className={`flex items-center space-x-3 rounded-md border p-3 transition-colors ${
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
