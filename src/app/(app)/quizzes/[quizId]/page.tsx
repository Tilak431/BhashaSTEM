
'use client';

import { useEffect, useState, useMemo, use } from 'react';
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
  Query,
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
  Save,
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

function QuizClientView({ quizId }: { quizId: string }) {
  const firestore = useFirestore();
  const [userType, setUserType] = useState<'student' | 'teacher' | null>(null);
  const [loading, setLoading] = useState(true);

  const quizRef = useMemoFirebase(
    () => (firestore ? doc(firestore, `classSections/IS-B/quizzes/${quizId}`) : null),
    [firestore, quizId]
  );
  const questionsRef = useMemoFirebase(
    () => (quizRef ? collection(quizRef, 'questions') : null),
    [quizRef]
  );

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
        <TeacherView questions={questions || []} questionsRef={questionsRef} />
      ) : (
        <StudentView questions={questions} />
      )}
    </div>
  );
}



function EditableQuizHeader({ quiz, quizRef }: { quiz: Quiz, quizRef: DocumentReference | null }) {
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
                    disabled={!quizRef}
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
                    disabled={!quizRef}
                    className="border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground"
                />
               </div>
            </CardHeader>
        </Card>
    )
}

// --- Teacher View ---
function TeacherView({ questions, questionsRef }: { questions: Question[], questionsRef: Query | null }) {
  const handleAddQuestion = () => {
    if (!questionsRef) return;
    addDocumentNonBlocking(questionsRef, { text: 'New Question', correctAnswerId: null });
  };

  return (
    <div className="space-y-6">
      {questions.map((q: Question, index: number) => (
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
    () => (firestore ? doc(firestore, question.ref.path) : null),
    [firestore, question.ref.path]
  );
  
  const answersRef = useMemoFirebase(
    () => (questionDocRef ? collection(questionDocRef, 'answers') : null),
    [questionDocRef]
  );

  const { data: answersData, isLoading: areAnswersLoading } = useCollection<Answer>(answersRef);

  const [localAnswers, setLocalAnswers] = useState<(Omit<Answer, 'ref'> & {ref?: DocumentReference})[]>([]);

  useEffect(() => {
    if (answersData) {
      setLocalAnswers(answersData);
    }
  }, [answersData]);
  
  const [isSaving, setIsSaving] = useState(false);

  const originalAnswersJSON = useMemo(() => JSON.stringify(answersData?.map(({ ref, ...rest }) => rest) || []), [answersData]);
  
  const hasChanges = useMemo(() => {
    if (!answersData) return false; // Don't allow saving if original answers haven't loaded
    const currentAnswersJSON = JSON.stringify(localAnswers.map(({ ref, ...rest }) => rest));
    return question.text !== questionText || originalAnswersJSON !== currentAnswersJSON;
  }, [question.text, questionText, originalAnswersJSON, localAnswers, answersData]);


  const handleQuestionSave = async () => {
    if (!questionDocRef || !firestore || !answersData) return;
    setIsSaving(true);
    
    const batch = writeBatch(firestore);
    
    if (question.text !== questionText) {
        batch.update(questionDocRef, { text: questionText });
    }

    localAnswers.forEach(localAns => {
      const originalAns = answersData.find(a => a.id === localAns.id);
      if (originalAns && originalAns.text !== localAns.text) {
        const answerDocRef = doc(firestore, `${questionDocRef.path}/answers/${localAns.id}`);
        batch.update(answerDocRef, { text: localAns.text });
      }
    });
    
    try {
        await batch.commit();
    } catch (e) {
        console.error("Failed to save question", e);
    } finally {
        setIsSaving(false);
    }
  };

  const handleQuestionDelete = () => {
    if (questionDocRef) {
      // Also delete subcollection
      answersData?.forEach(ans => {
        const answerDocRef = doc(firestore, `${questionDocRef.path}/answers/${ans.id}`);
        deleteDocumentNonBlocking(answerDocRef);
      })
      deleteDocumentNonBlocking(questionDocRef);
    }
  };

  const handleAddAnswer = () => {
    if (answersRef) {
      addDocumentNonBlocking(answersRef, { text: 'New Answer', isCorrect: false });
    }
  };

  const handleAnswerTextChange = (answerId: string, newText: string) => {
    setLocalAnswers(prev => prev.map(ans => ans.id === answerId ? { ...ans, text: newText } : ans));
  }


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
          (localAnswers || []).map(answer => (
            <EditableAnswer
              key={answer.id}
              answer={answer}
              answersData={answersData || []}
              question={question}
              questionDocRef={questionDocRef}
              onTextChange={handleAnswerTextChange}
            />
          ))
       )}
        {(!answersData || answersData.length < 5) && (
            <Button onClick={handleAddAnswer} variant="ghost" size="sm" disabled={!answersRef}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Answer
            </Button>
        )}
      </CardContent>
      <CardFooter className='justify-end'>
          <Button onClick={handleQuestionSave} disabled={isSaving || !hasChanges}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Question
          </Button>
      </CardFooter>
    </Card>
  );
}

function EditableAnswer({
  answer,
  answersData,
  question,
  questionDocRef,
  onTextChange
}: {
  answer: Omit<Answer, 'ref'> & {ref?: DocumentReference};
  answersData: Answer[];
  question: Question;
  questionDocRef: DocumentReference | null;
  onTextChange: (answerId: string, newText: string) => void;
}) {
  const firestore = useFirestore();

  const answerDocRef = useMemoFirebase(
    () => (firestore && questionDocRef ? doc(firestore, `${questionDocRef.path}/answers/${answer.id}`) : null),
    [firestore, questionDocRef, answer.id]
  );
  
  const handleSetCorrect = async () => {
     if (!questionDocRef || !firestore || !answersData || !answerDocRef) return;

      const batch = writeBatch(firestore);
      
      batch.update(questionDocRef, { correctAnswerId: answer.id });

      answersData.forEach(ans => {
        const otherAnswerRef = doc(firestore, `${questionDocRef.path}/answers/${ans.id}`);
        if (ans.id === answer.id) {
           if(!ans.isCorrect) batch.update(otherAnswerRef, { isCorrect: true });
        } else if (ans.isCorrect) {
           batch.update(otherAnswerRef, { isCorrect: false });
        }
      });
      
      try {
        await batch.commit();
      } catch(e) {
        console.error("Failed to set correct answer", e);
      }
  };

  const handleDeleteAnswer = () => {
    if (answerDocRef) {
      if (question.correctAnswerId === answer.id && questionDocRef) {
        updateDocumentNonBlocking(questionDocRef, { correctAnswerId: null });
      }
      deleteDocumentNonBlocking(answerDocRef);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={question.correctAnswerId === answer.id ? 'default' : 'outline'}
        size="icon"
        onClick={handleSetCorrect}
        disabled={!answerDocRef || !questionDocRef}
        aria-label="Set as correct answer"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Input
        value={answer.text}
        onChange={e => onTextChange(answer.id, e.target.value)}
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
function StudentView({ questions }: { questions: (Question & {ref: DocumentReference})[] | null }) {
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
      {questions?.map((q, index: number) => (
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
  question: Question & {ref: DocumentReference};
  index: number;
  selectedAnswer: string;
  onAnswerChange: (questionId: string, answerId: string) => void;
  submitted: boolean;
}) {
  const firestore = useFirestore();
  const answersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, `${question.ref.path}/answers`) : null),
    [firestore, question.ref.path]
  );
  const { data: answers, isLoading: areAnswersLoading } =
    useCollection<Answer>(answersRef);

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
              const isCorrectAnswer = answer.id === question.correctAnswerId;

              let ringColor = 'ring-transparent';
              if (submitted) {
                if (isCorrectAnswer) {
                  ringColor = 'ring-green-500';
                } else if (isSelected && !isCorrectAnswer) {
                  ringColor = 'ring-red-500';
                }
              }
              
              return (
                <div key={answer.id} className={`flex items-center space-x-3 rounded-md border p-3 transition-all ring-2 ${ringColor}`}>
                  <RadioGroupItem value={answer.id} id={answer.id} />
                  <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                    {answer.text}
                  </Label>
                   {submitted && isSelected && !isCorrectAnswer && <X className="text-red-600"/>}
                   {submitted && isCorrectAnswer && <Check className="text-green-600"/>}
                </div>
              );
            })}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}


export default function QuizPage({ params }: { params: { quizId: string } }) {
  const resolvedParams = use(Promise.resolve(params));
  return <QuizClientView quizId={resolvedParams.quizId} />;
}
