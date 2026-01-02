import { useForm } from "@tanstack/react-form";
import { Check, ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Event, EventDraft } from "@/types";

type EventDetailViewProps = {
  event: Event;
  onSave: (id: string, draft: EventDraft) => void;
  onApprove?: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  showApproveAction?: boolean;
};

export function EventDetailView({
  event,
  onSave,
  onApprove,
  onDelete,
  onBack,
  showApproveAction,
}: EventDetailViewProps) {
  const form = useForm({
    defaultValues: {
      title: event.title ?? "",
      description: event.description ?? "",
      start_time: event.start_time ?? "",
      end_time: event.end_time ?? "",
      location_name: event.location_name ?? "",
      address: event.address ?? "",
      website: event.website ?? "",
      price: event.price ?? "",
      age_range: event.age_range ?? "",
      image_url: event.image_url ?? "",
      tags: event.tags?.join(", ") ?? "",
    },
    onSubmit: async ({ value }) => {
      onSave(event.id, value);
    },
  });

  const handleApprove = () => {
    if (!onApprove) return;
    onApprove(event.id);
    onBack();
  };

  const handleDelete = () => {
    onDelete(event.id);
    onBack();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Edit Event</CardTitle>
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
                <label className="text-sm font-medium">Title</label>
                <form.Field
                  name="title"
                  children={(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Event title"
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
                      placeholder="Event description"
                      rows={4}
                    />
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <form.Field
                    name="start_time"
                    children={(field) => (
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Start time"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <form.Field
                    name="end_time"
                    children={(field) => (
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="End time"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Location Name</label>
                <form.Field
                  name="location_name"
                  children={(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Location name"
                    />
                  )}
                />
              </div>

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
                    <div className="flex gap-2">
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://..."
                        className="flex-1"
                      />
                      {field.state.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a
                            href={field.state.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open website"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <form.Field
                    name="price"
                    children={(field) => (
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Free, $15, $10-20"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Age Range</label>
                  <form.Field
                    name="age_range"
                    children={(field) => (
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="All ages, 3-8 years"
                      />
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Image URL</label>
                <form.Field
                  name="image_url"
                  children={(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://example.com/image.jpg"
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
            </div>
          </div>

          {event.source_url && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Source:</span>{" "}
                <a
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {event.source_url}
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
