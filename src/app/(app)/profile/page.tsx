'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Medal, Rocket, ShieldCheck, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

const mockAchievements = [
  {
    id: 'a1',
    name: 'First Quiz',
    description: 'Completed your first quiz.',
    Icon: Rocket,
    unlocked: true,
  },
  {
    id: 'a2',
    name: 'Physics Novice',
    description: 'Completed 3 Physics quizzes.',
    Icon: Medal,
    unlocked: true,
  },
  {
    id: 'a3',
    name: 'Perfect Score',
    description: 'Got a 100% on any quiz.',
    Icon: Target,
    unlocked: true,
  },
  {
    id: 'a4',
    name: 'Chemistry Whiz',
    description: 'Score above 90% in a Chemistry quiz.',
    Icon: ShieldCheck,
    unlocked: true,
  },
  {
    id: 'a5',
    name: 'Biology Buff',
    description: 'Complete all Biology quizzes.',
    Icon: Medal,
    unlocked: false,
  },
  {
    id: 'a6',
    name: 'Math Magician',
    description: 'Get a perfect score in Math.',
    Icon: Target,
    unlocked: false,
  },
];

interface StudentQuizResult {
    id: string;
    quizId: string;
    score: number;
    totalQuestions: number;
    submissionDateTime: {
        seconds: number;
        nanoseconds: number;
    };
}

export default function ProfilePage() {
  const [userName, setUserName] = useState('');
  const { user } = useUser();
  const firestore = useFirestore();

  const resultsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'users', user.uid, 'studentQuizResults'),
        orderBy('submissionDateTime', 'desc')
    );
  }, [firestore, user]);

  const { data: quizHistory, isLoading } = useCollection<StudentQuizResult>(resultsQuery);


  useEffect(() => {
    setUserName(localStorage.getItem('userName') || 'Student');
  }, []);

  const totalQuizzes = quizHistory?.length || 0;
  
  const totalCorrect = quizHistory?.reduce((acc, q) => acc + q.score, 0) || 0;

  const totalPossible = quizHistory?.reduce((acc, q) => acc + q.totalQuestions, 0) || 0;
  
  const averageScore =
    totalPossible > 0
      ? ((totalCorrect / totalPossible) * 100).toFixed(0)
      : 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage
              src={`https://picsum.photos/seed/${userName}/100/100`}
            />
            <AvatarFallback className="text-3xl">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline">{userName}</CardTitle>
            <CardDescription>Your learning journey and achievements.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
            <Separator className="my-4" />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-3xl font-bold">{totalQuizzes}</p>
                    <p className="text-sm text-muted-foreground">Quizzes Completed</p>
                </div>
                 <div>
                    <p className="text-3xl font-bold">{totalCorrect}</p>
                    <p className="text-sm text-muted-foreground">Correct Answers</p>
                </div>
                 <div>
                    <p className="text-3xl font-bold">{averageScore}%</p>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
             </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Achievements</CardTitle>
          <CardDescription>
            Badges you've earned on your learning adventure. (Coming soon!)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockAchievements.map(ach => (
            <div
              key={ach.id}
              className={`flex flex-col items-center text-center p-4 rounded-lg border transition-opacity ${
                ach.unlocked ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <ach.Icon className={`h-12 w-12 mb-2 ${ach.unlocked ? 'text-primary' : 'text-muted-foreground'}`}/>
              <p className="font-semibold text-sm">{ach.name}</p>
              <p className="text-xs text-muted-foreground">{ach.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Quiz History</CardTitle>
          <CardDescription>A log of your recent assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz ID</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={3} className="text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                </TableRow>
              ) : quizHistory && quizHistory.length > 0 ? (
                  quizHistory.map(quiz => (
                    <TableRow key={quiz.id}>
                      <TableCell className="font-medium truncate max-w-[120px]">{quiz.quizId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{quiz.score} / {quiz.totalQuestions}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {format(new Date(quiz.submissionDateTime.seconds * 1000), 'yyyy-MM-dd')}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center">No quiz history yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
