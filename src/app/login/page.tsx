'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

// In a real app, these would be stored securely and fetched from a server
const TEACHER_KEY = 'teacher-secret-key';
const STUDENT_KEY = 'student-access-key';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [name, setName] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!name.trim() || !accessKey.trim()) {
      setError('Please enter your name and access key.');
      return;
    }

    let userType: 'teacher' | 'student' | null = null;

    if (accessKey === TEACHER_KEY) {
      userType = 'teacher';
    } else if (accessKey === STUDENT_KEY) {
      userType = 'student';
    } else {
      setError('Invalid access key.');
      return;
    }

    try {
      // For this example, we'll use anonymous sign-in.
      // In a real app, you would use a more robust authentication method.
      await signInAnonymously(auth);

      // Store user info in local storage for simplicity
      localStorage.setItem('userType', userType);
      localStorage.setItem('userName', name);

      router.push('/dashboard');
    } catch (e) {
      console.error('Login failed:', e);
      setError('An error occurred during login. Please try again.');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            Welcome to BhashaSTEM
          </CardTitle>
          <CardDescription>
            Enter your name and access key to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="access-key">Access Key</Label>
            <Input
              id="access-key"
              type="password"
              placeholder="Enter your key"
              value={accessKey}
              onChange={e => setAccessKey(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin}>
            Enter Class Section
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
