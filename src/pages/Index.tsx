import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ExpenseForm, Expense } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseChart } from "@/components/ExpenseChart";
import { SummaryCards } from "@/components/SummaryCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, LogOut, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FinancialAssistant } from "@/components/FinancialAssistant";
import { generateDemoSeed } from "@/data/financialSeed";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

type SavedFinanceData = {
  version: number;
  updatedAt: string;
  expenses: Expense[];
};

const MASTER_STORAGE_KEY = "finance-app-expenses-master";
const SEED_CONTROL_KEY = "finance-app-seed-loaded-global";

const getStorageKeyByUserId = (userId: string) =>
  `finance-app-expenses-${userId}`;

const getStorageKeyByEmail = (email: string) =>
  `finance-app-expenses-email-${email}`;

const getCurrentMonth = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
};

const isValidExpenseArray = (data: unknown): data is Expense[] => {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.description === "string" &&
        typeof item.amount === "number" &&
        typeof item.category === "string" &&
        typeof item.date === "string" &&
        (item.type === "expense" || item.type === "income")
    )
  );
};

const readStoredExpenses = (key: string): SavedFinanceData | null => {
  const rawData = localStorage.getItem(key);

  if (!rawData) return null;

  try {
    const parsedData = JSON.parse(rawData);

    if (isValidExpenseArray(parsedData)) {
      return {
        version: 1,
        updatedAt: new Date().toISOString(),
        expenses: parsedData,
      };
    }

    if (
      parsedData &&
      typeof parsedData === "object" &&
      typeof parsedData.updatedAt === "string" &&
      isValidExpenseArray(parsedData.expenses)
    ) {
      return parsedData as SavedFinanceData;
    }

    return null;
  } catch (error) {
    console.error(`Erro ao ler localStorage na chave ${key}:`, error);
    return null;
  }
};

const saveStoredExpenses = (keys: string[], expenses: Expense[]) => {
  const dataToSave: SavedFinanceData = {
    version: 2,
    updatedAt: new Date().toISOString(),
    expenses,
  };

  keys.forEach((key) => {
    localStorage.setItem(key, JSON.stringify(dataToSave));
  });
};

const chooseBestSavedData = (
  savedDataList: SavedFinanceData[]
): SavedFinanceData | null => {
  if (savedDataList.length === 0) return null;

  return savedDataList.sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();

    if (dateB !== dateA) {
      return dateB - dateA;
    }

    return b.expenses.length - a.expenses.length;
  })[0];
};

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [hasLoadedExpenses, setHasLoadedExpenses] = useState(false);

  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const storageKeys = useMemo(() => {
    if (!user) return [];

    const keys = [getStorageKeyByUserId(user.id), MASTER_STORAGE_KEY];

    if (user.email) {
      keys.push(getStorageKeyByEmail(user.email));
    }

    return keys;
  }, [user]);

  const persistExpenses = useCallback(
    (expensesToSave: Expense[]) => {
      if (!user || storageKeys.length === 0) return;

      saveStoredExpenses(storageKeys, expensesToSave);
    },
    [user, storageKeys]
  );

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    const possibleKeys = [
      getStorageKeyByUserId(user.id),
      MASTER_STORAGE_KEY,
      ...(user.email ? [getStorageKeyByEmail(user.email)] : []),
    ];

    const savedDataList = possibleKeys
      .map((key) => readStoredExpenses(key))
      .filter((data): data is SavedFinanceData => data !== null);

    const bestSavedData = chooseBestSavedData(savedDataList);

    if (bestSavedData) {
      setExpenses(bestSavedData.expenses);
      saveStoredExpenses(possibleKeys, bestSavedData.expenses);
      setHasLoadedExpenses(true);
      return;
    }

    const seedAlreadyLoaded = localStorage.getItem(SEED_CONTROL_KEY);

    if (!seedAlreadyLoaded) {
      const seed = generateDemoSeed();

      setExpenses(seed);
      saveStoredExpenses(possibleKeys, seed);
      localStorage.setItem(SEED_CONTROL_KEY, "true");
      setHasLoadedExpenses(true);
      return;
    }

    setExpenses([]);
    setHasLoadedExpenses(true);
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !hasLoadedExpenses) return;

    persistExpenses(expenses);
  }, [expenses, user, hasLoadedExpenses, persistExpenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      return expense.date.slice(0, 7) === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  const handleAddExpense = (expense: Expense) => {
    setExpenses((prevExpenses) => {
      const updatedExpenses = [expense, ...prevExpenses];

      persistExpenses(updatedExpenses);

      return updatedExpenses;
    });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prevExpenses) => {
      const updatedExpenses = prevExpenses.filter(
        (expense) => expense.id !== id
      );

      persistExpenses(updatedExpenses);

      return updatedExpenses;
    });

    toast({
      title: "Transação removida",
      description: "A transação foi removida com sucesso.",
    });
  };

  const handleLogout = async () => {
    persistExpenses(expenses);

    await supabase.auth.signOut();

    navigate("/auth");
  };

  if (loading || !hasLoadedExpenses) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-primary/10 p-4">
              <Wallet className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Gestão Financeira
              </h1>

              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </header>

        <div className="space-y-2 max-w-xs">
          <Label htmlFor="selectedMonth" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Mês do relatório
          </Label>

          <Input
            id="selectedMonth"
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          />
        </div>

        <SummaryCards expenses={filteredExpenses} />

        <FinancialAssistant
          expenses={filteredExpenses}
          selectedMonth={selectedMonth}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ExpenseForm onAddExpense={handleAddExpense} />

          <ExpenseChart
            expenses={filteredExpenses}
            selectedMonth={selectedMonth}
          />
        </div>

        <ExpenseList
          expenses={filteredExpenses}
          onDeleteExpense={handleDeleteExpense}
        />
      </div>
    </div>
  );
};

export default Index;