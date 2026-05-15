import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ExpenseForm, Expense } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseChart } from "@/components/ExpenseChart";
import { SummaryCards } from "@/components/SummaryCards";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FinancialAssistant } from "@/components/FinancialAssistant";

const STORAGE_KEY = "finance-app-expenses";

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();


  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        setExpenses(JSON.parse(stored));
      }

      setExpensesLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (expensesLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, expensesLoaded]);

  const handleAddExpense = (expense: Expense) => {
    setExpenses([expense, ...expenses]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Até logo!",
      description: "Você saiu da sua conta.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Wallet className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Gestão Financeira
                </h1>
                <p className="text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <div className="space-y-6">
          <SummaryCards expenses={expenses} />

          <FinancialAssistant expenses={expenses} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <ExpenseForm onAddExpense={handleAddExpense} />
              <ExpenseChart expenses={expenses} />
            </div>
            <div>
              <ExpenseList expenses={expenses} onDeleteExpense={handleDeleteExpense} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
