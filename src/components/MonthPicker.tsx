import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  value: string; // Formato "YYYY-MM"
  onChange: (value: string) => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse do valor "YYYY-MM"
  const [yearStr, monthStr] = value.split("-");
  const currentYear = parseInt(yearStr, 10) || new Date().getFullYear();
  const currentMonthIdx = (parseInt(monthStr, 10) || 1) - 1; // 0-indexed
  
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Atualiza o ano selecionado no estado local se o valor mudar externamente
  useEffect(() => {
    const [yStr] = value.split("-");
    const y = parseInt(yStr, 10);
    if (!isNaN(y)) {
      setSelectedYear(y);
    }
  }, [value]);

  const handlePrevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedYear((prev) => prev - 1);
  };

  const handleNextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedYear((prev) => prev + 1);
  };

  const handleSelectMonth = (monthIdx: number) => {
    const monthString = String(monthIdx + 1).padStart(2, "0");
    const newValue = `${selectedYear}-${monthString}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const selectedMonthName = MONTHS[currentMonthIdx] || "";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[190px] justify-between text-left font-normal border-input hover:border-primary/50 transition-all shadow-sm h-10 px-3"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-4 w-4 text-primary" />
            {selectedMonthName} de {currentYear}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            type="button"
            onClick={handlePrevYear}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm">{selectedYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            type="button"
            onClick={handleNextYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((month, idx) => {
            const isSelected = currentYear === selectedYear && idx === currentMonthIdx;
            return (
              <Button
                key={month}
                variant={isSelected ? "default" : "ghost"}
                type="button"
                className={cn(
                  "h-8 text-xs font-medium px-1",
                  isSelected
                    ? "bg-primary text-primary-foreground hover:bg-primary/95"
                    : "hover:bg-primary/10 hover:text-primary"
                )}
                onClick={() => handleSelectMonth(idx)}
              >
                {month.substring(0, 3)}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
