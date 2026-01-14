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
import { signInWithCustomToken, updateProfile } from 'firebase/auth';
import { generateAuthToken } from '@/ai/flows/generate-auth-token';
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from 'lucide-react';

// This component is only for client-side use, so we can import uuid here.
// In a real app, you might handle UID generation differently.

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const [name, setName] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!name.trim() || !accessKey.trim()) {
      setError('Please enter your name and access key.');
      setLoading(false);
      return;
    }

    if (!auth) {
        setError('Auth service is not available. Please try again later.');
        setLoading(false);
        return;
    }

    try {
      // Generate a temporary, unique ID for this user session.
      // Firebase Auth will later assign a permanent UID.
      const tempUid = uuidv4();

      const { customToken, userType } = await generateAuthToken({
        name,
        accessKey,
        uid: tempUid,
      });

      // Sign in with the custom token from the backend
      const userCredential = await signInWithCustomToken(auth, customToken);
      
      // Now that the user is created, update their profile with the display name
      await updateProfile(userCredential.user, { displayName: name });


      // Store user info in local storage for simplicity
      localStorage.setItem('userType', userType);
      localStorage.setItem('userName', name);

      router.push('/dashboard');
    } catch (e: any) {
      console.error('Login failed:', e);
      setError(e.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enter Class Section
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
