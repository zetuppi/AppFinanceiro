import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Expense } from "./ExpenseForm";

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

type TransactionFilter = "all" | "income" | "expense";

export const ExpenseList = ({
  expenses,
  onDeleteExpense,
}: ExpenseListProps) => {
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>("all");

  const filteredExpenses = useMemo(() => {
    if (activeFilter === "all") {
      return expenses;
    }

    return expenses.filter((expense) => expense.type === activeFilter);
  }, [expenses, activeFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  const getEmptyMessage = () => {
    if (activeFilter === "income") {
      return "Nenhuma receita registrada neste mês";
    }

    if (activeFilter === "expense") {
      return "Nenhuma despesa registrada neste mês";
    }

    return "Nenhuma transação registrada ainda";
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Transações Recentes</CardTitle>

          <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-1">
            <Button
              type="button"
              size="sm"
              variant={activeFilter === "all" ? "default" : "ghost"}
              onClick={() => setActiveFilter("all")}
              className="rounded-lg"
            >
              Todas
            </Button>

            <Button
              type="button"
              size="sm"
              variant={activeFilter === "income" ? "default" : "ghost"}
              onClick={() => setActiveFilter("income")}
              className="rounded-lg"
            >
              Receitas
            </Button>

            <Button
              type="button"
              size="sm"
              variant={activeFilter === "expense" ? "default" : "ghost"}
              onClick={() => setActiveFilter("expense")}
              className="rounded-lg"
            >
              Despesas
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredExpenses.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {getEmptyMessage()}
          </p>
        ) : (
          <div className="max-h-[520px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-card transition-all duration-300 hover:bg-muted/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      expense.type === "income"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {expense.type === "income" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {expense.description}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {expense.category} • {formatDate(expense.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold ${
                      expense.type === "income"
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {expense.type === "income" ? "+" : "-"}
                    {formatCurrency(expense.amount)}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteExpense(expense.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

