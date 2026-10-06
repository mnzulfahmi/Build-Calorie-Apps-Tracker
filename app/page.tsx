"use client";

import {
  AlertCircle,
  Calculator,
  CalendarDays,
  Camera,
  Check,
  Loader2,
  Plus,
  Save,
  Search,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Utensils,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { getTodayDate } from "@/lib/date";
import { foods, type Food } from "@/lib/foods";

type MealCategory = "Breakfast" | "Lunch" | "Dinner" | "Snack";

type LogEntry = Food & {
  foodId: string;
  mealCategory: MealCategory;
  logDate: string;
  createdAt: string;
};

type Totals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type BodyProfile = {
  heightCm: number;
  weightKg: number;
  updatedAt: string;
};

type NutritionFoodEstimate = {
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "low" | "medium" | "high";
};

type NutritionEstimate = {
  source: "text" | "image";
  foods: NutritionFoodEstimate[];
  totals: Totals;
  notes: string[];
};

const today = getTodayDate();
const mealCategories: MealCategory[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getBodyTarget(heightCm: number, weightKg: number) {
  if (
    !Number.isFinite(heightCm) ||
    !Number.isFinite(weightKg) ||
    heightCm < 80 ||
    heightCm > 260 ||
    weightKg < 20 ||
    weightKg > 400
  ) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const maintenanceCalories = Math.round(weightKg * 30);
  let category = "Normal";
  let targetCalories = maintenanceCalories;

  if (bmi < 18.5) {
    category = "Underweight";
    targetCalories = maintenanceCalories + 300;
  } else if (bmi >= 30) {
    category = "Obesity";
    targetCalories = maintenanceCalories - 300;
  } else if (bmi >= 25) {
    category = "Overweight";
    targetCalories = maintenanceCalories - 300;
  }

  return { bmi, category, maintenanceCalories, targetCalories };
}

function getProgressState(percent: number) {
  if (percent < 80) return { color: "bg-leaf", text: "On pace" };
  if (percent <= 100) return { color: "bg-citrus", text: "Near goal" };
  return { color: "bg-tomato", text: "Over goal" };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [totals, setTotals] = useState<Totals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [savingFoodId, setSavingFoodId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingLog, setClearingLog] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealCategory>("Breakfast");
  const [heightInput, setHeightInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [textMeal, setTextMeal] = useState("");
  const [textEstimate, setTextEstimate] = useState<NutritionEstimate | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [imageEstimate, setImageEstimate] = useState<NutritionEstimate | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [savingEstimateKey, setSavingEstimateKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const heightCm = Number(heightInput);
  const weightKg = Number(weightInput);
  const bodyTarget = getBodyTarget(heightCm, weightKg);
  const dailyGoal = bodyTarget?.targetCalories ?? 2200;
  const remainingCalories = dailyGoal - totals.calories;
  const progressPercent = Math.round((totals.calories / dailyGoal) * 100);
  const progress = getProgressState(progressPercent);
  const macroTotal = totals.protein + totals.carbs + totals.fat;
  const todayLabel = formatDateLabel(today);

  const filteredFoods = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? foods.filter((food) => food.name.toLowerCase().includes(normalizedQuery))
      : foods;
  }, [query]);

  const groupedEntries = useMemo(
    () =>
      mealCategories.map((category) => ({
        category,
        entries: entries.filter((entry) => entry.mealCategory === category),
      })),
    [entries]
  );

  async function loadProfile() {
    try {
      const response = await fetch("/api/profile");
      if (!response.ok) throw new Error("Could not load body target.");
      const data = (await response.json()) as { profile: BodyProfile | null };
      if (data.profile) {
        setHeightInput(String(data.profile.heightCm));
        setWeightInput(String(data.profile.weightKg));
      }
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Something went wrong.");
    }
  }

  async function loadLog() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/log?date=${today}`);
      if (!response.ok) throw new Error("Could not load today's log.");
      const data = (await response.json()) as { entries: LogEntry[]; totals: Totals };
      setEntries(data.entries.map((entry) => ({ ...entry, mealCategory: entry.mealCategory ?? "Snack" })));
      setTotals(data.totals);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function addFood(foodId: string) {
    setSavingFoodId(foodId);
    setError(null);

    try {
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId, date: today, mealCategory: selectedMeal }),
      });
      if (!response.ok) throw new Error("Could not add that food.");
      await loadLog();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Something went wrong.");
    } finally {
      setSavingFoodId(null);
    }
  }

  async function addEstimateFood(food: NutritionFoodEstimate, key: string) {
    setSavingEstimateKey(key);
    setError(null);

    try {
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          mealCategory: selectedMeal,
          entry: {
            name: food.name,
            servingSize: food.servingSize,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
          },
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not add that AI estimate.");
      }
      await loadLog();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Something went wrong.");
    } finally {
      setSavingEstimateKey(null);
    }
  }

  async function addAllEstimateFoods(estimate: NutritionEstimate, keyPrefix: string) {
    setSavingEstimateKey(`${keyPrefix}-all`);
    setError(null);

    try {
      for (const food of estimate.foods) {
        const response = await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: today,
            mealCategory: selectedMeal,
            entry: {
              name: food.name,
              servingSize: food.servingSize,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat,
            },
          }),
        });
        if (!response.ok) throw new Error(`Could not add ${food.name}.`);
      }
      await loadLog();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Something went wrong.");
    } finally {
      setSavingEstimateKey(null);
    }
  }

  async function deleteEntry(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/log/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not remove that entry.");
      await loadLog();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  async function clearTodaysLog() {
    if (entries.length === 0) return;
    const confirmed = window.confirm("Clear all items from today's log?");
    if (!confirmed) return;

    setClearingLog(true);
    setError(null);

    try {
      const response = await fetch(`/api/log?date=${today}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not clear today's log.");
      await loadLog();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Something went wrong.");
    } finally {
      setClearingLog(false);
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    setProfileStatus(null);
    setError(null);

    try {
      if (!bodyTarget) throw new Error("Enter a height from 80-260 cm and weight from 20-400 kg.");
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heightCm, weightKg }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not save body target.");
      }
      setProfileStatus("Saved");
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Something went wrong.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function lookupTextMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const description = textMeal.trim();
    if (description.length < 3) {
      setError("Describe your meal with at least a few words.");
      return;
    }

    setTextLoading(true);
    setTextEstimate(null);
    setError(null);

    try {
      const response = await fetch("/api/nutrition/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = (await response.json().catch(() => null)) as { estimate?: NutritionEstimate; error?: string } | null;
      if (!response.ok || !data?.estimate) throw new Error(data?.error ?? "Could not estimate that meal.");
      setTextEstimate(data.estimate);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "AI lookup had trouble with that meal. Try a little more detail."
      );
    } finally {
      setTextLoading(false);
    }
  }

  async function lookupImageMeal() {
    if (!selectedImage) {
      setError("Choose or take a meal photo first.");
      return;
    }

    setImageLoading(true);
    setImageEstimate(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("description", "Meal photo for calorie tracking");
      const response = await fetch("/api/nutrition/image", { method: "POST", body: formData });
      const data = (await response.json().catch(() => null)) as { estimate?: NutritionEstimate; error?: string } | null;
      if (!response.ok || !data?.estimate) throw new Error(data?.error ?? "Could not estimate that photo.");
      setImageEstimate(data.estimate);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "AI lookup had trouble with that photo. Try a clearer image."
      );
    } finally {
      setImageLoading(false);
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImageEstimate(null);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  useEffect(() => {
    void Promise.all([loadLog(), loadProfile()]);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  return (
    <main className="min-h-screen bg-porcelain text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white px-5 py-5 shadow-panel sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-leaf text-white">
              <Utensils aria-hidden="true" size={24} suppressHydrationWarning />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Calorie Tracker</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-ink/60">
                <CalendarDays aria-hidden="true" size={16} suppressHydrationWarning />
                <span>{todayLabel}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <HeaderStat label="Logged" value={`${totals.calories}`} detail="cal" />
            <HeaderStat label="Goal" value={`${dailyGoal}`} detail="cal" />
          </div>
        </header>

        {error ? (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={18} suppressHydrationWarning />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
          <DailyTargetCard
            totals={totals}
            dailyGoal={dailyGoal}
            remainingCalories={remainingCalories}
            progressPercent={progressPercent}
            progress={progress}
            macroTotal={macroTotal}
          />
          <BodyTargetCard
            heightInput={heightInput}
            weightInput={weightInput}
            bodyTarget={bodyTarget}
            savingProfile={savingProfile}
            profileStatus={profileStatus}
            onHeightChange={(value) => {
              setHeightInput(value);
              setProfileStatus(null);
            }}
            onWeightChange={(value) => {
              setWeightInput(value);
              setProfileStatus(null);
            }}
            onSave={() => void saveProfile()}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="flex min-w-0 flex-col gap-4">
            <MealSelector selectedMeal={selectedMeal} onSelect={setSelectedMeal} />

            <section className="grid gap-4 xl:grid-cols-2">
              <form onSubmit={(event) => void lookupTextMeal(event)} className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
                <SectionTitle icon={<Sparkles aria-hidden="true" size={20} suppressHydrationWarning />} title="Describe a meal" detail={`Adds to ${selectedMeal}`} />
                <textarea
                  value={textMeal}
                  onChange={(event) => setTextMeal(event.target.value)}
                  placeholder="Grilled chicken with rice and salad"
                  className="mt-4 min-h-28 w-full resize-y rounded-lg border border-ink/10 bg-porcelain px-3 py-3 text-base text-ink outline-none transition placeholder:text-ink/40 focus:border-leaf focus:bg-white focus:ring-4 focus:ring-leaf/10"
                />
                <PrimaryButton type="submit" disabled={textLoading || textMeal.trim().length < 3}>
                  {textLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  {textLoading ? "Estimating meal" : "Estimate meal"}
                </PrimaryButton>
                <EstimateReview estimate={textEstimate} title="Text estimate" keyPrefix="text" savingEstimateKey={savingEstimateKey} onAddFood={addEstimateFood} onAddAll={addAllEstimateFoods} />
              </form>

              <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
                <SectionTitle icon={<Camera aria-hidden="true" size={20} suppressHydrationWarning />} title="Analyze a photo" detail={`Adds to ${selectedMeal}`} />
                <label className="mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-ink/20 bg-porcelain px-4 py-6 text-center transition hover:border-leaf hover:bg-white">
                  <Upload aria-hidden="true" className="text-leaf" size={24} suppressHydrationWarning />
                  <span className="mt-2 text-sm font-semibold text-ink">Choose or take a photo</span>
                  <span className="mt-1 text-sm text-ink/55">JPG, PNG, WebP, GIF up to 8 MB</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="sr-only" />
                </label>
                {imagePreview ? (
                  <div className="mt-4 overflow-hidden rounded-lg border border-ink/10 bg-porcelain">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Selected meal preview" className="max-h-72 w-full object-cover" />
                  </div>
                ) : null}
                <PrimaryButton type="button" onClick={() => void lookupImageMeal()} disabled={imageLoading || !selectedImage}>
                  {imageLoading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                  {imageLoading ? "Analyzing photo" : "Analyze photo"}
                </PrimaryButton>
                <EstimateReview estimate={imageEstimate} title="Photo estimate" keyPrefix="image" savingEstimateKey={savingEstimateKey} onAddFood={addEstimateFood} onAddAll={addAllEstimateFoods} />
              </section>
            </section>

            <FoodSearchPanel query={query} filteredFoods={filteredFoods} selectedMeal={selectedMeal} savingFoodId={savingFoodId} onQueryChange={setQuery} onAddFood={addFood} />
          </div>

          <DailyLogPanel
            groupedEntries={groupedEntries}
            loading={loading}
            deletingId={deletingId}
            clearingLog={clearingLog}
            onDelete={deleteEntry}
            onClearLog={clearTodaysLog}
          />
        </section>
      </div>
    </main>
  );
}

function HeaderStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-porcelain px-4 py-3">
      <p className="text-xs font-medium text-ink/55">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">
        {value} <span className="text-sm font-medium text-ink/50">{detail}</span>
      </p>
    </div>
  );
}

function DailyTargetCard({
  totals,
  dailyGoal,
  remainingCalories,
  progressPercent,
  progress,
  macroTotal,
}: {
  totals: Totals;
  dailyGoal: number;
  remainingCalories: number;
  progressPercent: number;
  progress: { color: string; text: string };
  macroTotal: number;
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <SectionTitle icon={<Target size={20} />} title="Daily goal" detail={progress.text} />
        <p className={remainingCalories >= 0 ? "text-sm font-semibold text-leaf" : "text-sm font-semibold text-tomato"}>
          {remainingCalories >= 0 ? `${remainingCalories} cal left` : `${Math.abs(remainingCalories)} cal over`}
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-6xl font-semibold leading-none text-ink">{totals.calories}</p>
          <p className="mt-2 text-sm text-ink/55">of {dailyGoal} calories</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:w-80">
          <Macro label="Protein" value={totals.protein} colorClass="bg-sky text-ink" />
          <Macro label="Carbs" value={totals.carbs} colorClass="bg-citrus text-ink" />
          <Macro label="Fat" value={totals.fat} colorClass="bg-tomato text-white" />
        </div>
      </div>
      <div className="mt-5 h-4 overflow-hidden rounded-full bg-ink/10" aria-label={`${progressPercent}% of calorie goal`}>
        <div className={`h-full rounded-full ${progress.color} transition-all duration-500`} style={{ width: `${Math.min(progressPercent, 125)}%` }} />
      </div>
      <div className="mt-5">
        <MacroBar label="Protein" value={totals.protein} total={macroTotal} colorClass="bg-sky" />
        <MacroBar label="Carbs" value={totals.carbs} total={macroTotal} colorClass="bg-citrus" />
        <MacroBar label="Fat" value={totals.fat} total={macroTotal} colorClass="bg-tomato" />
      </div>
    </section>
  );
}

function BodyTargetCard({
  heightInput,
  weightInput,
  bodyTarget,
  savingProfile,
  profileStatus,
  onHeightChange,
  onWeightChange,
  onSave,
}: {
  heightInput: string;
  weightInput: string;
  bodyTarget: ReturnType<typeof getBodyTarget>;
  savingProfile: boolean;
  profileStatus: string | null;
  onHeightChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel sm:p-6">
      <SectionTitle icon={<Calculator size={20} />} title="Body target" detail="Height and weight estimate" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <InputWithUnit label="Height" value={heightInput} unit="cm" placeholder="170" onChange={onHeightChange} />
        <InputWithUnit label="Weight" value={weightInput} unit="kg" placeholder="70" onChange={onWeightChange} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <TargetMetric label="BMI" value={bodyTarget ? roundMacro(bodyTarget.bmi) : "--"} />
        <TargetMetric label="Status" value={bodyTarget?.category ?? "--"} />
        <TargetMetric label="Goal" value={bodyTarget ? `${bodyTarget.targetCalories}` : "--"} />
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/60">Simple planning estimate based on height and weight.</p>
      <button
        type="button"
        onClick={onSave}
        disabled={!bodyTarget || savingProfile}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-semibold text-white transition hover:bg-leaf focus:outline-none focus:ring-4 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-ink/35"
      >
        <Save aria-hidden="true" size={17} suppressHydrationWarning />
        {savingProfile ? "Saving target" : profileStatus ?? "Save target"}
      </button>
    </section>
  );
}

function MealSelector({ selectedMeal, onSelect }: { selectedMeal: MealCategory; onSelect: (meal: MealCategory) => void }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-3 shadow-panel">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {mealCategories.map((meal) => (
          <button
            key={meal}
            type="button"
            onClick={() => onSelect(meal)}
            aria-pressed={selectedMeal === meal}
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-leaf/15 ${
              selectedMeal === meal ? "bg-leaf text-white" : "bg-porcelain text-ink hover:bg-leaf/10"
            }`}
          >
            {meal}
          </button>
        ))}
      </div>
    </section>
  );
}

function FoodSearchPanel({
  query,
  filteredFoods,
  selectedMeal,
  savingFoodId,
  onQueryChange,
  onAddFood,
}: {
  query: string;
  filteredFoods: Food[];
  selectedMeal: MealCategory;
  savingFoodId: string | null;
  onQueryChange: (value: string) => void;
  onAddFood: (foodId: string) => Promise<void>;
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white shadow-panel">
      <div className="border-b border-ink/10 p-4 sm:p-5">
        <SectionTitle icon={<Search size={20} />} title="Quick-add foods" detail={`Adds to ${selectedMeal}`} />
        <div className="mt-3 flex min-h-12 items-center gap-3 rounded-lg border border-ink/10 bg-porcelain px-3 transition focus-within:border-leaf focus-within:bg-white focus-within:ring-4 focus-within:ring-leaf/10">
          <Search aria-hidden="true" className="shrink-0 text-leaf" size={20} suppressHydrationWarning />
          <input
            id="food-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search chicken, rice, eggs..."
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink/40"
          />
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2">
        {filteredFoods.map((food) => (
          <article key={food.id} className="flex min-h-36 flex-col justify-between rounded-lg border border-ink/10 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-leaf/30 motion-reduce:hover:translate-y-0">
            <FoodCardHeader name={food.name} servingSize={food.servingSize} calories={food.calories} />
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <Nutrient label="Protein" value={food.protein} />
              <Nutrient label="Carbs" value={food.carbs} />
              <Nutrient label="Fat" value={food.fat} />
            </div>
            <button
              type="button"
              onClick={() => void onAddFood(food.id)}
              disabled={savingFoodId === food.id}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-leaf px-3 text-sm font-semibold text-white transition hover:bg-ink focus:outline-none focus:ring-4 focus:ring-leaf/15 disabled:cursor-not-allowed disabled:bg-ink/35"
            >
              {savingFoodId === food.id ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              {savingFoodId === food.id ? "Adding" : "Add food"}
            </button>
          </article>
        ))}
        {filteredFoods.length === 0 ? <EmptyState title="No foods found" detail="Try another search, describe the meal, or use a photo." /> : null}
      </div>
    </section>
  );
}

function DailyLogPanel({
  groupedEntries,
  loading,
  deletingId,
  clearingLog,
  onDelete,
  onClearLog,
}: {
  groupedEntries: { category: MealCategory; entries: LogEntry[] }[];
  loading: boolean;
  deletingId: string | null;
  clearingLog: boolean;
  onDelete: (id: string) => Promise<void>;
  onClearLog: () => Promise<void>;
}) {
  const entryCount = groupedEntries.reduce((count, group) => count + group.entries.length, 0);

  return (
    <aside className="rounded-lg border border-ink/10 bg-white shadow-panel lg:sticky lg:top-5 lg:self-start">
      <div className="flex items-start justify-between gap-3 border-b border-ink/10 p-4 sm:p-5">
        <SectionTitle icon={<Utensils size={20} />} title="Today's log" detail={`${entryCount} entries`} />
        <button
          type="button"
          onClick={() => void onClearLog()}
          disabled={loading || clearingLog || entryCount === 0}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:border-ink/10 disabled:text-ink/35"
        >
          {clearingLog ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
          {clearingLog ? "Clearing" : "Clear log"}
        </button>
      </div>
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : entryCount === 0 ? (
          <EmptyState title="No foods logged yet" detail="Pick a meal, then add food from search, text, or photo." />
        ) : (
          <div className="space-y-5">
            {groupedEntries.filter((group) => group.entries.length > 0).map((group) => (
              <section key={group.category}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">{group.category}</h3>
                  <span className="text-xs font-medium text-ink/50">{group.entries.length} items</span>
                </div>
                <div className="space-y-3">
                  {group.entries.map((entry) => (
                    <article key={entry.id} className="rounded-lg border border-ink/10 bg-porcelain p-3">
                      <div className="flex items-start justify-between gap-3">
                        <FoodCardHeader name={entry.name} servingSize={entry.servingSize} calories={entry.calories} />
                        <button
                          type="button"
                          onClick={() => void onDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          aria-label={`Remove ${entry.name}`}
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-ink/10 bg-white text-ink transition hover:border-red-200 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {deletingId === entry.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={17} />}
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <Nutrient label="Protein" value={entry.protein} />
                        <Nutrient label="Carbs" value={entry.carbs} />
                        <Nutrient label="Fat" value={entry.fat} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function EstimateReview({
  estimate,
  title,
  keyPrefix,
  savingEstimateKey,
  onAddFood,
  onAddAll,
}: {
  estimate: NutritionEstimate | null;
  title: string;
  keyPrefix: string;
  savingEstimateKey: string | null;
  onAddFood: (food: NutritionFoodEstimate, key: string) => Promise<void>;
  onAddAll: (estimate: NutritionEstimate, keyPrefix: string) => Promise<void>;
}) {
  if (!estimate) return null;

  return (
    <div className="mt-4 rounded-lg border border-ink/10 bg-porcelain p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm text-ink/60">
            {estimate.foods.length} item{estimate.foods.length === 1 ? "" : "s"}, {estimate.totals.calories} calories total.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onAddAll(estimate, keyPrefix)}
          disabled={estimate.foods.length === 0 || savingEstimateKey === `${keyPrefix}-all`}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-semibold text-white transition hover:bg-leaf focus:outline-none focus:ring-4 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-ink/35"
        >
          {savingEstimateKey === `${keyPrefix}-all` ? <Loader2 className="animate-spin" size={17} /> : <Check size={17} />}
          Add all
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {estimate.foods.map((food, index) => {
          const key = `${keyPrefix}-${index}`;
          return (
            <article key={key} className="rounded-lg border border-ink/10 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <FoodCardHeader name={food.name} servingSize={`${food.servingSize} - ${food.confidence} confidence`} calories={food.calories} />
                <button
                  type="button"
                  onClick={() => void onAddFood(food, key)}
                  disabled={savingEstimateKey === key}
                  className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-leaf/20 bg-white px-2.5 text-sm font-semibold text-leaf transition hover:border-leaf hover:bg-porcelain focus:outline-none focus:ring-4 focus:ring-leaf/10 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {savingEstimateKey === key ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  Add
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <Nutrient label="Protein" value={food.protein} />
                <Nutrient label="Carbs" value={food.carbs} />
                <Nutrient label="Fat" value={food.fat} />
              </div>
            </article>
          );
        })}
      </div>
      {estimate.notes.length > 0 ? <div className="mt-3 text-sm leading-6 text-ink/60">{estimate.notes.join(" ")}</div> : null}
    </div>
  );
}

function SectionTitle({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-ink/55">{detail}</p>
      </div>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-porcelain text-leaf">{icon}</div>
    </div>
  );
}

function InputWithUnit({
  label,
  value,
  unit,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-medium text-ink/70">
      {label}
      <div className="mt-1 flex min-h-11 items-center rounded-lg border border-ink/10 bg-porcelain px-3 transition focus-within:border-leaf focus-within:bg-white focus-within:ring-4 focus-within:ring-leaf/10">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none placeholder:text-ink/35"
          aria-label={`${label} in ${unit}`}
        />
        <span className="text-sm text-ink/50">{unit}</span>
      </div>
    </label>
  );
}

function FoodCardHeader({ name, servingSize, calories }: { name: string; servingSize: string; calories: number }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-base font-semibold text-ink">{name}</h3>
          <p className="mt-1 text-sm text-ink/60">{servingSize}</p>
        </div>
        <p className="shrink-0 rounded-md bg-citrus/20 px-2.5 py-1 text-sm font-semibold text-ink">{calories} cal</p>
      </div>
    </div>
  );
}

function Macro({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className={`rounded-lg px-3 py-2 ${colorClass}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-lg font-semibold">{roundMacro(value)}g</p>
    </div>
  );
}

function MacroBar({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3 py-1.5 text-sm">
      <span className="font-medium text-ink/65">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-ink/10">
        <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-right font-semibold text-ink">{percent}%</span>
    </div>
  );
}

function Nutrient({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white px-2 py-1.5 ring-1 ring-ink/10">
      <p className="truncate text-xs font-medium text-ink/50">{label}</p>
      <p className="text-sm font-semibold text-ink">{roundMacro(value)}g</p>
    </div>
  );
}

function TargetMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-porcelain px-3 py-2">
      <p className="text-xs font-medium text-ink/50">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function PrimaryButton({
  type,
  disabled,
  onClick,
  children,
}: {
  type: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-leaf px-4 text-sm font-semibold text-white transition hover:bg-ink focus:outline-none focus:ring-4 focus:ring-leaf/15 disabled:cursor-not-allowed disabled:bg-ink/35"
    >
      {children}
    </button>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ink/15 bg-porcelain p-8 text-center md:col-span-2">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink/60">{detail}</p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-lg border border-ink/10 bg-porcelain p-4">
      <div className="h-4 w-2/3 rounded bg-ink/10" />
      <div className="mt-3 h-3 w-1/2 rounded bg-ink/10" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-9 rounded bg-ink/10" />
        <div className="h-9 rounded bg-ink/10" />
        <div className="h-9 rounded bg-ink/10" />
      </div>
    </div>
  );
}
