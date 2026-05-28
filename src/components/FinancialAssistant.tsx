import { Expense } from "@/components/ExpenseForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  FlaskConical,
  History,
  Lightbulb,
  PiggyBank,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface FinancialAssistantProps {
  expenses: Expense[];
  selectedMonth: string;
}

type InsightPriority = "high" | "medium" | "low";
type AssistantPersonality =
  | "equilibrada"
  | "conservadora"
  | "agressiva"
  | "premium";

interface FinancialGoals {
  reserveGoal: number;
  monthlySavingsGoal: number;
  categoryLimitName: string;
  categoryLimitValue: number;
  personality: AssistantPersonality;
}

const GOALS_STORAGE_KEY = "financial-ai-goals";

const defaultGoals: FinancialGoals = {
  reserveGoal: 3000,
  monthlySavingsGoal: 1600,
  categoryLimitName: "Alimentação",
  categoryLimitValue: 600,
  personality: "equilibrada",
};

const fixedCategories = [
  "Aluguel",
  "Cartão de Crédito",
  "Contas",
  "Condominio",
  "Assinaturas",
];

export const FinancialAssistant = ({
  expenses,
  selectedMonth,
}: FinancialAssistantProps) => {
  const [currentInsight, setCurrentInsight] = useState(0);
  const [autoPlayResetKey, setAutoPlayResetKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const dragStartX = useRef<number | null>(null);

  const [goals, setGoals] = useState<FinancialGoals>(() => {
    const savedGoals = localStorage.getItem(GOALS_STORAGE_KEY);
    return savedGoals ? JSON.parse(savedGoals) : defaultGoals;
  });

  const [previousPattern, setPreviousPattern] = useState<{
    topCategory?: string;
    realExpensePercentage?: number;
    reservedAmount?: number;
    score?: number;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const getExpenseDate = (item: Expense) => {
    if (!item.date) return new Date();

    const [year, month, day] = item.date.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const getStartOfWeek = (date: Date) => {
    const newDate = new Date(date);
    const day = newDate.getDay();
    newDate.setDate(newDate.getDate() - day);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  const [selectedYear, selectedMonthNumber] = selectedMonth
    .split("-")
    .map(Number);

  const today = new Date();

  const isSelectedMonthCurrent =
    selectedYear === today.getFullYear() &&
    selectedMonthNumber - 1 === today.getMonth();

  const daysInMonth = new Date(
    selectedYear,
    selectedMonthNumber,
    0
  ).getDate();

  const now = isSelectedMonthCurrent
    ? today
    : new Date(selectedYear, selectedMonthNumber - 1, daysInMonth);

  const currentMonthExpenses = expenses;

  const currentWeekStart = getStartOfWeek(now);

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  const currentWeekExpenses = expenses.filter((item) => {
    const date = getExpenseDate(item);
    return date >= currentWeekStart && date <= now;
  });

  const previousWeekExpenses = expenses.filter((item) => {
    const date = getExpenseDate(item);
    return date >= previousWeekStart && date < currentWeekStart;
  });

  const todayTransactionCount = expenses.filter(
    (item) => getExpenseDate(item).toDateString() === now.toDateString()
  ).length;

  const isTestScenario = todayTransactionCount >= 6;

  const incomes = currentMonthExpenses.filter((item) => item.type === "income");
  const outcomes = currentMonthExpenses.filter((item) => item.type === "expense");

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = outcomes.reduce((sum, item) => sum + item.amount, 0);

  const reservedAmount = outcomes
    .filter((item) => item.category === "Reserva financeira")
    .reduce((sum, item) => sum + item.amount, 0);

  const fixedExpenses = outcomes
    .filter((item) => fixedCategories.includes(item.category))
    .reduce((sum, item) => sum + item.amount, 0);

  const variableExpenses = outcomes
    .filter(
      (item) =>
        !fixedCategories.includes(item.category) &&
        item.category !== "Reserva financeira"
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const realExpenses = fixedExpenses + variableExpenses;
  const balance = totalIncome - totalExpense;

  const realExpensePercentage =
    totalIncome > 0 ? (realExpenses / totalIncome) * 100 : 0;

  const savingsPercentage =
    totalIncome > 0 ? ((balance + reservedAmount) / totalIncome) * 100 : 0;

  const suggestedReserve = balance > 0 ? balance * 0.3 : 0;

  const currentDay = now.getDate();
  const remainingDays = Math.max(daysInMonth - currentDay, 0);

  const projectedVariableExpenses =
    currentDay > 0
      ? variableExpenses + (variableExpenses / currentDay) * remainingDays
      : variableExpenses;

  const projectedMonthlyExpenses = fixedExpenses + projectedVariableExpenses;

  const projectedFinalBalance =
    totalIncome - projectedMonthlyExpenses - reservedAmount;

  const expensesByCategory = outcomes
    .filter((item) => item.category !== "Reserva financeira")
    .reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});

  const topCategory = Object.entries(expensesByCategory).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const monitoredCategorySpent = expensesByCategory[goals.categoryLimitName] || 0;

  const categoryLimitPercentage =
    goals.categoryLimitValue > 0
      ? (monitoredCategorySpent / goals.categoryLimitValue) * 100
      : 0;

  const currentWeekRealExpenses = currentWeekExpenses
    .filter(
      (item) =>
        item.type === "expense" && item.category !== "Reserva financeira"
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const previousWeekRealExpenses = previousWeekExpenses
    .filter(
      (item) =>
        item.type === "expense" && item.category !== "Reserva financeira"
    )
    .reduce((sum, item) => sum + item.amount, 0);

  const weeklyChangePercentage =
    previousWeekRealExpenses > 0
      ? ((currentWeekRealExpenses - previousWeekRealExpenses) /
        previousWeekRealExpenses) *
      100
      : 0;

  const monthlySavingsPercentage =
    goals.monthlySavingsGoal > 0
      ? (reservedAmount / goals.monthlySavingsGoal) * 100
      : 0;

  const reserveGoalPercentage =
    goals.reserveGoal > 0 ? (reservedAmount / goals.reserveGoal) * 100 : 0;

  const getFinancialScore = () => {
    if (expenses.length === 0 || totalIncome === 0) return 0;

    let score = 100;

    if (balance < 0) score -= 30;
    if (realExpensePercentage > 90) score -= 30;
    else if (realExpensePercentage > 70) score -= 20;
    else if (realExpensePercentage > 50) score -= 10;

    if (reservedAmount === 0) score -= 15;
    if (projectedFinalBalance < 0) score -= 20;
    if (categoryLimitPercentage > 100) score -= 10;
    if (weeklyChangePercentage > 30) score -= 8;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const score = getFinancialScore();

  useEffect(() => {
    const savedPattern = localStorage.getItem("financial-behavior-history");

    if (savedPattern) {
      setPreviousPattern(JSON.parse(savedPattern));
    }
  }, []);

  useEffect(() => {
    if (expenses.length === 0) return;

    const currentPattern = {
      topCategory: topCategory?.[0],
      realExpensePercentage,
      reservedAmount,
      score,
    };

    localStorage.setItem(
      "financial-behavior-history",
      JSON.stringify(currentPattern)
    );
  }, [
    expenses.length,
    topCategory,
    realExpensePercentage,
    reservedAmount,
    score,
  ]);

  const getPersonalityLabel = () => {
    if (goals.personality === "conservadora") return "Conservadora";
    if (goals.personality === "agressiva") return "Agressiva";
    if (goals.personality === "premium") return "Premium";
    return "Equilibrada";
  };

  const getPersonalityMessage = () => {
    if (goals.personality === "conservadora") {
      return "Modo conservador ativo: a IA fica mais cautelosa, valoriza reserva financeira, proteção de saldo e redução de riscos antes de sugerir qualquer folga no orçamento.";
    }

    if (goals.personality === "agressiva") {
      return "Modo agressivo ativo: a IA fica mais direta, procura desperdícios com lupa e sugere cortes mais firmes para acelerar a economia mensal.";
    }

    if (goals.personality === "premium") {
      return "Modo premium ativo: a IA interpreta seus dados com linguagem mais estratégica, destacando fluxo de caixa, margem de segurança e tomada de decisão.";
    }

    return "Modo equilibrado ativo: a IA busca um meio-termo entre controle financeiro, reserva e qualidade de vida.";
  };

  const getPriorityAlertMessage = () => {
    if (balance < 0) {
      if (goals.personality === "conservadora") {
        return "Saldo negativo detectado. A recomendação conservadora é pausar gastos variáveis e priorizar a recuperação da margem financeira.";
      }

      if (goals.personality === "agressiva") {
        return "Saldo negativo no radar. Corte rápido nos gastos não essenciais para virar o jogo ainda neste período.";
      }

      if (goals.personality === "premium") {
        return "Seu fluxo de caixa projetado entrou em zona crítica. O ideal é proteger liquidez e revisar despesas variáveis imediatamente.";
      }

      return "Você está com saldo negativo. O foco principal agora deve ser reduzir despesas e recuperar margem financeira.";
    }

    if (realExpensePercentage > 70) {
      if (goals.personality === "conservadora") {
        return "Seu comprometimento de renda está alto para um perfil conservador. Vale reduzir gastos variáveis antes que a reserva seja pressionada.";
      }

      if (goals.personality === "agressiva") {
        return "Os gastos reais passaram de um ponto confortável. Hora de atacar os maiores vazamentos do orçamento.";
      }

      if (goals.personality === "premium") {
        return "O comprometimento da renda está elevado. A IA sugere reequilibrar o orçamento para preservar margem de decisão.";
      }

      return "Seus gastos reais estão altos. Vale revisar despesas variáveis antes de assumir novos compromissos.";
    }

    if (goals.personality === "conservadora") {
      return "Nenhum risco crítico encontrado, mas o perfil conservador recomenda manter foco em reserva e previsibilidade.";
    }

    if (goals.personality === "agressiva") {
      return "Nenhum alerta crítico agora. Existe espaço para buscar economia extra e acelerar sua meta mensal.";
    }

    if (goals.personality === "premium") {
      return "Cenário estável. Seu fluxo financeiro não apresenta risco imediato e mantém boa margem de controle.";
    }

    return "Nenhum alerta crítico encontrado. Seu cenário atual não apresenta risco financeiro imediato.";
  };

  const getForecastMessage = () => {
    if (projectedFinalBalance < 0) {
      if (goals.personality === "conservadora") {
        return `A projeção conservadora acendeu alerta: possível saldo negativo de ${formatCurrency(
          Math.abs(projectedFinalBalance)
        )}. A IA recomenda conter gastos variáveis agora.`;
      }

      if (goals.personality === "agressiva") {
        return `A previsão indica rombo de ${formatCurrency(
          Math.abs(projectedFinalBalance)
        )}. A IA sugere cortes imediatos para recuperar o mês.`;
      }

      if (goals.personality === "premium") {
        return `A projeção aponta déficit de ${formatCurrency(
          Math.abs(projectedFinalBalance)
        )}. O fluxo de caixa precisa de ajuste para preservar liquidez.`;
      }

      return `A IA prevê saldo negativo de ${formatCurrency(
        Math.abs(projectedFinalBalance)
      )}. Ela separou ${formatCurrency(
        fixedExpenses
      )} em gastos fixos e projetou apenas os gastos variáveis.`;
    }

    if (goals.personality === "conservadora") {
      return `A previsão indica saldo final de ${formatCurrency(
        projectedFinalBalance
      )}. Mesmo positivo, a IA recomenda manter cautela e proteger a reserva.`;
    }

    if (goals.personality === "agressiva") {
      return `A IA prevê saldo final de ${formatCurrency(
        projectedFinalBalance
      )}. Dá para buscar mais economia atacando os gastos variáveis do mês.`;
    }

    if (goals.personality === "premium") {
      return `A projeção indica saldo final de ${formatCurrency(
        projectedFinalBalance
      )}. Sua margem financeira permanece positiva após gastos fixos e variáveis projetados.`;
    }

    return `A IA prevê saldo final de ${formatCurrency(
      projectedFinalBalance
    )}. A projeção considera gastos fixos já pagos e tendência dos gastos variáveis.`;
  };

  const getFinancialAnalysis = () => {
    if (expenses.length === 0) {
      return {
        title: "Comece registrando suas movimentações",
        message:
          "Ainda não há dados suficientes para uma análise inteligente. Registre receitas e despesas para que a IA identifique padrões, riscos e oportunidades.",
      };
    }

    if (totalIncome === 0 && totalExpense > 0) {
      return {
        title: "Falta registrar suas receitas",
        message:
          "Você já registrou despesas, mas ainda não informou nenhuma receita.",
      };
    }

    if (projectedFinalBalance < 0) {
      return {
        title: "Previsão financeira em alerta",
        message: `A previsão híbrida indica possível saldo negativo de ${formatCurrency(
          Math.abs(projectedFinalBalance)
        )}. A IA considerou gastos fixos já pagos e projetou apenas os gastos variáveis.`,
      };
    }

    if (balance < 0) {
      return {
        title: "Risco financeiro alto",
        message: `Suas despesas ultrapassaram suas receitas em ${formatCurrency(
          Math.abs(balance)
        )}.`,
      };
    }

    if (realExpensePercentage > 70) {
      return {
        title: "Atenção ao comprometimento da renda",
        message: `Seus gastos reais representam ${realExpensePercentage.toFixed(
          1
        )}% da sua renda.`,
      };
    }

    if (reservedAmount > 0 && savingsPercentage >= 20) {
      return {
        title: "Boa construção de reserva",
        message: `Você já reservou ${formatCurrency(
          reservedAmount
        )} neste período.`,
      };
    }

    return {
      title: "Boa organização financeira",
      message:
        "Seu saldo está positivo e seus gastos estão sob controle. A previsão usa uma análise híbrida entre gastos fixos e variáveis.",
    };
  };

  const getSmartSuggestion = () => {
    if (isTestScenario) {
      return "A IA detectou muitos lançamentos no mesmo dia. Isso pode ser um cenário de teste, então ela vai interpretar previsões temporais com mais cautela.";
    }

    if (goals.personality === "agressiva" && realExpensePercentage > 60) {
      return "Sua IA está em modo agressivo: reduza temporariamente gastos variáveis e tente proteger sua meta de economia mensal.";
    }

    if (balance < 0) {
      return "Priorize reduzir gastos variáveis e revisar despesas não essenciais.";
    }

    if (reservedAmount === 0 && totalIncome > 0) {
      if (goals.personality === "conservadora") {
        return "Você ainda não registrou reserva neste período. Para um perfil conservador, esse deve ser o primeiro ajuste.";
      }

      if (goals.personality === "agressiva") {
        return "Reserva zerada no mês. Separe um valor logo no início para não deixar a meta depender do que sobrar.";
      }

      if (goals.personality === "premium") {
        return "Ainda não há reserva registrada no período. Criar uma alocação mensal melhora sua margem de segurança financeira.";
      }

      return "Você ainda não registrou nenhuma reserva financeira neste período.";
    }

    if (
      topCategory &&
      totalIncome > 0 &&
      topCategory[0] !== "Reserva financeira"
    ) {
      const topCategoryPercentage = (topCategory[1] / totalIncome) * 100;

      if (topCategoryPercentage > 30) {
        return `A categoria ${topCategory[0]} representa ${topCategoryPercentage.toFixed(
          1
        )}% da sua renda. Esse pode ser o principal ponto de ajuste.`;
      }
    }

    if (goals.personality === "conservadora") {
      return "Continue priorizando reserva, previsibilidade e redução de gastos variáveis.";
    }

    if (goals.personality === "agressiva") {
      return "Existe espaço para apertar os gastos variáveis e aumentar sua economia mensal.";
    }

    if (goals.personality === "premium") {
      return "Mantenha atenção à margem de segurança e use o saldo positivo para decisões financeiras mais estratégicas.";
    }

    return "Continue separando parte da receita para metas e reserva financeira.";
  };

  const getBehaviorAnalysis = () => {
    if (expenses.length < 5) {
      return "Ainda há poucos registros para identificar padrões.";
    }

    if (isTestScenario) {
      return "A IA detectou um possível cenário de testes: muitas transações foram registradas na mesma data.";
    }

    if (weeklyChangePercentage > 30) {
      return `Seu comportamento semanal mudou bastante: os gastos subiram ${weeklyChangePercentage.toFixed(
        1
      )}% em relação à semana anterior.`;
    }

    if (reservedAmount > 0 && balance > 0) {
      return "Você está conseguindo gastar, reservar e ainda manter saldo positivo.";
    }

    if (realExpensePercentage > 85) {
      return "Seu padrão atual mostra alto comprometimento da renda.";
    }

    if (topCategory?.[0] === "Lazer") return "Os gastos com lazer estão se destacando.";
    if (topCategory?.[0] === "Roupas") return "Roupas aparece como categoria dominante.";
    if (topCategory?.[0] === "Transporte (Uber/99)") return "Os gastos com transporte por aplicativo estão elevados.";
    if (topCategory?.[0] === "Alimentação") return "Alimentação está entre seus maiores gastos.";

    if (goals.personality === "conservadora") {
      return "Seu padrão financeiro está controlado, mas a IA conservadora ainda recomenda fortalecer a reserva.";
    }

    if (goals.personality === "agressiva") {
      return "Seu padrão financeiro está moderado, com oportunidade de cortar excessos e acelerar resultados.";
    }

    if (goals.personality === "premium") {
      return "Seu padrão financeiro mostra estabilidade operacional e boa leitura para tomada de decisão.";
    }

    return "Seu padrão financeiro está moderado.";
  };

  const getPatternChangeMessage = () => {
    if (isTestScenario) {
      return "A IA identificou concentração incomum de lançamentos no mesmo dia. Isso é comum durante testes e pode afetar comparações temporais.";
    }

    if (!previousPattern || expenses.length < 5) {
      return "A IA começou a montar seu histórico financeiro. Conforme você registra novas movimentações, ela passa a comparar seu comportamento atual com análises anteriores.";
    }

    if (
      previousPattern.topCategory &&
      topCategory?.[0] &&
      previousPattern.topCategory !== topCategory[0]
    ) {
      return `Hoje seu padrão mudou: antes a categoria principal era ${previousPattern.topCategory}, agora é ${topCategory[0]}.`;
    }

    if (
      previousPattern.realExpensePercentage !== undefined &&
      realExpensePercentage > previousPattern.realExpensePercentage + 10
    ) {
      return "Hoje seus gastos aumentaram bastante em relação à última análise.";
    }

    if (previousPattern.score !== undefined && score > previousPattern.score) {
      return "Seu score financeiro melhorou desde a última análise.";
    }

    if (
      previousPattern.reservedAmount !== undefined &&
      reservedAmount > previousPattern.reservedAmount
    ) {
      return "Sua reserva financeira aumentou desde a última análise.";
    }

    return "Seu comportamento financeiro segue estável.";
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) {
      return {
        label: "Excelente",
        className:
          "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    }

    if (score >= 75) {
      return {
        label: "Saudável",
        className:
          "bg-blue-100 text-blue-700 border-blue-200",
      };
    }

    if (score >= 60) {
      return {
        label: "Atenção",
        className:
          "bg-amber-100 text-amber-700 border-amber-200",
      };
    }

    return {
      label: "Risco",
      className:
        "bg-red-100 text-red-700 border-red-200",
    };
  };

  const healthBadge = getHealthBadge(score);

  const metricCardClass =
    "rounded-xl border p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5";

  const analysis = getFinancialAnalysis();

  const insights = [
    ...(isTestScenario
      ? [
        {
          title: "Modo de testes detectado",
          message:
            "Muitas movimentações foram registradas no mesmo dia. A IA entende que isso pode ser uma simulação e avisa que previsões temporais podem ficar distorcidas.",
          icon: FlaskConical,
          color: "text-violet-500",
          priority: "medium" as InsightPriority,
        },
      ]
      : []),

    {
      title: "Alerta de prioridade",
      message: getPriorityAlertMessage(),
      icon: AlertTriangle,
      color: "text-red-500",
      priority:
        balance < 0 || realExpensePercentage > 70 ? "high" : "low",
    },

    {
      title: "Previsão inteligente",
      message: getForecastMessage(),
      icon: TrendingUp,
      color: "text-blue-500",
      priority: projectedFinalBalance < 0 ? "high" : "medium",
    },

    {
      title: "Composição da previsão",
      message: `Até agora, a IA identificou ${formatCurrency(
        fixedExpenses
      )} em gastos fixos e ${formatCurrency(
        variableExpenses
      )} em gastos variáveis. A previsão total do mês ficou em ${formatCurrency(
        projectedMonthlyExpenses
      )}.`,
      icon: BarChart3,
      color: "text-indigo-500",
      priority: "medium",
    },

    {
      title: "Meta mensal de economia",
      message:
        monthlySavingsPercentage >= 100
          ? `Meta batida. Você reservou ${formatCurrency(
            reservedAmount
          )}, atingindo ${monthlySavingsPercentage.toFixed(
            1
          )}% da meta mensal de ${formatCurrency(
            goals.monthlySavingsGoal
          )}.`
          : `Você reservou ${formatCurrency(
            reservedAmount
          )} de uma meta mensal de ${formatCurrency(
            goals.monthlySavingsGoal
          )}. Faltam ${formatCurrency(
            Math.max(goals.monthlySavingsGoal - reservedAmount, 0)
          )}.`,
      icon: Target,
      color: "text-emerald-500",
      priority: monthlySavingsPercentage >= 100 ? "low" : "medium",
    },

    {
      title: "Meta de reserva",
      message: `Sua reserva atual representa ${reserveGoalPercentage.toFixed(
        1
      )}% da meta de ${formatCurrency(
        goals.reserveGoal
      )}. Esse indicador mostra o avanço da sua proteção financeira.`,
      icon: PiggyBank,
      color: "text-green-500",
      priority: reserveGoalPercentage >= 100 ? "low" : "medium",
    },

    {
      title: "Limite por categoria",
      message:
        categoryLimitPercentage > 100
          ? `${goals.categoryLimitName} ultrapassou o limite definido. Você gastou ${formatCurrency(
            monitoredCategorySpent
          )} de um teto de ${formatCurrency(goals.categoryLimitValue)}.`
          : `${goals.categoryLimitName} está em ${categoryLimitPercentage.toFixed(
            1
          )}% do limite definido. Gasto atual: ${formatCurrency(
            monitoredCategorySpent
          )}.`,
      icon: BarChart3,
      color: "text-indigo-500",
      priority: categoryLimitPercentage > 100 ? "high" : "low",
    },

    {
      title: "Análise temporal",
      message:
        isTestScenario
          ? "A análise temporal está em modo cauteloso, pois muitos lançamentos foram feitos no mesmo dia."
          : previousWeekRealExpenses > 0
            ? weeklyChangePercentage > 0
              ? `Nesta semana, seus gastos estão ${weeklyChangePercentage.toFixed(
                1
              )}% maiores que na semana anterior.`
              : `Nesta semana, seus gastos estão ${Math.abs(
                weeklyChangePercentage
              ).toFixed(1)}% menores que na semana anterior.`
            : "Ainda não há dados suficientes da semana anterior para comparação temporal.",
      icon: TrendingUp,
      color: "text-cyan-500",
      priority: weeklyChangePercentage > 25 ? "high" : "medium",
    },

    {
      title: "Hoje seu padrão mudou",
      message: getPatternChangeMessage(),
      icon: Sparkles,
      color: "text-purple-500",
      priority: isTestScenario ? "medium" : "high",
    },

    {
      title: "Maior categoria de gasto",
      message: topCategory
        ? `Sua maior despesa está em ${topCategory[0]}, totalizando ${formatCurrency(
          topCategory[1]
        )}. Essa informação ajuda a identificar onde seu dinheiro está mais concentrado.`
        : "Ainda não há categorias suficientes para análise.",
      icon: AlertTriangle,
      color: "text-orange-500",
      priority: "medium",
    },

    {
      title: "Sugestão inteligente",
      message: getSmartSuggestion(),
      icon: Lightbulb,
      color: "text-yellow-500",
      priority: "medium",
    },

    {
      title: "Potencial de reserva",
      message:
        balance > 0
          ? `Você já reservou ${formatCurrency(
            reservedAmount
          )}. Ainda poderia separar mais ${formatCurrency(
            suggestedReserve
          )} ou manter esse valor como margem de segurança.`
          : "No momento não há margem positiva para ampliar sua reserva.",
      icon: ShieldCheck,
      color: "text-green-500",
      priority: "medium",
    },

    {
      title: "Leitura comportamental",
      message: getBehaviorAnalysis(),
      icon: TrendingUp,
      color: "text-blue-500",
      priority: "medium",
    },

    {
      title: "Personalidade da IA",
      message: getPersonalityMessage(),
      icon: Sparkles,
      color: "text-violet-500",
      priority: "low",
    },

    {
      title: "Histórico de comportamento",
      message: previousPattern
        ? `Último score salvo: ${previousPattern.score ?? 0
        }/100. A IA usa esse histórico para comparar mudanças no seu padrão financeiro.`
        : "Ainda não existe histórico salvo. A partir dos próximos registros, a IA poderá comparar sua evolução.",
      icon: History,
      color: "text-slate-500",
      priority: "low",
    },
  ].sort((a, b) => {
    const priorityWeight: Record<InsightPriority, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return (
      priorityWeight[b.priority as InsightPriority] -
      priorityWeight[a.priority as InsightPriority]
    );
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsight((prev) =>
        prev === insights.length - 1 ? 0 : prev + 1
      );
    }, 20000);

    return () => clearInterval(interval);
  }, [insights.length, autoPlayResetKey]);

  useEffect(() => {
    if (currentInsight > insights.length - 1) {
      setCurrentInsight(0);
    }
  }, [currentInsight, insights.length]);

  const activeInsight = insights[currentInsight];
  const ActiveIcon = activeInsight.icon;

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Assistente Financeiro IA
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Metas, previsão inteligente, comportamento e análise temporal.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            className="rounded-lg border bg-background p-2 text-muted-foreground transition hover:bg-primary/5 hover:text-primary"
            aria-label="Configurar IA financeira"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showSettings && (
          <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Meta de reserva
                </label>
                <input
                  type="number"
                  value={goals.reserveGoal}
                  onChange={(event) =>
                    setGoals((prev) => ({
                      ...prev,
                      reserveGoal: Number(event.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Economia mensal
                </label>
                <input
                  type="number"
                  value={goals.monthlySavingsGoal}
                  onChange={(event) =>
                    setGoals((prev) => ({
                      ...prev,
                      monthlySavingsGoal: Number(event.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Categoria monitorada
                </label>
                <input
                  type="text"
                  value={goals.categoryLimitName}
                  onChange={(event) =>
                    setGoals((prev) => ({
                      ...prev,
                      categoryLimitName: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Limite da categoria
                </label>
                <input
                  type="number"
                  value={goals.categoryLimitValue}
                  onChange={(event) =>
                    setGoals((prev) => ({
                      ...prev,
                      categoryLimitValue: Number(event.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Personalidade da IA
              </p>

              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                {(["equilibrada", "conservadora", "agressiva", "premium"] as AssistantPersonality[]).map(
                  (personality) => (
                    <button
                      key={personality}
                      type="button"
                      onClick={() =>
                        setGoals((prev) => ({
                          ...prev,
                          personality,
                        }))
                      }
                      className={`rounded-lg border px-3 py-2 text-sm capitalize transition ${goals.personality === personality
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-primary/5"
                        }`}
                    >
                      {personality}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-primary/5 p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <h3 className="font-semibold">{analysis.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {analysis.message}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={metricCardClass}>
            <p className="text-sm text-muted-foreground">
              Score financeiro
            </p>

            <div className="flex items-center gap-3 mt-1">
              <p className="text-2xl font-bold">
                {score}/100
              </p>

              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${healthBadge.className}`}
              >
                {healthBadge.label}
              </span>
            </div>
          </div>

          <div className={metricCardClass}>
            <p className="text-sm text-muted-foreground">
              Gastos reais da renda
            </p>
            <p className="text-2xl font-bold">
              {realExpensePercentage.toFixed(1)}%
            </p>
          </div>

          <div className={metricCardClass}>
            <p className="text-sm text-muted-foreground">Reserva já feita</p>
            <p className="text-2xl font-bold">
              {formatCurrency(reservedAmount)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${metricCardClass} bg-background/70`}>
            <p className="text-sm text-muted-foreground">
              Estimativa total de gastos
            </p>
            <p className="text-xl font-bold">
              {formatCurrency(projectedMonthlyExpenses)}
            </p>
          </div>

          <div className={`${metricCardClass} bg-background/70`}>
            <p className="text-sm text-muted-foreground">Saldo previsto</p>
            <p className="text-xl font-bold">
              {formatCurrency(projectedFinalBalance)}
            </p>
          </div>

          <div className={`${metricCardClass} bg-background/70`}>
            <p className="text-sm text-muted-foreground">Meta mensal</p>
            <p className="text-xl font-bold">
              {monthlySavingsPercentage >= 100
                ? "Concluída"
                : `${monthlySavingsPercentage.toFixed(1)}%`}
            </p>
          </div>
        </div>

        {isTestScenario && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-start gap-3">
              <FlaskConical className="mt-0.5 h-5 w-5 text-violet-600" />
              <div>
                <p className="font-semibold text-violet-700">
                  Modo de testes detectado
                </p>
                <p className="text-sm text-violet-700/80 mt-1">
                  Muitas movimentações foram registradas hoje. A IA continuará
                  funcionando, mas vai interpretar previsões temporais com mais
                  cautela.
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          className="relative rounded-xl border bg-gradient-to-br from-background to-primary/5 p-5 transition-all duration-500 ease-in-out cursor-grab active:cursor-grabbing select-none shadow-sm"
          onPointerDown={(event) => {
            dragStartX.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (dragStartX.current === null) return;

            const dragDistance = event.clientX - dragStartX.current;
            const minimumDrag = 60;

            if (dragDistance > minimumDrag) {
              setCurrentInsight((prev) =>
                prev === 0 ? insights.length - 1 : prev - 1
              );
              setAutoPlayResetKey((prev) => prev + 1);
            }

            if (dragDistance < -minimumDrag) {
              setCurrentInsight((prev) =>
                prev === insights.length - 1 ? 0 : prev + 1
              );
              setAutoPlayResetKey((prev) => prev + 1);
            }

            dragStartX.current = null;
          }}
          onPointerLeave={() => {
            dragStartX.current = null;
          }}
        >
          <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
            {currentInsight + 1}/{insights.length}
          </span>

          <div
            key={currentInsight}
            className="flex items-start gap-4 pr-14 animate-in fade-in slide-in-from-right-3 duration-500"
          >
            <div
              className={`rounded-xl p-3 ${activeInsight.color} bg-background border`}
            >
              <ActiveIcon className="h-6 w-6" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{activeInsight.title}</p>

                {activeInsight.priority === "high" && (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
                    Prioridade
                  </span>
                )}
              </div>

              <p className="text-base text-muted-foreground mt-2 leading-relaxed">
                {activeInsight.message}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1">
            {insights.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setCurrentInsight(index);
                  setAutoPlayResetKey((prev) => prev + 1);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${currentInsight === index
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30"
                  }`}
                aria-label={`Ir para insight ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};