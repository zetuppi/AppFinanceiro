import { Expense } from "@/components/ExpenseForm";

export const generateDemoSeed = (): Expense[] => {
  const months = ["2026-01", "2026-02", "2026-03", "2026-04"];

  const randomBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const expenses: Expense[] = [];

  months.forEach((month) => {
    const samaraIncome = randomBetween(10000, 15000);
    const lucasIncome = randomBetween(2000, 5000);

    expenses.push(
      {
        id: `seed-${month}-income-samara`,
        description: "Receita Samara",
        amount: samaraIncome,
        category: "Outros",
        date: `${month}-05`,
        type: "income",
      },
      {
        id: `seed-${month}-income-lucas`,
        description: "Receita Lucas",
        amount: lucasIncome,
        category: "Outros",
        date: `${month}-05`,
        type: "income",
      },

      {
        id: `seed-${month}-aluguel`,
        description: "Aluguel",
        amount: randomBetween(1800, 2600),
        category: "Aluguel",
        date: `${month}-10`,
        type: "expense",
      },
      {
        id: `seed-${month}-cartao`,
        description: "Pagamento do cartão",
        amount: randomBetween(1800, 4200),
        category: "Cartão de Crédito",
        date: `${month}-10`,
        type: "expense",
      },
      {
        id: `seed-${month}-contas`,
        description: "Contas da casa",
        amount: randomBetween(450, 900),
        category: "Contas",
        date: `${month}-10`,
        type: "expense",
      },
      {
        id: `seed-${month}-condominio`,
        description: "Condomínio",
        amount: randomBetween(500, 900),
        category: "Condominio",
        date: `${month}-10`,
        type: "expense",
      },
      {
        id: `seed-${month}-assinaturas`,
        description: "Assinaturas digitais",
        amount: randomBetween(80, 220),
        category: "Assinaturas",
        date: `${month}-10`,
        type: "expense",
      }
    );

    const variableExpenses = [
      ["Mercado", "Compras de mercado", 350, 900],
      ["Alimentação", "Restaurantes e lanches", 120, 550],
      ["Transporte (Uber/99)", "Uber e 99", 80, 420],
      ["Lazer", "Passeios e lazer", 150, 800],
      ["Saúde", "Farmácia e saúde", 80, 400],
      ["Roupas", "Compras de roupas", 150, 700],
      ["Cursos", "Curso ou material de estudo", 80, 350],
      ["Viagens", "Viagem ou passeio", 300, 1500],
      ["Outros", "Gastos diversos", 80, 400],
      ["Investimentos", "Investimento mensal", 300, 1500],
      ["Reserva financeira", "Reserva do mês", 500, 2500],
    ];

    variableExpenses.forEach(([category, description, min, max], index) => {
      const day = String(randomBetween(11, 28)).padStart(2, "0");

      expenses.push({
        id: `seed-${month}-${category}-${index}`,
        description: description as string,
        amount: randomBetween(min as number, max as number),
        category: category as string,
        date: `${month}-${day}`,
        type: "expense",
      });
    });
  });

  return expenses;
};