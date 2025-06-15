"use client";

import React from 'react';
import { CuratorMasterManagement } from '@workspace/ui/components/shared';

const MasterManagementPage: React.FC = () => {
  return <CuratorMasterManagement userRole="curator" />;
};

export default MasterManagementPage;