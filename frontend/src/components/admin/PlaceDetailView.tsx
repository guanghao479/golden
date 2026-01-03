import { useForm } from "@tanstack/react-form";
import { Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Place, PlaceDraft } from "@/types";

type PlaceDetailViewProps = {
  place: Place;
  onSave: (id: string, draft: PlaceDraft) => void;
  onApprove?: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  showApproveAction?: boolean;
};

export function PlaceDetailView({
  place,
  onSave,
  onApprove,
  onDelete,
  onBack,
  showApproveAction,
}: PlaceDetailViewProps) {
  const form = useForm({
    defaultValues: {
      name: place.name ?? "",
      description: place.description ?? "",
      category: place.category ?? "",
      address: place.address ?? "",
      website: place.website ?? "",
      family_friendly: place.family_friendly ?? false,
      tags: place.tags?.join(", ") ?? "",
    },
    onSubmit: async ({ value }) => {
      onSave(place.id, value);
    },
  });

  const handleApprove = () => {
    onApprove?.(place.id);
    onBack();
  };

  const handleDelete = () => {
    onDelete(place.id);
    onBack();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edit Place</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            {(showApproveAction ?? Boolean(onApprove)) && (
              <Button size="sm" onClick={handleApprove} className="gap-2">
                <Check className="h-4 w-4" />
                Approve
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <form.Field
                  name="name"
                  children={(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Place name"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <form.Field
                  name="description"
                  children={(field) => (
                    <Textarea
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Place description"
                      rows={4}
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <form.Field
                  name="category"
                  children={(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Park, Museum, Restaurant"
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Address</label>
                <form.Field
                  name="address"
                  children={(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Full address"
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Website</label>
                <form.Field
                  name="website"
                  children={(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://..."
                    />
                  )}
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Tags (comma separated)
                </label>
                <form.Field
                  name="tags"
                  children={(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="outdoor, kids, free"
                    />
                  )}
                />
              </div>

              <div>
                <form.Field
                  name="family_friendly"
                  children={(field) => (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.state.value}
                        onChange={(e) => field.handleChange(e.target.checked)}
                        className="h-4 w-4 rounded border-muted"
                      />
                      Family Friendly
                    </label>
                  )}
                />
              </div>
            </div>
          </div>

          {place.source_url && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Source:</span>{" "}
                <a
                  href={place.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {place.source_url}
                </a>
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="outline">
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
