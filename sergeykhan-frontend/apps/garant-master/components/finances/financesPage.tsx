'use client'
import React, {useState} from 'react';
import {Component} from "@/components/finances/chart/myChart";
import {HistoryPayments} from "@/components/finances/chartFinances/historyPayments";

const FinancesPage = () => {
  const [isVisible] = useState(true);
  const balance = 1000;
  const currency = '₽';

  return (
    <div className="w-full container">
      <div className="">
        <div className="flex items-center flex-col justify-center gap-14">
          <div className="flex items-center justify-center flex-col">

            <h1 className="text-2xl text-gray-400">
              Ваш баланс
            </h1>
            <span className="text-5xl font-bold">{balance} {currency}</span>
          </div>
          {/*<div className="w-full">*/}
          {/*  <Component visible={isVisible}/>*/}

          {/*</div>*/}
          <div className="w-[80%]">
            <Component visible={isVisible}/>

          </div>
          <div className="w-full">
            <HistoryPayments/>
          </div>
        </div>

      </div>

    </div>
  );
};

export default FinancesPage;