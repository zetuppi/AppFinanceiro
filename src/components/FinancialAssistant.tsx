import { Expense } from "@/components/ExpenseForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  FlaskConical,
  History,
  Info,
  Lightbulb,
  PiggyBank,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

    if (goals.personality === "conservadora") {
      // Conservadora: severo com falta de reservas e saldo negativo, preza estabilidade absoluta
      if (balance < 0) score -= 40;
      if (realExpensePercentage > 80) score -= 30;
      else if (realExpensePercentage > 60) score -= 20;
      else if (realExpensePercentage > 45) score -= 10;

      if (reservedAmount === 0) score -= 25;
      if (projectedFinalBalance < 0) score -= 30;
      if (categoryLimitPercentage > 100) score -= 10;
      if (weeklyChangePercentage > 20) score -= 10;
    } else if (goals.personality === "agressiva") {
      // Agressiva: foco agressivo em poupar e cortar gastos de consumo
      if (balance < 0) score -= 30;
      if (realExpensePercentage > 70) score -= 35;
      else if (realExpensePercentage > 55) score -= 25;
      else if (realExpensePercentage > 40) score -= 15;

      if (reservedAmount === 0) score -= 20;
      if (projectedFinalBalance < 0) score -= 20;
      if (categoryLimitPercentage > 100) score -= 20; // Punição severa para limite estourado
      if (weeklyChangePercentage > 15) score -= 15; // Punição por desvio de consumo semanal
    } else if (goals.personality === "premium") {
      // Premium: foco em eficiência de capital, fluxo de caixa livre e governança
      if (balance < 0) score -= 35;
      if (realExpensePercentage > 85) score -= 25;
      else if (realExpensePercentage > 65) score -= 15;
      else if (realExpensePercentage > 50) score -= 8;

      if (reservedAmount === 0) score -= 15;
      if (projectedFinalBalance < 0) score -= 25;
      if (categoryLimitPercentage > 100) score -= 15;
      if (weeklyChangePercentage > 25) score -= 10;
    } else {
      // Equilibrada (original)
      if (balance < 0) score -= 30;
      if (realExpensePercentage > 90) score -= 30;
      else if (realExpensePercentage > 70) score -= 20;
      else if (realExpensePercentage > 50) score -= 10;

      if (reservedAmount === 0) score -= 15;
      if (projectedFinalBalance < 0) score -= 20;
      if (categoryLimitPercentage > 100) score -= 10;
      if (weeklyChangePercentage > 30) score -= 8;
    }

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

  const getPersonalityCardBorder = () => {
    if (goals.personality === "conservadora") return "hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-blue-500/5";
    if (goals.personality === "agressiva") return "hover:border-amber-300 dark:hover:border-amber-800 hover:shadow-amber-500/5";
    if (goals.personality === "premium") return "hover:border-violet-300 dark:hover:border-violet-800 hover:shadow-violet-500/5";
    return "hover:border-primary/50 hover:shadow-primary/5";
  };

  const metricCardClass = `rounded-xl border p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 bg-card text-card-foreground ${getPersonalityCardBorder()}`;

  // Speech helpers for dynamic AI insights (slides 1 to 14)
  const getTestScenarioMessage = () => {
    const p = goals.personality;
    if (p === "conservadora") {
      return "Modo de simulação identificado. A IA conservadora alerta que dados concentrados reduzem a precisão das estimativas de risco e do fluxo de caixa.";
    }
    if (p === "agressiva") {
      return "Detectamos múltiplos lançamentos simultâneos. Ajustando algoritmos para desconsiderar picos artificiais e focar em despesas reais.";
    }
    if (p === "premium") {
      return "Ambiente de teste detectado. A IA premium recalibrou os modelos analíticos para evitar ruídos de transações simultâneas na projeção financeira.";
    }
    return "Muitas movimentações foram registradas no mesmo dia. A IA entende que isso pode ser uma simulação e avisa que previsões temporais podem ficar distorcidas.";
  };

  const getForecastCompositionMessage = () => {
    const p = goals.personality;
    const fixedStr = formatCurrency(fixedExpenses);
    const varStr = formatCurrency(variableExpenses);
    const totalStr = formatCurrency(projectedMonthlyExpenses);
    
    if (p === "conservadora") {
      return `Mapeamento de despesas: gastos fixos em ${fixedStr} e despesas variáveis estimadas em ${varStr}. O custo total projetado de ${totalStr} exige cautela e rígido controle de caixa.`;
    }
    if (p === "agressiva") {
      return `Análise de custos: fixos somam ${fixedStr} e variáveis ${varStr}. A estimativa final é de ${totalStr}. A IA agressiva sugere cortar os itens variáveis imediatamente.`;
    }
    if (p === "premium") {
      return `Estrutura de OPEX: despesas fixas consolidadas em ${fixedStr} e despesas variáveis estimadas em ${varStr}. Projeção total de saídas: ${totalStr}.`;
    }
    return `Até agora, a IA identificou ${fixedStr} em gastos fixos e ${varStr} em gastos variáveis. A previsão total do mês ficou em ${totalStr}.`;
  };

  const getSavingsGoalMessage = () => {
    const p = goals.personality;
    const rem = Math.max(goals.monthlySavingsGoal - reservedAmount, 0);
    const remStr = formatCurrency(rem);
    const resStr = formatCurrency(reservedAmount);
    const targetStr = formatCurrency(goals.monthlySavingsGoal);
    const pctStr = monthlySavingsPercentage.toFixed(1);
    const isMet = monthlySavingsPercentage >= 100;
    
    if (p === "conservadora") {
      return isMet
        ? `Meta de proteção atingida com sucesso! Reserva de ${resStr} consolidada (${pctStr}%). Seu colchão financeiro está seguro contra imprevistos.`
        : `Reserva parcial de ${resStr}. Ainda faltam ${remStr} para atingir sua meta de proteção e assegurar a estabilidade do seu caixa.`;
    }
    if (p === "agressiva") {
      return isMet
        ? `Meta mensal de poupança superada! ${resStr} economizados (${pctStr}%). Excelente performance de redução de desperdício.`
        : `Apenas ${pctStr}% da meta de economia atingida. Faltam ${remStr}. Aperte o orçamento para buscar o alvo estabelecido.`;
    }
    if (p === "premium") {
      return isMet
        ? `Alocação de capital concluída. ${resStr} direcionados para ativos de reserva, atingindo ${pctStr}% do target de eficiência.`
        : `Target de eficiência pendente. Alocação atual: ${resStr} de ${targetStr}. Recomenda-se aporte complementar de ${remStr}.`;
    }
    return isMet
      ? `Meta batida. Você reservou ${resStr}, atingindo ${pctStr}% da meta mensal de ${targetStr}.`
      : `Você reservou ${resStr} de uma meta mensal de ${targetStr}. Faltam ${remStr}.`;
  };

  const getReserveGoalMessage = () => {
    const p = goals.personality;
    const pctStr = reserveGoalPercentage.toFixed(1);
    const targetStr = formatCurrency(goals.reserveGoal);
    
    if (p === "conservadora") {
      return `Fundo de reserva em ${pctStr}% da meta de ${targetStr}. Para o perfil conservador, garantir esse fundo é a máxima prioridade de segurança.`;
    }
    if (p === "agressiva") {
      return `Seu colchão de aporte atingiu ${pctStr}% do total de ${targetStr}. Acelere os depósitos para concluir este fundo e liberar capital para investimentos.`;
    }
    if (p === "premium") {
      return `Alocação do fundo de liquidez em ${pctStr}% do target estratégico de ${targetStr}. Fluxo direcionado para a otimização de ativos.`;
    }
    return `Sua reserva atual representa ${pctStr}% da meta de ${targetStr}. Esse indicador mostra o avanço da sua proteção financeira.`;
  };

  const getCategoryLimitMessage = () => {
    const p = goals.personality;
    const spentStr = formatCurrency(monitoredCategorySpent);
    const limitStr = formatCurrency(goals.categoryLimitValue);
    const pctStr = categoryLimitPercentage.toFixed(1);
    const name = goals.categoryLimitName;
    const isExceeded = categoryLimitPercentage > 100;
    
    if (p === "conservadora") {
      return isExceeded
        ? `Alerta conservador: limite de ${name} estourado (${spentStr} gastos). Isso aumenta o risco de desequilíbrio financeiro.`
        : `Limite da categoria ${name} sob controle (${pctStr}%). Excelente comportamento para mitigar riscos de orçamento.`;
    }
    if (p === "agressiva") {
      return isExceeded
        ? `Estouro inaceitável na categoria ${name}! Gastos atingiram ${spentStr}, superando o teto de ${limitStr}. Corte imediatamente.`
        : `Consumo em ${name} está em ${pctStr}%. Mantenha a disciplina para evitar qualquer vazamento de capital.`;
    }
    if (p === "premium") {
      return isExceeded
        ? `Desvio de orçamento identificado em ${name}. Desembolso de ${spentStr} supera o budget planejado de ${limitStr}.`
        : `Aderência de budget na categoria ${name} em ${pctStr}%. Alocação operacional eficiente.`;
    }
    return isExceeded
      ? `${name} ultrapassou o limite definido. Você gastou ${spentStr} de um teto de ${limitStr}.`
      : `${name} está em ${pctStr}% do limite definido. Gasto atual: ${spentStr}.`;
  };

  const getTemporalAnalysisMessage = () => {
    const p = goals.personality;
    const changeStr = weeklyChangePercentage.toFixed(1);
    const absChangeStr = Math.abs(weeklyChangePercentage).toFixed(1);
    const isIncrease = weeklyChangePercentage > 0;
    const hasPrevious = previousWeekRealExpenses > 0;
    
    if (isTestScenario) {
      if (p === "conservadora") return "Histórico temporal sob observação devido a lançamentos atípicos ocorridos no mesmo dia.";
      if (p === "agressiva") return "Simulações de dados impedem a leitura precisa do ritmo de gastos semanais.";
      if (p === "premium") return "Análise de tendência temporariamente suspensa por volume atípico na mesma data.";
      return "A análise temporal está em modo cauteloso, pois muitos lançamentos foram feitos no mesmo dia.";
    }
    
    if (!hasPrevious) {
      return "Ainda não há dados suficientes da semana anterior para comparação temporal.";
    }
    
    if (p === "conservadora") {
      return isIncrease
        ? `Aviso: os desembolsos semanais subiram ${changeStr}%. Um perfil conservador exige frear o consumo para evitar surpresas.`
        : `Bons ventos: gastos semanais recuaram ${absChangeStr}%, fortalecendo a segurança do seu caixa contra imprevistos.`;
    }
    if (p === "agressiva") {
      return isIncrease
        ? `Ritmo inadequado: gastos semanais cresceram ${changeStr}%. É preciso restabelecer a rigidez de consumo imediatamente.`
        : `Sucesso operacional: redução de ${absChangeStr}% nos gastos semanais. Continue apertando os custos para poupar mais.`;
    }
    if (p === "premium") {
      return isIncrease
        ? `Alerta de variação: acréscimo de ${changeStr}% nas saídas semanais. Recomendamos auditoria nos centros de custo variáveis.`
        : `Melhoria de performance: retração de ${absChangeStr}% no fluxo de saídas em relação à semana anterior.`;
    }
    
    return isIncrease
      ? `Nesta semana, seus gastos estão ${changeStr}% maiores que na semana anterior.`
      : `Nesta semana, seus gastos estão ${absChangeStr}% menores que na semana anterior.`;
  };

  const getTopCategoryMessage = () => {
    const p = goals.personality;
    if (!topCategory) {
      return "Ainda não há categorias suficientes para análise.";
    }
    const name = topCategory[0];
    const amountStr = formatCurrency(topCategory[1]);
    
    if (p === "conservadora") {
      return `Risco de concentração: a categoria ${name} consome ${amountStr} do seu orçamento. Reduzir a dependência desse item trará mais estabilidade.`;
    }
    if (p === "agressiva") {
      return `Foco de ataque: ${name} é o seu maior gasto, consumindo ${amountStr}. Vá direto nesse ponto para extrair economias rápidas.`;
    }
    if (p === "premium") {
      return `Centro de custo dominante: maior desembolso localizado em ${name} (${amountStr}). Avaliar o ROI e a necessidade estratégica desse fluxo.`;
    }
    return `Sua maior despesa está em ${name}, totalizando ${amountStr}. Essa informação ajuda a identificar onde seu dinheiro está mais concentrado.`;
  };

  const getReservePotentialMessage = () => {
    const p = goals.personality;
    const resStr = formatCurrency(reservedAmount);
    const sugStr = formatCurrency(suggestedReserve);
    const hasPositiveBalance = balance > 0;
    
    if (p === "conservadora") {
      return hasPositiveBalance
        ? `Sua liquidez permite reforçar o colchão de segurança em mais ${sugStr}. Guardar este excedente é a conduta altamente recomendada.`
        : "Caixa apertado. Evite contrair novos compromissos financeiros e proteja rigorosamente as reservas existentes.";
    }
    if (p === "agressiva") {
      return hasPositiveBalance
        ? `Não deixe saldo parado! Poupe ou invista o excedente de ${sugStr} imediatamente para acelerar a multiplicação de capital.`
        : "Sem excedente para alocar. Revise rigorosamente suas despesas para reestabelecer a capacidade de poupar.";
    }
    if (p === "premium") {
      return hasPositiveBalance
        ? `Margem de capital livre de ${sugStr}. Sugere-se otimização fiscal ou alocação tática de liquidez em ativos estratégicos.`
        : "Fluxo de caixa líquido zerado. Recomendado ajustar a alocação de recursos para reaver margem operacional.";
    }
    return hasPositiveBalance
      ? `Você já reservou ${resStr}. Ainda poderia separar mais ${sugStr} ou manter esse valor como margem de segurança.`
      : "No momento não há margem positiva para ampliar sua reserva.";
  };

  const getBehaviorHistoryMessage = () => {
    const p = goals.personality;
    const lastScore = previousPattern?.score ?? 0;
    
    if (!previousPattern) {
      if (p === "conservadora") return "A IA iniciou o rastreamento de segurança. A partir das próximas ações, avaliaremos os riscos históricos.";
      if (p === "agressiva") return "Sem histórico de performance. Nos próximos períodos, mediremos sua evolução de economia.";
      if (p === "premium") return "Análise histórica em fase de coleta de dados. A série temporal de performance será iniciada em breve.";
      return "A IA começou a montar seu histórico financeiro. Conforme você registra novas movimentações, ela passa a comparar seu comportamento atual.";
    }
    
    if (p === "conservadora") {
      return `Métrica de segurança anterior registrada: ${lastScore}/100. O objetivo do perfil conservador é manter a consistência e evolução gradual desse índice.`;
    }
    if (p === "agressiva") {
      return `Último registro de performance de economia: ${lastScore}/100. Use isso como patamar mínimo a ser batido neste período.`;
    }
    if (p === "premium") {
      return `Histórico consolidado de health score: ${lastScore}/100. Analisando a série temporal para verificar desvios estruturais de longo prazo.`;
    }
    return `Último score salvo: ${lastScore}/100. A IA usa esse histórico para comparar mudanças no seu padrão financeiro.`;
  };

  // Card configuration based on personality (using static titles as requested by user)
  const getCard1Props = () => {
    const currentScore = score;
    const p = goals.personality;
    
    const title = "Score financeiro";
    let tooltip = "Pontuação de 0 a 100 que avalia sua saúde financeira. Começa em 100 e diminui conforme fatores de risco, como saldo negativo, gastos elevados ou falta de reserva.";
    let badgeLabel = "";
    let badgeClass = "";
    
    if (p === "conservadora") {
      tooltip = "Índice de resiliência e proteção sob ótica conservadora. Reduz severamente com saldo negativo, falta de reservas ou volatilidade de gastos.";
      if (currentScore >= 90) {
        badgeLabel = "Totalmente Seguro";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (currentScore >= 75) {
        badgeLabel = "Protegido";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (currentScore >= 60) {
        badgeLabel = "Vulnerável";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Risco Crítico";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else if (p === "agressiva") {
      tooltip = "Avaliação de eficiência e agressividade na economia de gastos. Exige foco extremo em corte de despesas variáveis e conformidade de limites.";
      if (currentScore >= 90) {
        badgeLabel = "Alta Performance";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (currentScore >= 75) {
        badgeLabel = "Eficiente";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (currentScore >= 60) {
        badgeLabel = "Abaixo do Potencial";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Ineficiente";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else if (p === "premium") {
      tooltip = "Métrica de saúde financeira estratégica baseada em fluxo de caixa, alocação de liquidez e sustentabilidade operacional de longo prazo.";
      if (currentScore >= 90) {
        badgeLabel = "Investment Grade";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (currentScore >= 75) {
        badgeLabel = "Otimizado";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (currentScore >= 60) {
        badgeLabel = "Subotimizado";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Risco Operacional";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else {
      const b = getHealthBadge(currentScore);
      badgeLabel = b.label;
      badgeClass = b.className;
    }
    
    return { title, tooltip, value: `${currentScore}/100`, badgeLabel, badgeClass };
  };

  const getCard2Props = () => {
    const p = goals.personality;
    const val = realExpensePercentage;
    
    const title = "Gastos reais da renda";
    let tooltip = "Percentual da sua renda comprometido com gastos reais (despesas fixas e variáveis). Reserva financeira não entra nessa conta de consumo.";
    let badgeLabel = "";
    let badgeClass = "";
    
    if (p === "conservadora") {
      tooltip = "Nível de exposição da sua receita aos gastos correntes. Um perfil conservador preza por manter esse índice o mais baixo possível.";
      if (val < 40) {
        badgeLabel = "Excelente (Seguro)";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (val < 60) {
        badgeLabel = "Sob Controle";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (val < 75) {
        badgeLabel = "Exposição Média";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Exposição Crítica";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else if (p === "agressiva") {
      tooltip = "Medida direta do que foi consumido no mês. A IA agressiva sugere combater o consumo para canalizar dinheiro em investimentos.";
      if (val < 30) {
        badgeLabel = "Consumo Mínimo (Ideal)";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (val < 50) {
        badgeLabel = "Moderado";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (val < 70) {
        badgeLabel = "Consumo Elevado";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Desperdício Alto";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else if (p === "premium") {
      tooltip = "Índice de queima de receita em atividades de consumo básico e operacional do mês atual. O objetivo é a eficiência de custos.";
      if (val < 45) {
        badgeLabel = "Burn Rate Eficiente";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (val < 65) {
        badgeLabel = "Neutro";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (val < 80) {
        badgeLabel = "Margem Estrita";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Overburn";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else {
      if (val < 50) {
        badgeLabel = "Baixo";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (val < 70) {
        badgeLabel = "Moderado";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (val < 85) {
        badgeLabel = "Alto";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Crítico";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    }
    
    return { title, tooltip, value: `${val.toFixed(1)}%`, badgeLabel, badgeClass };
  };

  const getCard3Props = () => {
    const p = goals.personality;
    const goalPct = reserveGoalPercentage;
    
    const title = "Reserva já feita";
    let tooltip = "Valor economizado no mês atual sob a categoria 'Reserva financeira'. Mostra o quanto você guardou para segurança futura.";
    let badgeLabel = "";
    let badgeClass = "";
    
    if (p === "conservadora") {
      tooltip = "Montante direcionado à reserva de emergência no período. Fundamental para suportar imprevistos sem afetar o estilo de vida.";
      if (goalPct >= 100) {
        badgeLabel = "Reserva Sólida";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (goalPct >= 50) {
        badgeLabel = "Caminho Adequado";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (goalPct > 0) {
        badgeLabel = "Insuficiente";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Zero Proteção";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else if (p === "agressiva") {
      tooltip = "Valores destinados à poupança e investimentos acumulados neste mês. A IA agressiva estimula aportes regulares e volumosos.";
      if (goalPct >= 100) {
        badgeLabel = "Aporte Batido";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (goalPct >= 60) {
        badgeLabel = "Aporte Acelerado";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (goalPct > 0) {
        badgeLabel = "Aporte Razoável";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Sem Aporte";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else if (p === "premium") {
      tooltip = "Fluxo de capital direcionado para ativos de reserva e preservação patrimonial no mês atual.";
      if (goalPct >= 100) {
        badgeLabel = "Maximizando";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (goalPct >= 50) {
        badgeLabel = "Balanceado";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (goalPct > 0) {
        badgeLabel = "Subalocado";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Zerada";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else {
      if (goalPct >= 100) {
        badgeLabel = "Meta Cumprida";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (goalPct >= 30) {
        badgeLabel = "Em Construção";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else if (goalPct > 0) {
        badgeLabel = "Inicial";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Não Iniciada";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    }
    
    return { title, tooltip, value: formatCurrency(reservedAmount), badgeLabel, badgeClass };
  };

  const getCard4Props = () => {
    const p = goals.personality;
    const est = projectedMonthlyExpenses;
    
    const title = "Estimativa total de gastos";
    let tooltip = "Projeção inteligente de quanto você terá gasto até o fim do mês, considerando despesas fixas reais e o ritmo atual de gastos variáveis.";
    let badgeLabel = "";
    let badgeClass = "";
    
    if (p === "conservadora") {
      tooltip = "Cálculo pessimista de fechamento de gastos mensais. Mapeia o risco potencial de estourar a receita projetada.";
      if (totalIncome > 0 && est <= totalIncome * 0.7) {
        badgeLabel = "Sob Controle";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (totalIncome > 0 && est <= totalIncome * 0.9) {
        badgeLabel = "Atenção Conservadora";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Risco de Estresse";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else if (p === "agressiva") {
      tooltip = "Projeção linear de gastos para acompanhamento de teto de custos do mês. Ajuda a identificar excessos rapidamente.";
      if (totalIncome > 0 && est <= totalIncome * 0.6) {
        badgeLabel = "Dentro do Teto";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (totalIncome > 0 && est <= totalIncome * 0.8) {
        badgeLabel = "Teto Limite";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Excedido";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else if (p === "premium") {
      tooltip = "Previsão híbrida de despesas operacionais (gastos fixos e variáveis) do período atual sob critérios de governança financeira.";
      if (totalIncome > 0 && est <= totalIncome * 0.75) {
        badgeLabel = "OPEX Otimizado";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (totalIncome > 0 && est <= totalIncome * 0.9) {
        badgeLabel = "Atenção de Custos";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Desvio de Budget";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else {
      if (totalIncome > 0 && est <= totalIncome) {
        badgeLabel = "Dentro do Orçamento";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else {
        badgeLabel = "Estouro Previsto";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    }
    
    return { title, tooltip, value: formatCurrency(est), badgeLabel, badgeClass };
  };

  const getCard5Props = () => {
    const p = goals.personality;
    const bal = projectedFinalBalance;
    
    const title = "Saldo previsto";
    let tooltip = "Estimativa de quanto dinheiro restará no final do mês, calculando receitas menos a projeção de gastos e reserva do período.";
    let badgeLabel = "";
    let badgeClass = "";
    
    if (p === "conservadora") {
      tooltip = "Valor livre projetado após o pagamento de todas as despesas e alocação de reserva. Mede a segurança contra oscilações de fluxo.";
      if (totalIncome > 0 && bal >= totalIncome * 0.3) {
        badgeLabel = "Robusta";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (bal >= 0) {
        badgeLabel = "Margem Estrita";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Déficit Projetado";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else if (p === "agressiva") {
      tooltip = "O valor projetado excedente que deve ser poupado ou investido até o fim do mês, livre de despesas operacionais.";
      if (totalIncome > 0 && bal >= totalIncome * 0.4) {
        badgeLabel = "Alto Rendimento";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (bal >= 0) {
        badgeLabel = "Economia Média";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Estouro Crítico";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else if (p === "premium") {
      tooltip = "Fluxo de caixa livre projetado no final do mês sob ótica da IA, descontadas as previsões de investimentos e despesas.";
      if (totalIncome > 0 && bal >= totalIncome * 0.25) {
        badgeLabel = "Excedente Saudável";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (bal >= 0) {
        badgeLabel = "Liquidez Limite";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      } else {
        badgeLabel = "Fluxo Negativo";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    } else {
      if (bal >= 0) {
        badgeLabel = "Saldo Positivo";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else {
        badgeLabel = "Saldo Negativo";
        badgeClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      }
    }
    
    return { title, tooltip, value: formatCurrency(bal), badgeLabel, badgeClass };
  };

  const getCard6Props = () => {
    const p = goals.personality;
    const savPct = monthlySavingsPercentage;
    
    const title = "Meta mensal";
    let tooltip = "Progresso em direção à sua meta de economia mensal. Se você reservar o valor total estipulado nas configurações, a meta será dada como concluída.";
    let badgeLabel = "";
    let badgeClass = "";
    let displayValue = "";
    
    if (p === "conservadora") {
      tooltip = "Progresso no cumprimento do plano de proteção financeira mensal definido nas metas.";
      displayValue = savPct >= 100 ? "Concluída" : `${savPct.toFixed(1)}%`;
      if (savPct >= 100) {
        badgeLabel = "Garantida";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (savPct >= 50) {
        badgeLabel = "Parcial";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else {
        badgeLabel = "Desprotegido";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      }
    } else if (p === "agressiva") {
      tooltip = "Nível de aderência à meta de poupança estrita e economias configuradas para o período.";
      displayValue = savPct >= 100 ? "Concluída" : `${savPct.toFixed(1)}%`;
      if (savPct >= 100) {
        badgeLabel = "Performance Máxima";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (savPct >= 70) {
        badgeLabel = "Aderente";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else {
        badgeLabel = "Abaixo do Alvo";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      }
    } else if (p === "premium") {
      tooltip = "Percentual de alcance da meta de alocação configurada sob diretrizes estratégicas de rentabilidade e retenção.";
      displayValue = savPct >= 100 ? "Concluída" : `${savPct.toFixed(1)}%`;
      if (savPct >= 100) {
        badgeLabel = "Target Batido";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else if (savPct >= 50) {
        badgeLabel = "Execução Moderada";
        badgeClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      } else {
        badgeLabel = "Ajuste Requerido";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      }
    } else {
      displayValue = savPct >= 100 ? "Concluída" : `${savPct.toFixed(1)}%`;
      if (savPct >= 100) {
        badgeLabel = "Sucesso";
        badgeClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      } else {
        badgeLabel = "Pendente";
        badgeClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      }
    }
    
    return { title, tooltip, value: displayValue, badgeLabel, badgeClass };
  };

  const card1 = getCard1Props();
  const card2 = getCard2Props();
  const card3 = getCard3Props();
  const card4 = getCard4Props();
  const card5 = getCard5Props();
  const card6 = getCard6Props();

  const analysis = getFinancialAnalysis();

  const insights = [
    ...(isTestScenario
      ? [
        {
          title: "Modo de testes detectado",
          message: getTestScenarioMessage(),
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
      message: getForecastCompositionMessage(),
      icon: BarChart3,
      color: "text-indigo-500",
      priority: "medium",
    },

    {
      title: "Meta mensal de economia",
      message: getSavingsGoalMessage(),
      icon: Target,
      color: "text-emerald-500",
      priority: monthlySavingsPercentage >= 100 ? "low" : "medium",
    },

    {
      title: "Meta de reserva",
      message: getReserveGoalMessage(),
      icon: PiggyBank,
      color: "text-green-500",
      priority: reserveGoalPercentage >= 100 ? "low" : "medium",
    },

    {
      title: "Limite por categoria",
      message: getCategoryLimitMessage(),
      icon: BarChart3,
      color: "text-indigo-500",
      priority: categoryLimitPercentage > 100 ? "high" : "low",
    },

    {
      title: "Análise temporal",
      message: getTemporalAnalysisMessage(),
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
      message: getTopCategoryMessage(),
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
      message: getReservePotentialMessage(),
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
      message: getBehaviorHistoryMessage(),
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
            <div className="flex items-center justify-between gap-1 w-full mb-1">
              <span className="text-sm text-muted-foreground">
                {card1.title}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-primary transition-colors cursor-help p-0.5" aria-label={`Info ${card1.title}`}>
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs" side="top">
                  {card1.tooltip}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <p className="text-2xl font-bold">
                {card1.value}
              </p>
              {card1.badgeLabel && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${card1.badgeClass}`}>
                  {card1.badgeLabel}
                </span>
              )}
            </div>
          </div>

          <div className={metricCardClass}>
            <div className="flex items-center justify-between gap-1 w-full mb-1">
              <span className="text-sm text-muted-foreground">
                {card2.title}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-primary transition-colors cursor-help p-0.5" aria-label={`Info ${card2.title}`}>
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs" side="top">
                  {card2.tooltip}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-2xl font-bold">
                {card2.value}
              </p>
              {card2.badgeLabel && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${card2.badgeClass}`}>
                  {card2.badgeLabel}
                </span>
              )}
            </div>
          </div>

          <div className={metricCardClass}>
            <div className="flex items-center justify-between gap-1 w-full mb-1">
              <span className="text-sm text-muted-foreground">
                {card3.title}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-primary transition-colors cursor-help p-0.5" aria-label={`Info ${card3.title}`}>
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs" side="top">
                  {card3.tooltip}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-2xl font-bold">
                {card3.value}
              </p>
              {card3.badgeLabel && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${card3.badgeClass}`}>
                  {card3.badgeLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${metricCardClass} bg-background/70`}>
            <div className="flex items-center justify-between gap-1 w-full mb-1">
              <span className="text-sm text-muted-foreground">
                {card4.title}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-primary transition-colors cursor-help p-0.5" aria-label={`Info ${card4.title}`}>
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs" side="top">
                  {card4.tooltip}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xl font-bold">
                {card4.value}
              </p>
              {card4.badgeLabel && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${card4.badgeClass}`}>
                  {card4.badgeLabel}
                </span>
              )}
            </div>
          </div>

          <div className={`${metricCardClass} bg-background/70`}>
            <div className="flex items-center justify-between gap-1 w-full mb-1">
              <span className="text-sm text-muted-foreground">
                {card5.title}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-primary transition-colors cursor-help p-0.5" aria-label={`Info ${card5.title}`}>
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs" side="top">
                  {card5.tooltip}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xl font-bold">
                {card5.value}
              </p>
              {card5.badgeLabel && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${card5.badgeClass}`}>
                  {card5.badgeLabel}
                </span>
              )}
            </div>
          </div>

          <div className={`${metricCardClass} bg-background/70`}>
            <div className="flex items-center justify-between gap-1 w-full mb-1">
              <span className="text-sm text-muted-foreground">
                {card6.title}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-primary transition-colors cursor-help p-0.5" aria-label={`Info ${card6.title}`}>
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs" side="top">
                  {card6.tooltip}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xl font-bold">
                {card6.value}
              </p>
              {card6.badgeLabel && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${card6.badgeClass}`}>
                  {card6.badgeLabel}
                </span>
              )}
            </div>
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