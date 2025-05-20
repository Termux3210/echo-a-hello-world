
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Copy, MessageCircle, Truck } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useComplexes } from "@/hooks/useSupabaseData";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { CustomMessageModal } from "./CustomMessageModal";

// Определяем тип OrderStatus
export type OrderStatus = "pending" | "processing" | "delivering" | "completed" | "cancelled";

interface OrderTableProps {
  data: any[];
  onStatusChange?: (orderId: number, newStatus: string) => Promise<void>;
  onSelectOrders?: (orders: any[]) => void;
}

export function OrderTable({ data, onStatusChange, onSelectOrders }: OrderTableProps) {
  const isMobile = useIsMobile();
  const { data: complexesData = [] } = useComplexes();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [customMessageOrder, setCustomMessageOrder] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  
  useEffect(() => {
    if (onSelectOrders) {
      onSelectOrders(selectedRows);
    }
  }, [selectedRows, onSelectOrders]);

  const handleRowSelect = (row: any, isSelected: boolean) => {
    setSelectedRows(prev => {
      if (isSelected) {
        return [...prev, row];
      } else {
        return prev.filter(item => item.id !== row.id);
      }
    });
  };

  const toggleSelectAll = (isSelected: boolean) => {
    setSelectedRows(isSelected ? [...data] : []);
  };
  
  // Определяем столбцы для таблицы
  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="px-1">
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={(e) => toggleSelectAll(e.target.checked)}
            className="rounded border-gray-300"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-1">
          <input
            type="checkbox"
            checked={selectedRows.some(item => item.id === row.original.id)}
            onChange={(e) => handleRowSelect(row.original, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300"
          />
        </div>
      ),
    },
    {
      id: "id",
      header: "ID",
      cell: ({ row }) => <span className="font-medium text-gray-900">#{row.original.id}</span>
    },
    {
      id: "created_at",
      header: "Дата",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return <span className="text-gray-900">{date.toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric"
        })}</span>;
      }
    },
    {
      id: "user_id",
      header: "Пользователь",
      cell: ({ row }) => <span className="text-gray-900">{row.original.telegram_username || "—"}</span>
    },
    {
      id: "complex",
      header: "ЖК",
      cell: ({ row }) => {
        const complexId = row.original.residential_complex_id;
        const complex = complexId ? complexesData.find(c => c.id === complexId) : null;
        return <span className="text-gray-900">{complex ? complex.name : "—"}</span>;
      }
    },
    {
      id: "total_price",
      header: "Сумма",
      cell: ({ row }) => {
        let totalPrice = 0;
        if (row.original.items && Array.isArray(row.original.items)) {
          row.original.items.forEach((item: any) => {
            totalPrice += (item.price || 0) * item.quantity;
          });
        }
        
        if (totalPrice > 0) {
          const status = row.original.status as OrderStatus;
          const isCompleted = status === "completed";
          return (
            <span className={`font-medium ${isCompleted ? "text-green-600" : "text-gray-700"}`}>
              {totalPrice} ₽
            </span>
          );
        }
        
        return <span className="text-gray-700">—</span>;
      }
    },
    {
      id: "status",
      header: "Статус",
      cell: ({ row }) => {
        const status = row.original.status as OrderStatus;
        let badgeColor = "bg-gray-100 text-gray-800";
        let badgeText = "В ожидании";
        
        if (status === "pending") {
          badgeColor = "bg-gray-100 text-gray-800";
          badgeText = "В ожидании";
        } else if (status === "processing") {
          badgeColor = "bg-blue-100 text-blue-800";
          badgeText = "В обработке";
        } else if (status === "completed") {
          badgeColor = "bg-green-100 text-green-800";
          badgeText = "Завершен";
        } else if (status === "cancelled") {
          badgeColor = "bg-red-100 text-red-800";
          badgeText = "Отменен";
        } else if (status === "delivering") {
          badgeColor = "bg-amber-100 text-amber-800";
          badgeText = "Доставляется";
        }
        
        return (
          <Badge className={badgeColor}>
            {badgeText}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        const [isMounted, setIsMounted] = useState(false);
        
        useEffect(() => {
          setIsMounted(true);
        }, []);
        
        const copyOrderId = () => {
          navigator.clipboard.writeText(order.id.toString());
          toast.success("ID заказа скопирован");
        };
        
        const orderStatusOptions = [
          { value: "pending", label: "В ожидании" },
          { value: "processing", label: "В обработке" },
          { value: "delivering", label: "Доставляется" },
          { value: "completed", label: "Завершен" },
          { value: "cancelled", label: "Отменен" }
        ];

        const sendCustomMessage = () => {
          setCustomMessageOrder(order);
        };
        
        if (!isMounted) {
          return null;
        }
        
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Действия</DropdownMenuLabel>
                <DropdownMenuItem onClick={copyOrderId}>
                  <Copy className="mr-2 h-4 w-4" />
                  Скопировать ID
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={sendCustomMessage}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Отправить сообщение
                </DropdownMenuItem>
                
                {onStatusChange && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Изменить статус</DropdownMenuLabel>
                    {orderStatusOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => {
                          if (onStatusChange) {
                            onStatusChange(order.id, option.value);
                          }
                        }}
                        disabled={order.status === option.value}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ];
  
  const visibleColumns = isMobile 
    ? columns.filter(col => col.id !== "user_id") 
    : columns;
  
  const table = useReactTable({
    data,
    columns: visibleColumns,
    getCoreRowModel: getCoreRowModel()
  });
  
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-gray-900">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center text-gray-900"
                >
                  Заказы не найдены.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedOrder(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OrderDetailsModal 
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />

      {customMessageOrder && (
        <CustomMessageModal
          isOpen={!!customMessageOrder}
          onClose={() => setCustomMessageOrder(null)}
          orderId={customMessageOrder.id}
          telegram_user_id={customMessageOrder.telegram_user_id}
          telegram_username={customMessageOrder.telegram_username}
          defaultMessage={`Статус вашего заказа #${customMessageOrder.id} изменился на: "${
            customMessageOrder.status === "pending" ? "В ожидании" :
            customMessageOrder.status === "processing" ? "В обработке" :
            customMessageOrder.status === "delivering" ? "Доставляется" :
            customMessageOrder.status === "completed" ? "Завершен" :
            customMessageOrder.status === "cancelled" ? "Отменен" : 
            customMessageOrder.status
          }"`}
        />
      )}
    </>
  );
}
