"use client";

import { useState, useEffect, useCallback } from "react";
import { promptsApi } from "@/lib/api";
import { PromptCard } from "@/components/prompts/PromptCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Loader2 } from "lucide-react";

interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

export default function PromptsPage() {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "", tags: "" });

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await promptsApi.getAll();
      setPrompts(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load prompts";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const openCreate = () => {
    setEditingPrompt(null);
    setFormData({ title: "", content: "", tags: "" });
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const prompt = prompts.find((p) => p.id === id);
    if (prompt) {
      setEditingPrompt(prompt);
      setFormData({ title: prompt.title, content: prompt.content, tags: prompt.tags.join(", ") });
      setDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await promptsApi.delete(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Prompt deleted", variant: "success" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: "Validation error", description: "Title and content are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (editingPrompt) {
        const updated = await promptsApi.update(editingPrompt.id, { title: formData.title, content: formData.content, tags });
        setPrompts((prev) => prev.map((p) => (p.id === editingPrompt.id ? { ...p, ...updated } : p)));
        toast({ title: "Prompt updated", variant: "success" });
      } else {
        const created = await promptsApi.create({ title: formData.title, content: formData.content, tags });
        setPrompts((prev) => [...prev, created]);
        toast({ title: "Prompt created", variant: "success" });
      }
      setDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filtered = prompts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 bg-warm-white min-h-full">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dusty-grape">Prompt Library</h1>
            <p className="text-muted-foreground mt-1">Manage your saved prompt templates</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            New Prompt
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts by title, content, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {search ? "No prompts match your search" : "No prompts yet. Create your first one!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((prompt) => (
              <PromptCard
                key={prompt.id}
                {...prompt}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? "Edit Prompt" : "Create Prompt"}</DialogTitle>
            <DialogDescription>
              {editingPrompt ? "Update your prompt template" : "Add a new prompt template to your library"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-title">Title</Label>
              <Input
                id="prompt-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Code Review Assistant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-content">Content</Label>
              <Textarea
                id="prompt-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your prompt template..."
                className="min-h-[150px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-tags">Tags (comma-separated)</Label>
              <Input
                id="prompt-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="coding, review, assistant"
              />
              {formData.tags && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <Badge key={tag} variant="pink" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingPrompt ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
