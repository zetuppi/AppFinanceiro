import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "expense" | "income";
}

interface ExpenseFormProps {
  onAddExpense: (expense: Expense) => void;
}

const categories = [
  "Alimentação",
  "Aluguel",
  "Assinaturas",
  "Cartão de Crédito",
  "Contas",
  "Condominio",
  "Cursos",
  "Dívidas",
  "Investimentos",
  "Lazer",
  "Mercado",
  "Outros",
  "Reserva financeira",
  "Roupas",
  "Saúde",
  "Transporte (Uber/99)",
  "Viagens",
];

const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

export const ExpenseForm = ({ onAddExpense }: ExpenseFormProps) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [type, setType] = useState<"expense" | "income">("expense");

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !date || (type === "expense" && !category)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos necessários",
        variant: "destructive",
      });

      return;
    }

    const selectedDate = new Date(`${date}T12:00:00`);

    const newExpense: Expense = {
      id: Date.now().toString(),
      description,
      amount: parseFloat(amount),
      category: type === "income" ? "Receita" : category,
      date: selectedDate.toISOString(),
      type,
    };

    console.log("Nova transação criada:", newExpense);

    onAddExpense(newExpense);

    setDescription("");
    setAmount("");

    toast({
      title: "Sucesso!",
      description: `${
        type === "expense" ? "Despesa" : "Receita"
      } registrada com sucesso`,
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Nova Transação
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>

            <Select
              value={type}
              onValueChange={(value: "expense" | "income") => {
                setType(value);
                setCategory("");
              }}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>

            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === "expense" ? "Ex: Almoço no restaurante" : "Ex: Salário Lucas"
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>

            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data da transação</Label>

            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {type === "expense" && (
            <div className="space-y-2">
              <Label>Categoria</Label>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={category === cat ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};