"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { 
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { MasterWorkloadManagement } from '../master-workload/MasterWorkloadManagement';

interface WorkloadDistributionProps {
  userRole: 'curator' | 'super-admin';
}

const WorkloadDistributionManagement: React.FC<WorkloadDistributionProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Небольшая задержка для плавной загрузки
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Нагрузка мастеров</h1>
        <p className="text-muted-foreground">
          Анализ рабочей нагрузки и доступности мастеров
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Анализ рабочей нагрузки</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MasterWorkloadManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkloadDistributionManagement;
