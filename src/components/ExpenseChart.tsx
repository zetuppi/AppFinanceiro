import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Expense } from "./ExpenseForm";

interface ExpenseChartProps {
  expenses: Expense[];
  selectedMonth: string;
}

const COLORS = [
  "#2563eb",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export const ExpenseChart = ({
  expenses,
  selectedMonth,
}: ExpenseChartProps) => {
  const expenseData = expenses
    .filter((expense) => expense.type === "expense")
    .reduce<{ name: string; value: number }[]>((acc, expense) => {
      const existingCategory = acc.find(
        (item) => item.name === expense.category
      );

      if (existingCategory) {
        existingCategory.value += expense.amount;
      } else {
        acc.push({
          name: expense.category,
          value: expense.amount,
        });
      }

      return acc;
    }, []);

  const consumptionExpenseData = expenseData.filter(
    (expense) => expense.name !== "Reserva financeira"
  );

  const totalConsumptionExpenses = consumptionExpenseData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const topExpenses = [...consumptionExpenseData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatSelectedMonth = (month: string) => {
    const [year, monthNumber] = month.split("-");

    return new Date(
      Number(year),
      Number(monthNumber) - 1
    ).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>Relatório de Gastos</span>

          <span className="text-sm font-medium text-muted-foreground capitalize">
            {formatSelectedMonth(selectedMonth)}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {expenseData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma despesa registrada ainda
          </p>
        ) : (
          <>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">
                Maiores gastos
              </h3>

              {topExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum gasto de consumo registrado neste mês.
                </p>
              ) : (
                topExpenses.map((expense) => {
                  const percentage =
                    totalConsumptionExpenses > 0
                      ? (expense.value / totalConsumptionExpenses) * 100
                      : 0;

                  return (
                    <div
                      key={expense.name}
                      className="flex items-center justify-between p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {expense.name}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {percentage.toFixed(1)}% dos gastos de consumo
                        </p>
                      </div>

                      <p className="font-semibold">
                        {formatCurrency(expense.value)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};