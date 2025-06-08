import CallForm from '@/components/call/form'
import AdminCallPanel from '@/components/call/admin-panel-themed'
import React from 'react'

const page = () => {
  return (
    <div className='w-full'>
        {/* Используем улучшенную административную панель */}
        <AdminCallPanel />
        
        {/* Оригинальная форма звонков доступна для отладки */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Отладочная форма звонков (для тестирования)
          </h3>
          <CallForm />
        </div>
    </div>
  )
}

export default page