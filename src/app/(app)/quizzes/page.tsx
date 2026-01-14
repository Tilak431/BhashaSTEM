"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BiologyIcon,
  ChemistryIcon,
  MathIcon,
  PhysicsIcon,
} from "@/components/common/SubjectIcons";
import type { Subject } from "@/lib/data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

const subjectIconMap: Record<Subject, React.ElementType> = {
  Physics: PhysicsIcon,
  Chemistry: ChemistryIcon,
  Biology: BiologyIcon,
  Math: MathIcon,
};

interface Quiz {
  id: string;
  name: string;
  description: string;
  subject: Subject;
  questionCount: number;
}

export default function QuizzesPage() {
  const firestore = useFirestore();
  const quizzesQuery = query(
    collection(firestore, "classSections/IS-B/quizzes")
  );
  const { data: quizzes, isLoading } = useCollection<Quiz>(quizzesQuery);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Assessments
        </h2>
        <p className="text-muted-foreground">
          Test your knowledge and find where you can improve.
        </p>
      </div>
      {isLoading && <p>Loading quizzes...</p>}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizzes?.map((quiz) => {
          const Icon = subjectIconMap[quiz.subject];
          return (
            <Card
              key={quiz.id}
              className="flex flex-col hover:shadow-lg transition-shadow duration-300"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-headline">
                    {quiz.name}
                  </CardTitle>
                  {Icon && <Icon className="h-7 w-7 text-primary" />}
                </div>
                <CardDescription>
                  A {quiz.subject} quiz with {quiz.questionCount || 0} questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <p>{quiz.description}</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/quizzes/${quiz.id}`}>Start Quiz</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
