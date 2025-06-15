"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const MasterWorkloadRedirectPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Перенаправляем на новую объединенную страницу
    router.replace('/workload-distribution?tab=workload');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p>Перенаправление на страницу управления нагрузкой и распределением...</p>
      </div>
    </div>
  );
};

export default MasterWorkloadRedirectPage;
