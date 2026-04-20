"use client";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { EntityFormMobileHeader } from "@/components/entity-form-mobile-header";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const weekDays = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

type DayKey = (typeof weekDays)[number]["key"];

const timeSlots = [
  "9:00-10:00 AM",
  "10:00-11:00 AM",
  "11:00-12:00 PM",
  "12:00-1:00 PM",
  "1:00-2:00 PM",
  "2:00-3:00 PM",
  "3:00-4:00 PM",
  "4:00-5:00 PM",
  "5:00-6:00 PM",
  "6:00-7:00 PM",
  "7:00-8:00 PM",
  "8:00-9:00 PM",
  "9:00-10:00 PM",
];

interface BatchFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  batch?: any;
  onSaved: () => void;
}

export function BatchFormDialog({ open, onOpenChange, batch, onSaved }: BatchFormDialogProps) {
  const editing = !!batch;
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", price: "", description: "" });
  const [selectedDays, setSelectedDays] = React.useState<DayKey[]>([]);
  const [selectedSlots, setSelectedSlots] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!open) return;
    if (batch) {
      let parsedSchedule: Array<{ day: DayKey; time: string }> = [];
      if (batch.schedule_json) {
        try {
          parsedSchedule = JSON.parse(batch.schedule_json);
        } catch {
          parsedSchedule = [];
        }
      }

      setForm({
        name: batch.name || "",
        price: String(batch.price ?? ""),
        description: batch.description || "",
      });
      const days = [...new Set(parsedSchedule.map((entry) => entry.day))];
      const slots = [...new Set(parsedSchedule.map((entry) => entry.time))];
      setSelectedDays(days);
      setSelectedSlots(slots);
    } else {
      setForm({ name: "", price: "", description: "" });
      setSelectedDays([]);
      setSelectedSlots([]);
    }
  }, [open, batch]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (selectedDays.length === 0) {
      toast.error("Select at least one weekday");
      return;
    }
    if (selectedSlots.length === 0) {
      toast.error("Select at least one time slot");
      return;
    }

    const scheduleEntries = selectedDays.flatMap((day) => selectedSlots.map((time) => ({ day, time })));
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price) || 0,
        schedule: null,
        schedule_entries: scheduleEntries,
        description: form.description.trim() || null,
      };
      if (editing) {
        await api.updateBatch(batch.id, payload);
        toast.success("Batch updated");
      } else {
        await api.createBatch(payload);
        toast.success("Batch created");
      }
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const title = editing ? "Edit batch" : "New batch";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" mobilePage>
        <EntityFormMobileHeader title={title} onBack={() => onOpenChange(false)} />
        <DialogHeader className="hidden sm:flex text-left sm:text-left">
          <DialogTitle>{editing ? "Edit Batch" : "New Batch"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update batch details with structured schedule capture."
              : "Create a new class batch for your studio."}
          </DialogDescription>
        </DialogHeader>
        <p className="text-[15px] text-muted-foreground max-sm:mt-0 max-sm:mb-2 max-sm:px-0 sm:hidden leading-relaxed">
          {editing ? "Update details and schedule." : "Set name, fee, weekdays, and all time slots for this class."}
        </p>
        <form
          onSubmit={submit}
          className="max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col max-sm:gap-0 sm:space-y-4"
        >
          <div className="space-y-4 max-sm:space-y-5 max-sm:min-h-0 max-sm:flex-1 max-sm:overflow-y-auto max-sm:overscroll-contain max-sm:px-0.5 max-sm:pb-6 max-sm:pt-0">
          <div className="space-y-2">
            <Label htmlFor="bname" variant="form">
              Batch name
            </Label>
            <Input
              id="bname"
              className="text-sm"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Bollywood Beginners"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bprice" variant="form">
              Default price per student (₹)
            </Label>
            <Input
              id="bprice"
              className="text-sm"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="1500"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">You can still set a custom amount per student.</p>
          </div>
          <div className="space-y-2">
            <Label variant="form">Weekdays</Label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <Button
                  key={day.key}
                  type="button"
                  variant={selectedDays.includes(day.key) ? "default" : "outline"}
                  size="sm"
                  className="rounded-full font-medium"
                  onClick={() =>
                    setSelectedDays((prev) =>
                      prev.includes(day.key) ? prev.filter((v) => v !== day.key) : [...prev, day.key],
                    )
                  }
                >
                  {day.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Pick any weekly combination.</p>
          </div>
          <div className="space-y-2">
            <Label variant="form">Class time slots</Label>
            <p className="text-xs text-muted-foreground leading-relaxed -mt-0.5 mb-1">
              Open the list and tick every slot that applies — each weekday you picked will use these times.
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full justify-between rounded-xl px-3 font-normal text-left"
                >
                  <span className="truncate">
                    {selectedSlots.length === 0
                      ? "Choose time slots…"
                      : `${selectedSlots.length} slot${selectedSlots.length === 1 ? "" : "s"} selected`}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={6}
                className="max-h-[min(20rem,55vh)] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
              >
                {timeSlots.map((slot) => (
                  <DropdownMenuCheckboxItem
                    key={slot}
                    className="rounded-lg"
                    checked={selectedSlots.includes(slot)}
                    onCheckedChange={(on) => {
                      if (on) setSelectedSlots((prev) => (prev.includes(slot) ? prev : [...prev, slot]));
                      else setSelectedSlots((prev) => prev.filter((s) => s !== slot));
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {slot}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-2">
            <Label variant="form">Schedule preview</Label>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-sm max-h-40 overflow-y-auto max-sm:rounded-2xl">
              {selectedDays.length === 0 || selectedSlots.length === 0 ? (
                <span className="text-muted-foreground">Select weekdays and at least one slot to preview.</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedDays.flatMap((day) =>
                    selectedSlots.map((time) => {
                      const label = weekDays.find((item) => item.key === day)?.label || day;
                      return (
                        <Badge key={`${day}-${time}`} variant="secondary" className="text-[11px] font-normal">
                          {label} · {time}
                        </Badge>
                      );
                    }),
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bdesc" variant="form">
              Description (optional)
            </Label>
            <Textarea
              id="bdesc"
              className="text-sm min-h-[72px]"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Style, level, instructor notes..."
            />
          </div>
          </div>
          <DialogFooter className="max-sm:sticky max-sm:bottom-0 max-sm:-mx-5 max-sm:mt-auto max-sm:grid max-sm:grid-cols-2 max-sm:gap-3 max-sm:border-t max-sm:border-border/50 max-sm:bg-background max-sm:px-5 max-sm:pt-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.08)] dark:max-sm:shadow-[0_-8px_28px_-8px_rgba(0,0,0,0.35)] sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:pt-2 sm:pb-0 sm:shadow-none">
            <Button
              type="button"
              variant="outline"
              className="max-sm:h-12 max-sm:w-full max-sm:rounded-full max-sm:border-border/70 max-sm:text-[15px] max-sm:font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="max-sm:h-12 max-sm:w-full max-sm:rounded-full max-sm:text-[15px] max-sm:font-semibold gap-2"
            >
              {loading ? (
                <>
                  <Spinner className="text-base" />
                  Saving…
                </>
              ) : editing ? (
                "Save changes"
              ) : (
                "Create batch"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
