import React from 'react';
import Calendar from "@/components/calendar/components/Calendar";

const CalendarPage = () => {
  return (
    <div className="Calendar">
      <div className="container mt-8 flex flex-col gap-14">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>
        <Calendar userRole="master"/>
      </div>
    </div>
  );
};

export default CalendarPage;