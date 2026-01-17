
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { languages, subjects, Subject, Language } from '@/lib/data';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  WithId,
} from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  BiologyIcon,
  ChemistryIcon,
  MathIcon,
  PhysicsIcon,
} from '@/components/common/SubjectIcons';
import {
  File,
  FileText,
  Video,
  PlusCircle,
  Loader2,
  Trash2,
  BookOpen,
  PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { summarizeAndSpeak } from '@/ai/flows/summarize-and-speak';

const subjectIconMap: Record<Subject, React.ElementType> = {
  Physics: PhysicsIcon,
  Chemistry: ChemistryIcon,
  Biology: BiologyIcon,
  Math: MathIcon,
};

const resourceTypeIconMap: Record<string, React.ElementType> = {
  Video: Video,
  PDF: FileText,
  Notes: File,
};

interface Resource {
  title: string;
  description: string;
  transcript?: string;
  subject: Subject;
  type: 'Video' | 'PDF' | 'Notes';
  fileUrl: string;
  uploaderId: string;
  createdAt: { seconds: number; nanoseconds: number };
}

function getYouTubeId(url: string): string | null {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function VideoPlayerDialog({
  videoId,
  videoTitle,
  isOpen,
  onClose,
}: {
  videoId: string | null;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!videoId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{videoTitle}</DialogTitle>
          <DialogDescription>
            Embedded video player for {videoTitle}.
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={videoTitle}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateResourceDialog({
  isOpen,
  onClose,
  resourcesRef,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  resourcesRef: any;
  user: any;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transcript, setTranscript] = useState('');
  const [subject, setSubject] = useState<Subject | ''>('');
  const [type, setType] = useState<'Video' | 'PDF' | 'Notes' | ''>('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (
      !title ||
      !description ||
      !subject ||
      !type ||
      !fileUrl ||
      !resourcesRef ||
      !user
    )
      return;
    setIsSubmitting(true);
    try {
      await addDocumentNonBlocking(resourcesRef, {
        title,
        description,
        transcript,
        subject,
        type,
        fileUrl,
        uploaderId: user.uid,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setDescription('');
      setTranscript('');
      setSubject('');
      setType('');
      setFileUrl('');
      onClose();
    } catch (error) {
      console.error('Failed to create resource:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a Resource Link</DialogTitle>
          <DialogDescription>
            Provide a link and details for a learning material on the web.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="res-title">Title</Label>
            <Input
              id="res-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Thermodynamics"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="res-desc">Description</Label>
            <Textarea
              id="res-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A brief summary of the resource."
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="res-transcript">Transcript (Optional)</Label>
            <Textarea
              id="res-transcript"
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Paste the full video transcript here for a more accurate AI summary."
              className="h-32"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="res-subject">Subject</Label>
              <Select onValueChange={value => setSubject(value as Subject)}>
                <SelectTrigger id="res-subject">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-type">Type</Label>
              <Select onValueChange={value => setType(value as any)}>
                <SelectTrigger id="res-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Notes">Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="res-url">File URL</Label>
            <Input
              id="res-url"
              value={fileUrl}
              onChange={e => setFileUrl(e.target.value)}
              placeholder="https://example.com/video.mp4 or doc.pdf"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !title || !description || !subject || !type || !fileUrl
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AiSummaryGenerator({ resource }: { resource: WithId<Resource> }) {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    if (!selectedLanguage) return;
    setIsLoading(true);
    setError(null);
    setSummaryText(null);

    try {
      const textToSummarize = resource.transcript || resource.description;
      const result = await summarizeAndSpeak({
        text: textToSummarize,
        targetLanguage: selectedLanguage,
      });
      setSummaryText(result.summary);
    } catch (e) {
      console.error('Summary generation failed:', e);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-dashed">
      <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        <FileText className="h-4 w-4" /> AI Text Summary
      </Label>
      <div className="flex items-center gap-2 mt-2">
        <Select
          onValueChange={setSelectedLanguage}
          disabled={isLoading}
          value={selectedLanguage}
        >
          <SelectTrigger className="flex-1 h-9">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map(lang => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleGenerateSummary}
          disabled={!selectedLanguage || isLoading}
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Generate'
          )}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      {summaryText && (
        <div className="mt-3 space-y-2">
           <div className="h-40 w-full rounded-md border p-3 bg-muted/50 text-sm overflow-y-auto whitespace-pre-wrap">
            {summaryText}
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceCard({
  resource,
  userType,
  firestore,
  onVideoPlay,
}: {
  resource: WithId<Resource>;
  userType: string | null;
  firestore: any;
  onVideoPlay: (videoId: string, videoTitle: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const SubjectIcon = subjectIconMap[resource.subject];
  const TypeIcon = resourceTypeIconMap[resource.type] || BookOpen;

  const videoId =
    resource.type === 'Video' ? getYouTubeId(resource.fileUrl) : null;
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  const handleDelete = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      const resourceRef = doc(firestore, 'resources', resource.id);
      await deleteDocumentNonBlocking(resourceRef);
    } catch (error) {
      console.error('Failed to delete resource:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCardClick = () => {
    if (resource.type === 'Video') {
      const videoId = getYouTubeId(resource.fileUrl);
      if (videoId) {
        onVideoPlay(videoId, resource.title);
        return;
      }
    }
    window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Card className="group flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div
          onClick={handleCardClick}
          className="relative aspect-video w-full overflow-hidden cursor-pointer"
        >
          {thumbnailUrl ? (
            <>
              <Image
                src={thumbnailUrl}
                alt={resource.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle className="h-12 w-12 text-white" />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-secondary">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <CardHeader className="p-4 pb-0">
          <div className="flex items-start justify-between gap-2">
            <CardTitle
              onClick={handleCardClick}
              className="text-lg font-headline leading-tight cursor-pointer hover:underline"
            >
              {resource.title}
            </CardTitle>
            <SubjectIcon className="h-7 w-7 text-primary flex-shrink-0 mt-1" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 flex-grow flex flex-col">
          <CardDescription
            onClick={handleCardClick}
            className="text-sm cursor-pointer flex-grow"
          >
            {resource.description}
          </CardDescription>
          <div onClick={e => e.stopPropagation()}>
            <AiSummaryGenerator resource={resource} />
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 pl-1.5">
              <TypeIcon className="h-3.5 w-3.5" /> {resource.type}
            </Badge>
            <Badge variant="outline">{resource.subject}</Badge>
          </div>
          {userType === 'teacher' && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={e => {
                e.stopPropagation();
                setIsDeleteDialogOpen(true);
              }}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the resource "{resource.title}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function LibraryPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [userType, setUserType] = useState<'student' | 'teacher' | null>(
    null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>(
    'all'
  );
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState('');

  useEffect(() => {
    const type = localStorage.getItem('userType') as
      | 'student'
      | 'teacher'
      | null;
    setUserType(type);
  }, []);

  const resourcesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const resourcesCollection = collection(firestore, 'resources');
    if (selectedSubject !== 'all') {
      return query(resourcesCollection, where('subject', '==', selectedSubject));
    }
    return query(resourcesCollection, orderBy('createdAt', 'desc'));
  }, [firestore, selectedSubject]);

  const { data: rawResources, isLoading } =
    useCollection<Resource>(resourcesQuery);

  const resources = useMemo(() => {
    if (!rawResources) return null;
    if (selectedSubject !== 'all' && rawResources.length > 0) {
      return [...rawResources].sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
    }
    return rawResources;
  }, [rawResources, selectedSubject]);


  const resourcesRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'resources') : null),
    [firestore]
  );

  const handlePlayVideo = (videoId: string, videoTitle: string) => {
    setSelectedVideoId(videoId);
    setSelectedVideoTitle(videoTitle);
    setIsVideoPlayerOpen(true);
  };

  const handleCloseVideoPlayer = () => {
    setIsVideoPlayerOpen(false);
    setSelectedVideoId(null);
    setSelectedVideoTitle('');
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            Content Library
          </h2>
          <p className="text-muted-foreground">
            Explore curated STEM resources uploaded by your teachers.
          </p>
        </div>
        {userType === 'teacher' && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Resource Link
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input placeholder="Search resources..." disabled />
        <Select
          onValueChange={val => setSelectedSubject(val as Subject | 'all')}
          defaultValue="all"
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map(lang => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Video">Video</SelectItem>
            <SelectItem value="Article">Article</SelectItem>
            <SelectItem value="Simulation">Simulation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && resources?.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold">No Resources Found</h3>
          <p className="mt-1 text-sm">
            {userType === 'teacher'
              ? 'Get started by adding a new resource.'
              : 'Your teachers have not added any resources yet.'}
          </p>
        </div>
      )}

      {!isLoading && resources && resources.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              userType={userType}
              firestore={firestore}
              onVideoPlay={handlePlayVideo}
            />
          ))}
        </div>
      )}

      {userType === 'teacher' && (
        <CreateResourceDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          resourcesRef={resourcesRef}
          user={user}
        />
      )}

      <VideoPlayerDialog
        videoId={selectedVideoId}
        videoTitle={selectedVideoTitle}
        isOpen={isVideoPlayerOpen}
        onClose={handleCloseVideoPlayer}
      />
    </div>
  );
}
