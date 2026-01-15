
'use client';

import {
  addDocumentNonBlocking,
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
  WithId,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
  serverTimestamp,
  doc,
  writeBatch,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useForm, useFormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

interface Post {
  userId: string;
  content: string;
  createdAt: { seconds: number; nanoseconds: number };
  likeCount: number;
  commentCount: number;
}

interface UserProfile {
  name: string;
}

interface Comment {
  userId: string;
  content: string;
  createdAt: { seconds: number; nanoseconds: number };
}

const createPostSchema = z.object({
  content: z.string().min(1, 'Post cannot be empty.').max(280),
});

function PostAuthor({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const userRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'users', userId) : null),
    [firestore, userId]
  );
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userRef);

  if (isLoading || !userProfile) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <Link href={`/profile?id=${userId}`} className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage
          src={`https://picsum.photos/seed/${userProfile.name}/40/40`}
        />
        <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <p className="font-semibold text-sm hover:underline">{userProfile.name}</p>
    </Link>
  );
}

function CommentAuthor({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const userRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'users', userId) : null),
    [firestore, userId]
  );
  const { data: userProfile } = useDoc<UserProfile>(userRef);

  return (
    <Link
      href={`/profile?id=${userId}`}
      className="font-semibold text-xs hover:underline"
    >
      {userProfile?.name || '...'}
    </Link>
  );
}

function PostComments({ postId }: { postId: string }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [comment, setComment] = useState('');

  const commentsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'posts', postId, 'comments'),
            orderBy('createdAt', 'asc')
          )
        : null,
    [firestore, postId]
  );
  const { data: comments, isLoading } =
    useCollection<Comment>(commentsQuery);

  const handleAddComment = async () => {
    if (!comment.trim() || !user || !firestore) return;
    const postRef = doc(firestore, 'posts', postId);
    const commentsRef = collection(postRef, 'comments');
    
    await addDocumentNonBlocking(commentsRef, {
      userId: user.uid,
      content: comment,
      createdAt: serverTimestamp(),
    });

    await updateDocumentNonBlocking(postRef, {
        commentCount: increment(1)
    });

    setComment('');
  };

  return (
    <div className="space-y-3 pt-4 border-t mt-4">
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!isLoading &&
        comments?.map(comment => (
          <div key={comment.id} className="text-xs flex gap-2">
            <CommentAuthor userId={comment.userId} />
            <p className="text-muted-foreground">{comment.content}</p>
          </div>
        ))}
      {user && (
        <div className="flex items-center gap-2 pt-2">
          <Input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={!comment.trim()}
          >
            Post
          </Button>
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: WithId<Post> }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [showComments, setShowComments] = useState(false);

  const likeRef = useMemoFirebase(
    () =>
      user && firestore
        ? doc(firestore, 'posts', post.id, 'likes', user.uid)
        : null,
    [firestore, user, post.id]
  );
  const { data: likeDoc } = useDoc(likeRef);
  const isLiked = !!likeDoc;

  const handleLike = async () => {
    if (!user || !firestore) return;
    const postRef = doc(firestore, 'posts', post.id);

    await runTransaction(firestore, async transaction => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists()) {
        throw 'Document does not exist!';
      }
      const newLikeCount = (postDoc.data().likeCount || 0) + (isLiked ? -1 : 1);
      transaction.update(postRef, { likeCount: newLikeCount });
      if (isLiked) {
        transaction.delete(likeRef!);
      } else {
        transaction.set(likeRef!, { userId: user.uid });
      }
    });
  };

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), {
        addSuffix: true,
      })
    : 'just now';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <PostAuthor userId={post.userId} />
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!user}
            className="flex items-center gap-1.5"
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-current' : ''}`}
            />
            <span className="text-xs">{post.likeCount || 0}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">{post.commentCount || 0}</span>
          </Button>
        </div>
        {showComments && <PostComments postId={post.id} />}
      </CardFooter>
    </Card>
  );
}

function CreatePost() {
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof createPostSchema>>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: '' },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof createPostSchema>) => {
    if (!user || !firestore) return;
    const postsRef = collection(firestore, 'posts');
    await addDocumentNonBlocking(postsRef, {
      userId: user.uid,
      content: values.content,
      createdAt: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
    });
    form.reset();
  };

  if (!user) return null;

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-xl font-headline">Create Post</CardTitle>
            <CardDescription>
              Share your progress, achievements, or ask a question.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={`What's on your mind, ${user.displayName}?`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Post
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export default function FeedPage() {
  const firestore = useFirestore();
  const postsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'))
        : null,
    [firestore]
  );
  const { data: posts, isLoading } = useCollection<Post>(postsQuery);

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <CreatePost />
        <div className="space-y-4">
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {posts?.map(post => <PostCard key={post.id} post={post} />)}
          {!isLoading && posts?.length === 0 && (
            <Card className="text-center p-8">
              <p className="text-muted-foreground">
                No posts yet. Be the first to share something!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

    