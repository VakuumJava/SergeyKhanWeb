import React, { useEffect, useState } from "react"
import axios from "axios"
import { API } from "@shared/constants/constants"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/ui"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui"

const ITEMS_PER_PAGE = 4

interface HistoryPaymentsProps {
  userId: string | null
}

type BalanceLog = {
  id: number
  action: string
  amount: string
  created_at: string
}

export function HistoryPayments({ userId }: HistoryPaymentsProps) {
  const [logs, setLogs] = useState<BalanceLog[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token || !userId) return

    axios
        .get<BalanceLog[]>(`${API}/balance/${userId}/logs/`, {
          headers: { Authorization: `Token ${token}` },
        })
        .then((res) => setLogs(res.data))
        .catch((err) => console.error("Не удалось загрузить логи баланса:", err))
  }, [userId])

  if (logs.length === 0) {
    return <p className="text-center text-gray-500 mt-4">Логи отсутствуют</p>
  }

  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE)
  const displayedLogs = logs.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  )

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  return (
      <div className="h-full flex flex-col">
        <div className="overflow-y-auto flex-grow">
          <Table>
            <TableHeader>
              <TableRow className="h-12">
                <TableHead>Дата</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedLogs.map((log) => (
                  <TableRow key={log.id} className="h-12">
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-right">{log.amount}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="p-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
              </PaginationItem>

              {[...Array(totalPages)].map((_, idx) => (
                  <PaginationItem key={idx}>
                    <PaginationLink
                        isActive={currentPage === idx + 1}
                        onClick={() => handlePageChange(idx + 1)}
                    >
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
  )
}
