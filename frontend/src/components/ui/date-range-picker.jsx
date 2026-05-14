"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
  className,
  date,
  setDate,
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal border-slate-300 p-3 h-auto text-xs focus:ring-[#BFA37E]",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-[#BFA37E]" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="rounded-md border shadow-lg"
            classNames={{
              day_selected: "bg-[#0A192F] text-white hover:bg-[#0A192F] hover:text-white focus:bg-[#0A192F] focus:text-white",
              day_today: "bg-slate-100 text-[#0A192F]",
              range_start: "bg-[#0A192F] text-white rounded-l-md",
              range_end: "bg-[#0A192F] text-white rounded-r-md",
              range_middle: "bg-[#fcf8f2] text-[#665038] rounded-none",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
