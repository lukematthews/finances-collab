import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import "react-day-picker/dist/style.css";
import { DateRange } from "react-day-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePopover } from "./DateRangePopover";
import { socket } from "@/lib/socket";

/** Helpers */
const camelCase = (str: string) =>
  str
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join("");

/** Types */
interface BudgetSettingsForm {
  name: string;
  shortCode: string;
}

interface MonthItem {
  id: string;
  name: string;
  position: number;
  from?: Date;
  to?: Date;
}

type Props = {
  onCancel: () => void;
};

/** Main Component */
export default function BudgetWizard({ onCancel }: Props) {
  const navigate = useNavigate();

  // ─── Settings Form ────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<BudgetSettingsForm>({ mode: "onChange" });

  const nameWatch = watch("name");
  useEffect(() => {
    const auto = camelCase(nameWatch || "");
    if (!watch("shortCode")) setValue("shortCode", auto, { shouldValidate: false });
  }, [nameWatch]);

  // ─── Months State ─────────────────────────────────
  const [showMonths, setShowMonths] = useState(false);
  const [months, setMonths] = useState<MonthItem[]>([]);

  const addMonthRow = () => {
    setShowMonths(true);
    setMonths((m) => [...m, { id: uuid(), name: `Month ${m.length + 1}`, position: m.length }]);
  };

  const updateMonthName = (id: string, name: string) => setMonths((m) => m.map((x) => (x.id === id ? { ...x, name } : x)));

  const updateMonthDates = (id: string, range: DateRange | undefined) => setMonths((months) => months.map((m) => (m.id === id ? { ...m, from: range?.from, to: range?.to } : m)));
  const moveMonth = (id: string, dir: -1 | 1) =>
    setMonths((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [
        { ...next[newIdx], position: idx },
        { ...next[idx], position: newIdx },
      ];
      return next;
    });

  const deleteMonth = (id: string) => setMonths((m) => m.filter((x) => x.id !== id).map((m, i) => ({ ...m, position: i })));

  // ─── Submit Wizard ────────────────────────────────
  const onFinish = handleSubmit(async (settings) => {
    const payload = {
      name: settings.name,
      shortCode: settings.shortCode || camelCase(settings.name),
      months: months.map(({ name, position, from, to }) => ({
        name,
        position,
        started: false,
        fromDate: from?.toISOString(),
        toDate: to?.toISOString(),
      })),
    };

    try {
      socket.emit("budgetEvent", {
        source: "frontend",
        entity: "budget",
        operation: "create",
        payload: payload,
      });
      navigate(`/b/${payload.shortCode}`);
    } catch (err) {
      console.error(err);
      alert("Error creating budget");
    }
  });

  return (
    <Card className="max-w-2xl mx-auto mt-10 p-8 space-y-6">
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Create a budget</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input {...register("name", { required: true })} placeholder="e.g. 2025 Family Budget" />
            {errors.name && <p className="text-red-500 text-xs mt-1">Name is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Short Code</label>
            <Input {...register("shortCode")} placeholder="Auto‑generated" />
          </div>
          {!showMonths && (
            <div className="flex justify-between">
              <Button disabled={!isValid} onClick={addMonthRow}>
                Add Months
              </Button>
              <Button disabled={!isValid} onClick={onFinish}>
                Finish
              </Button>
            </div>
          )}
        </div>

        {/* Step 2 – Months */}
        {showMonths && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Months</h2>
            {months.map((m, idx) => (
              <div key={m.id} className="flex flex-col gap-2 border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Input value={m.name} onChange={(e) => updateMonthName(m.id, e.target.value)} className="flex-1" placeholder="Month name" />
                  <Button variant="outline" size="icon" onClick={() => moveMonth(m.id, -1)} disabled={idx === 0}>
                    ↑
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => moveMonth(m.id, 1)} disabled={idx === months.length - 1}>
                    ↓
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => deleteMonth(m.id)}>
                    ✕
                  </Button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration</label>
                  <DateRangePopover value={m.from ? { from: m.from, to: m.to } : undefined} onChange={(range) => updateMonthDates(m.id, range)} />{" "}
                </div>
              </div>
            ))}
            <Button onClick={addMonthRow}>+ Add Month</Button>
            <div className="pt-6 flex justify-end">
              <Button onClick={onCancel}>Cancel</Button>
              <Button onClick={onFinish}>Finish</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};