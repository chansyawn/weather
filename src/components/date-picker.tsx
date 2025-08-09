"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

export const DatePicker = ({ value, onChange }: DatePickerWithRangeProps) => {
  const handleDateChange = (newDate: DateRange | undefined) => {
    onChange?.(newDate);
  };

  // 创建日期限制函数：只允许6月1日到6月11日
  const isDateDisabled = (date: Date) => {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 5, 1); // 6月1日 (月份从0开始)
    const endDate = new Date(currentYear, 5, 11); // 6月11日

    return date < startDate || date > endDate;
  };

  // 设置默认显示月份为6月
  const defaultMonth = value?.from || new Date(new Date().getFullYear(), 5, 1);

  return (
    <div className={cn("grid gap-2")}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "yyyy-MM-dd", { locale: zhCN })} -{" "}
                  {format(value.to, "yyyy-MM-dd", { locale: zhCN })}
                </>
              ) : (
                format(value.from, "yyyy-MM-dd", { locale: zhCN })
              )
            ) : (
              <span>请选择日期</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={defaultMonth}
            selected={value}
            onSelect={handleDateChange}
            numberOfMonths={1}
            disabled={isDateDisabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
