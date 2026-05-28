import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
} from "lucide-react";

import { Expense } from "./ExpenseForm";

interface SummaryCardsProps {
  expenses: Expense[];
}

export const SummaryCards = ({
  expenses,
}: SummaryCardsProps) => {
  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = totalIncome - totalExpenses;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const cards = [
    {
      title: "Receitas",
      value: totalIncome,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },

    {
      title: "Despesas",
      value: totalExpenses,
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },

    {
      title: "Saldo",
      value: balance,
      icon: balance >= 0 ? DollarSign : Wallet,
      color:
        balance >= 0
          ? "text-success"
          : "text-destructive",
      bgColor:
        balance >= 0
          ? "bg-success/10"
          : "bg-destructive/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <Card
            key={index}
            className="
              shadow-lg
              transition-all
              duration-300
              hover:shadow-xl
              hover:-translate-y-1
            "
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>

              <div
                className={`p-2 rounded-lg ${card.bgColor}`}
              >
                <Icon
                  className={`h-4 w-4 ${card.color}`}
                />
              </div>
            </CardHeader>

            <CardContent>
              <div
                className={`text-2xl font-bold ${card.color}`}
              >
                {formatCurrency(card.value)}
              </div>

              {card.title === "Saldo" && (
                <p className="text-xs text-muted-foreground mt-1">
                  {balance >= 0
                    ? "Saldo positivo"
                    : "Saldo negativo"}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};