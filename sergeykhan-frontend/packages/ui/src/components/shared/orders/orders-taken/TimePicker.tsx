"use client";

import * as React from "react";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";

export function TimePickerComponent({ value, onChangeAction }: { value: string; onChangeAction: (time: string) => void }) {
  return (
    <div className="flex items-center border rounded-md p-2 [&_.react-time-picker__wrapper]:border-none">
      <TimePicker
        onChange={(time) => onChangeAction(time ?? "")}
        value={value}
        disableClock
        format="HH:mm"
        className="!w-[150px] h-[20px] flex items-center justify-center" // Здесь меняем ширину
      />
    </div>
  );
}