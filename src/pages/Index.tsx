import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ExpenseForm, Expense } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseChart } from "@/components/ExpenseChart";
import { SummaryCards } from "@/components/SummaryCards";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FinancialAssistant } from "@/components/FinancialAssistant";
import { generateDemoSeed } from "@/data/financialSeed";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { useTheme } from "next-themes";
import { MonthPicker } from "@/components/MonthPicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type SavedFinanceData = {
  version: number;
  updatedAt: string;
  expenses: Expense[];
};

const MASTER_STORAGE_KEY = "finance-app-expenses-master";

const RECOVERED_MAY_EXPENSE: Expense = {
  id: "1779318104135",
  description: "Almoço no restaurante ",
  amount: 1000,
  category: "Compras",
  date: "2026-05-20T23:01:44.135Z",
  type: "income",
};

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
  const { theme, setTheme } = useTheme();

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
    let currentExpenses = bestSavedData ? bestSavedData.expenses : [];

    // 1. Restaurar automaticamente a transação perdida de Maio se ela não estiver na lista
    if (!currentExpenses.some((e) => e.id === RECOVERED_MAY_EXPENSE.id)) {
      currentExpenses = [RECOVERED_MAY_EXPENSE, ...currentExpenses];
    }

    // 2. Carregar seeds automaticamente se não tiverem sido carregadas para este usuário
    const seedControlKey = `finance-app-seed-loaded-${user.id}`;
    const seedAlreadyLoaded = localStorage.getItem(seedControlKey);

    if (!seedAlreadyLoaded) {
      const seed = generateDemoSeed();
      const existingIds = new Set(currentExpenses.map((e) => e.id));
      const uniqueSeed = seed.filter((e) => !existingIds.has(e.id));
      currentExpenses = [...currentExpenses, ...uniqueSeed];
      localStorage.setItem(seedControlKey, "true");
    }

    // Salvar o estado final com os dados mesclados e restaurados
    saveStoredExpenses(possibleKeys, currentExpenses);
    setExpenses(currentExpenses);
    setHasLoadedExpenses(true);
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user || !hasLoadedExpenses) return;

    persistExpenses(expenses);
  }, [expenses, user, hasLoadedExpenses, persistExpenses]);

  // Carregar o mês anteriormente selecionado do localStorage no início
  useEffect(() => {
    if (!user) return;
    const savedMonth = localStorage.getItem(`finance-app-selected-month-${user.id}`);
    if (savedMonth) {
      setSelectedMonth(savedMonth);
    }
  }, [user]);

  // Salvar o mês selecionado no localStorage sempre que mudar
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`finance-app-selected-month-${user.id}`, selectedMonth);
  }, [selectedMonth, user]);

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Gestão Financeira
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Alternar tema"
              type="button"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-secondary hover:bg-secondary/80 p-0 border border-border">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                      {user.email ? user.email.substring(0, 2) : "US"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Usuário</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-8 max-w-7xl">
        {/* Header e Controles */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Acompanhe suas receitas, despesas e saldo mensal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground hidden md:inline">
              Período:
            </span>
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          </div>
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
      </main>
    </div>
  );
};

export default Index;