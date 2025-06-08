import React from 'react';
import { MasterCalendar } from "@workspace/ui/components/master-calendar";
import {LinearGraph} from "@/components/calendar/components/LinearGraph";
import { API } from "@shared/constants/constants";

const CalendarPage = () => {
  // Получаем ID пользователя из localStorage
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
  
  return (
    <div className="Calendar">
      <div className="container mt-8 flex flex-col gap-14">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Календарь загруженности</h1>
        </div>
        
        {/* Используем универсальный компонент календаря мастера */}
        <div className="rounded-xl border p-6">
          <MasterCalendar 
            masterId={userId ? parseInt(userId) : undefined}
            userRole="garant_master" 
            readOnly={false}
            showCreateButton={true}
            apiBaseUrl={API}
          />
        </div>

        {/*<div className="grid grid-cols-4 grid-rows-1 gap-5">*/}

        {/*  <div className="col-span-1">*/}
        {/*    <GraphCalendar/>*/}

        {/*  </div>*/}
        {/*  <div className="col-span-1">*/}
        {/*    <LinearGraph/>*/}

        {/*  </div>*/}
        {/*  <div className="col-span-2">*/}
        {/*    <GraphColumn/>*/}

        {/*  </div>*/}
        {/*</div>*/}
        <LinearGraph/>

      </div>


    </div>
  );
};

export default CalendarPage;