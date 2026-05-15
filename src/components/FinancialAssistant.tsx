import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, AlertTriangle, Lightbulb } from "lucide-react";
import { Expense } from "@/components/ExpenseForm";

interface FinancialAssistantProps {
  expenses: Expense[];
}

export const FinancialAssistant = ({ expenses }: FinancialAssistantProps) => {
  const incomes = expenses.filter((item) => item.type === "income");
  const outcomes = expenses.filter((item) => item.type === "expense");

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = outcomes.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  const expensesByCategory = outcomes.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(expensesByCategory).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const getFinancialAnalysis = () => {
    if (expenses.length === 0) {
      return {
        title: "Comece registrando suas movimentações",
        message:
          "Ainda não há dados suficientes para análise. Registre receitas e despesas para receber orientações financeiras personalizadas.",
        type: "neutral",
      };
    }

    if (balance < 0) {
      return {
        title: "Atenção: saldo negativo",
        message:
          "Suas despesas estão maiores que suas receitas. Evite novos gastos não essenciais e revise suas categorias de maior consumo.",
        type: "warning",
      };
    }

    if (totalExpense > totalIncome * 0.7) {
      return {
        title: "Cuidado com o nível de gastos",
        message:
          "Você já comprometeu mais de 70% da sua receita. Tente reduzir gastos variáveis para manter uma reserva de segurança.",
        type: "warning",
      };
    }

    return {
      title: "Boa organização financeira",
      message:
        "Seu saldo está positivo. Continue registrando suas transações e considere separar parte da receita para uma meta ou reserva.",
      type: "positive",
    };
  };

  const analysis = getFinancialAnalysis();

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          Assistente Financeiro IA
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg bg-primary/5 p-4">
          <h3 className="font-semibold">{analysis.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {analysis.message}
          </p>
        </div>

        {topCategory && (
          <div className="flex gap-3 rounded-lg border p-4">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
            <div>
              <p className="font-medium">Maior categoria de gasto</p>
              <p className="text-sm text-muted-foreground">
                Sua maior despesa está em{" "}
                <strong>{topCategory[0]}</strong>, totalizando{" "}
                <strong>
                  {topCategory[1].toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
                .
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 rounded-lg border p-4">
          <Lightbulb className="h-5 w-5 text-yellow-500 mt-1" />
          <div>
            <p className="font-medium">Sugestão inteligente</p>
            <p className="text-sm text-muted-foreground">
              Defina um limite mensal para categorias como Lazer, Compras e
              Outros. Isso ajuda a evitar gastos impulsivos e melhora sua
              previsibilidade financeira.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};