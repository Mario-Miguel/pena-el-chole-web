import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DateSelector({ targetDate, onDateSelect, onClear }) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="bg-white border-[#630027]/20 text-[#630027] hover:bg-[#630027]/5 hover:border-[#630027]/40 rounded-xl px-6 py-5 text-base font-medium shadow-sm transition-all"
          >
            <CalendarDays className="w-5 h-5 mr-3 text-[#630027]/60" />
            {targetDate
              ? format(targetDate, "d 'de' MMMM, yyyy", { locale: es })
              : "Seleccionar fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-0" align="center">
          <Calendar
            mode="single"
            selected={targetDate}
            onSelect={onDateSelect}
            disabled={(date) => date < new Date()}
            className="rounded-2xl"
          />
        </PopoverContent>
      </Popover>

      {targetDate && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="text-[#630027]/40 hover:text-[#630027] hover:bg-[#630027]/5 rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}