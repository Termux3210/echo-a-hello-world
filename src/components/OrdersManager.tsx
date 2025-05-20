
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { useOrders } from "@/hooks/useSupabaseData";
import { formatCurrency } from "@/lib/utils";
import { Search, Filter } from "lucide-react";

export function OrdersManager() {
  const { data: orders, isLoading } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Status options for the filter
  const statusOptions = [
    { value: "all", label: "Все статусы" },
    { value: "pending", label: "В ожидании" },
    { value: "processing", label: "В обработке" },
    { value: "delivering", label: "Доставляется" },
    { value: "completed", label: "Выполнен" },
    { value: "cancelled", label: "Отменён" },
  ];

  // Calculate total amount for an order from the items
  const calculateOrderTotal = (order: any): number => {
    if (!order.items || !Array.isArray(order.items)) return 0;
    
    return order.items.reduce((total, item: any) => {
      const itemPrice = item.price || 0;
      const quantity = item.quantity || 0;
      return total + (itemPrice * quantity);
    }, 0);
  };

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter(order => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.telegram_username?.toLowerCase().includes(searchLower) ||
        order.id?.toString().includes(searchTerm) ||
        order.phone?.includes(searchTerm)
      );
    });
  }, [orders, statusFilter, searchTerm]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredOrders.length) return { count: 0, sum: 0 };
    
    return filteredOrders.reduce((acc, order) => ({
      count: acc.count + 1,
      sum: acc.sum + calculateOrderTotal(order)
    }), { count: 0, sum: 0 });
  }, [filteredOrders]);

  return (
    <div className="space-y-4">
      {/* Summary Cards - Moved to top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Всего заказов</div>
            <div className="text-2xl font-bold">{totals.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Общая сумма</div>
            <div className="text-2xl font-bold">{formatCurrency(totals.sum)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по ID, имени, телеграму или телефону..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full md:w-[200px]">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Статус заказа" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <DataTable
            data={filteredOrders}
            columns={[
              {
                header: "ID",
                accessorKey: "id",
              },
              {
                header: "Клиент",
                accessorKey: "customer_name",
                cell: ({ row }) => (
                  <div>
                    <div>{row.original.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {row.original.telegram_username}
                    </div>
                  </div>
                ),
              },
              {
                header: "Статус",
                accessorKey: "status",
                cell: ({ row }) => {
                  const status = row.original.status;
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case "pending": return "bg-yellow-100 text-yellow-800";
                      case "processing": return "bg-blue-100 text-blue-800";
                      case "delivering": return "bg-purple-100 text-purple-800";
                      case "completed": return "bg-green-100 text-green-800";
                      case "cancelled": return "bg-red-100 text-red-800";
                      default: return "bg-gray-100 text-gray-800";
                    }
                  };
                  
                  const getStatusText = (status: string) => {
                    switch (status) {
                      case "pending": return "В ожидании";
                      case "processing": return "В обработке";
                      case "delivering": return "Доставляется";
                      case "completed": return "Выполнен";
                      case "cancelled": return "Отменён";
                      default: return status;
                    }
                  };
                  
                  return (
                    <Badge className={getStatusColor(status)}>
                      {getStatusText(status)}
                    </Badge>
                  );
                },
              },
              {
                header: "Сумма",
                accessorKey: "items",
                cell: ({ row }) => formatCurrency(calculateOrderTotal(row.original)),
              },
              {
                header: "Дата",
                accessorKey: "created_at",
                cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('ru-RU'),
              },
            ]}
            onRowClick={(row) => setSelectedOrder(row.original)}
          />
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
}

export default OrdersManager;
