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
      bgColor: "bg-gradient-to-br from-success/20 to-success/5",
      borderColor: "border-l-success",
      glowColor: "hover:shadow-[0_8px_30px_rgba(34,197,94,0.12)] dark:hover:shadow-[0_8px_30px_rgba(34,197,94,0.06)]",
      watermarkIcon: TrendingUp,
      watermarkColor: "text-success/[0.07] dark:text-success/[0.04]",
    },

    {
      title: "Despesas",
      value: totalExpenses,
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-gradient-to-br from-destructive/20 to-destructive/5",
      borderColor: "border-l-destructive",
      glowColor: "hover:shadow-[0_8px_30px_rgba(239,68,68,0.12)] dark:hover:shadow-[0_8px_30px_rgba(239,68,68,0.06)]",
      watermarkIcon: TrendingDown,
      watermarkColor: "text-destructive/[0.07] dark:text-destructive/[0.04]",
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
          ? "bg-gradient-to-br from-success/20 to-success/5"
          : "bg-gradient-to-br from-destructive/20 to-destructive/5",
      borderColor: balance >= 0 ? "border-l-success" : "border-l-destructive",
      glowColor: balance >= 0
        ? "hover:shadow-[0_8px_30px_rgba(34,197,94,0.12)] dark:hover:shadow-[0_8px_30px_rgba(34,197,94,0.06)]"
        : "hover:shadow-[0_8px_30px_rgba(239,68,68,0.12)] dark:hover:shadow-[0_8px_30px_rgba(239,68,68,0.06)]",
      watermarkIcon: balance >= 0 ? DollarSign : Wallet,
      watermarkColor: balance >= 0
        ? "text-success/[0.07] dark:text-success/[0.04]"
        : "text-destructive/[0.07] dark:text-destructive/[0.04]",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const WatermarkIcon = card.watermarkIcon;

        return (
          <Card
            key={index}
            className={`
              relative
              overflow-hidden
              border-l-4 ${card.borderColor}
              shadow-md
              transition-all
              duration-300
              hover:-translate-y-1
              ${card.glowColor}
            `}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
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

            <CardContent className="relative z-10">
              <div
                className={`text-2xl font-bold ${card.color}`}
              >
                {formatCurrency(card.value)}
              </div>

              {card.title === "Saldo" ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {balance >= 0
                    ? "Saldo positivo"
                    : "Saldo negativo"}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Total no período
                </p>
              )}
            </CardContent>

            {/* Watermark Icon */}
            <div className={`absolute -right-4 -bottom-6 ${card.watermarkColor} pointer-events-none transform rotate-12`}>
              <WatermarkIcon className="h-24 w-24" />
            </div>
          </Card>
        );
      })}
    </div>
  );
};