import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface PromptCardProps {
  id: string;
  title: string;
  content: string;
  tags: string[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PromptCard({ id, title, content, tags, onEdit, onDelete }: PromptCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-dusty-grape truncate pr-2">{title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onEdit(id)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-tomato hover:text-tomato" onClick={() => onDelete(id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[60px]">{content}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="pink" className="text-xs">
            {tag}
          </Badge>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
      </div>
    </div>
  );
}
