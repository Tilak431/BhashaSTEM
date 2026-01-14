import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { languages, resources, subjects } from "@/lib/data";
import type { ImagePlaceholder } from "@/lib/placeholder-images";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const imageMap = PlaceHolderImages.reduce((acc, img) => {
  acc[img.id] = img;
  return acc;
}, {} as Record<string, ImagePlaceholder>);

export default function LibraryPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          Content Library
        </h2>
        <p className="text-muted-foreground">
          Explore curated STEM resources in your language.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input placeholder="Search resources..." />
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select>
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {resources.map((resource) => {
          const image = imageMap[resource.imageId];
          return (
            <Card
              key={resource.id}
              className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={image.imageUrl}
                    alt={image.description}
                    fill
                    className="object-cover"
                    data-ai-hint={image.imageHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-headline leading-tight">
                    {resource.title}
                  </CardTitle>
                  <resource.Icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                </div>
                <CardDescription className="mt-2 text-sm">
                  {resource.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{resource.language}</Badge>
                  <Badge variant="outline">{resource.type}</Badge>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
