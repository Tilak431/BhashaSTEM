"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, ClipboardCheck, Library, MessageCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { progressData } from "@/lib/data";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    title: "Browse Library",
    description: "Explore videos, articles, and simulations.",
    href: "/library",
    icon: Library,
  },
  {
    title: "Take a Quiz",
    description: "Test your knowledge and identify learning gaps.",
    href: "/quizzes",
    icon: ClipboardCheck,
  },
  {
    title: "Ask our AI",
    description: "Get answers to your STEM questions instantly.",
    href: "/ask",
    icon: MessageCircle,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Welcome back, Student!
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Card
            key={action.title}
            className="hover:shadow-lg transition-shadow duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium font-headline">
                {action.title}
              </CardTitle>
              <action.icon className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
              <Button asChild variant="link" className="px-0 mt-2">
                <Link href={action.href}>
                  Go to section <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Progress Overview</CardTitle>
          <CardDescription>
            Your learning journey over the past 6 months.
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer
            config={{
              conceptsMastered: {
                label: "Concepts Mastered",
                color: "hsl(var(--primary))",
              },
              quizzesCompleted: {
                label: "Quizzes Completed",
                color: "hsl(var(--accent))",
              },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer>
              <BarChart data={progressData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="conceptsMastered"
                  fill="var(--color-conceptsMastered)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="quizzesCompleted"
                  fill="var(--color-quizzesCompleted)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
