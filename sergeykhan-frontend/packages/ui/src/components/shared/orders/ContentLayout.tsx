import { ContentLayoutBg } from '@workspace/ui/components/shared/constants/orders'
import React from 'react'

const ContentLayout = (params: { title: React.ReactNode | string, children: React.ReactNode, footer?: React.ReactNode | string, bg?: ContentLayoutBg}) => {
  const { title, children, footer, bg = ContentLayoutBg.Black } = params
  return (
    <div className='max-w-[calc(100vw-theme(space.8))] w-full'>
      <h1 className={`${bg == ContentLayoutBg.Black ? "mb-4" : "mb-0"} text-xl md:text-2xl font-bold`}>{title}</h1>
      <div className={`rounded-sm w-full ${bg === ContentLayoutBg.Transperent ? 'bg-transparent px-0 py-2' : 'bg-gray-50 dark:bg-[#18181b] p-4'}`}>
        <div className={`rounded ${bg === ContentLayoutBg.Transperent ? 'px-0 bg-transparent' : 'px-3 bg-white dark:bg-black'}`}>
          {children}
        </div>
        {
          footer && <div className={`${bg == ContentLayoutBg.Black ? "mb-4" : "mb-0"}`}>
            {footer}
          </div>
        }
      </div>
    </div>
  )
}

export default ContentLayout