"use client";

import React from 'react';
import { WorkScheduleTable } from '@workspace/ui/components/shared/work-schedule';
import { 
  Calendar
} from 'lucide-react';

interface MasterScheduleManagementProps {
  masterId?: number;
}

export const MasterScheduleManagement: React.FC<MasterScheduleManagementProps> = ({ masterId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Мое рабочее расписание</h1>
      </div>
      
      <WorkScheduleTable 
        userRole="master" 
        masterId={masterId}
      />
    </div>
  );
};
