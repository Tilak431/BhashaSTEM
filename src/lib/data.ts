import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  BiologyIcon,
  ChemistryIcon,
  MathIcon,
  PhysicsIcon,
} from '@/components/common/SubjectIcons';

export type Subject = 'Physics' | 'Chemistry' | 'Biology' | 'Math';
export type Language = 'English' | 'Hindi' | 'Tamil' | 'Bengali';

export interface Resource {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  language: Language;
  type: 'Video' | 'Article' | 'Simulation';
  imageId: string;
  Icon: React.ElementType;
}

export interface Quiz {
  id: string;
  title: string;
  subject: Subject;
  questionCount: number;
}

export interface ProgressData {
  month: string;
  conceptsMastered: number;
  quizzesCompleted: number;
}

export const resources: Resource[] = [
  {
    id: '1',
    title: 'Introduction to Newtonian Mechanics',
    description: 'A video series explaining the fundamental laws of motion.',
    subject: 'Physics',
    language: 'English',
    type: 'Video',
    imageId: 'physics_1',
    Icon: PhysicsIcon,
  },
  {
    id: '2',
    title: 'रासायनिक बंधनों को समझना',
    description: 'An interactive simulation about chemical bonds.',
    subject: 'Chemistry',
    language: 'Hindi',
    type: 'Simulation',
    imageId: 'chemistry_1',
    Icon: ChemistryIcon,
  },
  {
    id: '3',
    title: 'Cell Biology Basics',
    description: 'A comprehensive article on the structure and function of cells.',
    subject: 'Biology',
    language: 'English',
    type: 'Article',
    imageId: 'biology_1',
    Icon: BiologyIcon,
  },
  {
    id: '4',
    title: 'Calculus for Beginners',
    description: 'Learn the basics of differentiation and integration.',
    subject: 'Math',
    language: 'Tamil',
    type: 'Video',
    imageId: 'math_1',
    Icon: MathIcon,
  },
  {
    id: '5',
    title: 'Quantum Physics Explained',
    description: 'A deep dive into the weird world of quantum mechanics.',
    subject: 'Physics',
    language: 'Bengali',
    type: 'Article',
    imageId: 'physics_2',
    Icon: PhysicsIcon,
  },
  {
    id: '6',
    title: 'Organic Chemistry Reactions',
    description: 'An interactive guide to common organic reactions.',
    subject: 'Chemistry',
    language: 'English',
    type: 'Simulation',
    imageId: 'chemistry_2',
    Icon: ChemistryIcon,
  },
    {
    id: '7',
    title: 'மரபியல் மற்றும் டிஎன்ஏ',
    description: 'டிஎன்ஏ அமைப்பு மற்றும் செயல்பாட்டைப் பற்றிய ஒரு கட்டுரை.',
    subject: 'Biology',
    language: 'Tamil',
    type: 'Article',
    imageId: 'biology_2',
    Icon: BiologyIcon,
  },
  {
    id: '8',
    title: 'বীজগণিতের মূলসূত্র',
    description: 'বীজগণিতের মৌলিক ধারণাগুলি শিখুন।',
    subject: 'Math',
    language: 'Bengali',
    type: 'Video',
    imageId: 'math_2',
    Icon: MathIcon,
  },
];

export const quizzes: Quiz[] = [
  { id: 'q1', title: 'Kinematics Challenge', subject: 'Physics', questionCount: 15 },
  { id: 'q2', title: 'Periodic Table Test', subject: 'Chemistry', questionCount: 20 },
  { id: 'q3', title: 'Genetics and Evolution', subject: 'Biology', questionCount: 25 },
  { id: 'q4', title: 'Algebra Fundamentals', subject: 'Math', questionCount: 10 },
];

export const progressData: ProgressData[] = [
  { month: 'Jan', conceptsMastered: 10, quizzesCompleted: 4 },
  { month: 'Feb', conceptsMastered: 12, quizzesCompleted: 5 },
  { month: 'Mar', conceptsMastered: 15, quizzesCompleted: 6 },
  { month: 'Apr', conceptsMastered: 14, quizzesCompleted: 5 },
  { month: 'May', conceptsMastered: 18, quizzesCompleted: 7 },
  { month: 'Jun', conceptsMastered: 22, quizzesCompleted: 9 },
];

export const languages: Language[] = ['English', 'Hindi', 'Tamil', 'Bengali'];
export const subjects: Subject[] = ['Physics', 'Chemistry', 'Biology', 'Math'];
