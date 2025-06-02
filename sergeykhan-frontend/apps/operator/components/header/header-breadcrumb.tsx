"use client"

import React, { useEffect, useState } from 'react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { usePathname } from 'next/navigation'

interface breadcrumbListT {
    name: string
    href: string
}
  
const HeaderBreadcrumb = () => {
    const paths = usePathname()
    const [list, setList] = useState<breadcrumbListT[]>([])

    useEffect(() => {
        const updatedList: breadcrumbListT[] = paths
            .split('/')
            .filter((x) => x)
            .map(x => ({
                name: x,
                href: `/${x}`
            }))
        setList(updatedList)
    }, [paths])

    if (list.length === 0) return null

    return (
        <Breadcrumb>
            <BreadcrumbList>
            {list.map((item, index) => (
                <BreadcrumbItem key={item.name}>
                {
                    index < list.length - 1 ? (
                        <BreadcrumbLink href={item.href}>
                            {item.name}
                        </BreadcrumbLink>
                    ) : <BreadcrumbPage>{item.name}</BreadcrumbPage>
                }
                </BreadcrumbItem>
            )).flatMap((num, index, array) => 
                index < array.length - 1 ? [num, <BreadcrumbSeparator key={index} />] : [num]
            )}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export default HeaderBreadcrumb