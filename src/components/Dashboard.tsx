
import { useEffect, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useOrders, useComplexes, useProducts } from "@/hooks/useSupabaseData";

// Custom tooltip for charts
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm">
        <p className="text-sm">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  // Fetch real data from Supabase
  const { data: ordersData = [] } = useOrders();
  const { data: complexesData = [] } = useComplexes();
  const { data: productsData = [] } = useProducts();
  
  // Process real data for charts
  const [statusStats, setStatusStats] = useState<{name: string; value: number}[]>([]);
  const [productStats, setProductStats] = useState<{name: string; count: number}[]>([]);
  const [complexStats, setComplexStats] = useState<{name: string; count: number}[]>([]);
  
  // Calculate real-time statistics
  useEffect(() => {
    // Calculate order status statistics
    const statusCounts = {
      processing: 0,
      delivering: 0,
      delivered: 0,
      cancelled: 0
    };
    
    ordersData.forEach(order => {
      if (statusCounts[order.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[order.status as keyof typeof statusCounts]++;
      }
    });
    
    setStatusStats([
      { name: 'В обработке', value: statusCounts.processing },
      { name: 'В доставке', value: statusCounts.delivering },
      { name: 'Доставлены', value: statusCounts.delivered },
      { name: 'Отменены', value: statusCounts.cancelled },
    ]);
    
    // Calculate product statistics
    const productCounts: Record<number, number> = {};
    
    // Only count products from completed orders
    ordersData
      .filter(order => order.status === "completed")
      .forEach(order => {
        const items = typeof order.items === 'string' 
          ? JSON.parse(order.items) 
          : order.items;
          
        items.forEach((item: any) => {
          if (!productCounts[item.productId]) {
            productCounts[item.productId] = 0;
          }
          productCounts[item.productId] += item.quantity;
        });
      });
    
    const productStatsArray = Object.entries(productCounts).map(([productId, count]) => {
      const product = productsData.find(p => p.id === parseInt(productId));
      return {
        name: product?.name || 'Неизвестный товар',
        count
      };
    });
    
    // Sort products by count and get top 5
    setProductStats(
      productStatsArray.sort((a, b) => b.count - a.count).slice(0, 5)
    );
    
    // Calculate complex statistics from real database data
    const complexCounts: Record<number, number> = {};
    
    // Only count complexes from completed orders
    ordersData
      .filter(order => order.status === "completed")
      .forEach(order => {
        if (order.residential_complex_id) {
          if (!complexCounts[order.residential_complex_id]) {
            complexCounts[order.residential_complex_id] = 0;
          }
          complexCounts[order.residential_complex_id]++;
        }
      });
    
    const complexStatsArray = Object.entries(complexCounts).map(([complexId, count]) => {
      const complex = complexesData.find(c => c.id === parseInt(complexId));
      return {
        name: complex?.name || 'Неизвестный ЖК',
        count
      };
    });
    
    // Sort complexes by count
    setComplexStats(
      complexStatsArray.sort((a, b) => b.count - a.count)
    );
  }, [ordersData, complexesData, productsData]);
  
  // Calculate total revenue from completed orders only
  const totalRevenue = ordersData
    .filter(order => order.status === "completed")
    .reduce((total, order) => {
      const items = typeof order.items === 'string' 
        ? JSON.parse(order.items) 
        : order.items;
        
      const orderTotal = items.reduce((sum: number, item: any) => {
        const product = productsData.find(p => p.id === item.productId);
        return sum + (product?.price || 0) * item.quantity;
      }, 0);
      
      return total + orderTotal;
    }, 0);
  
  // Calculate this week's revenue from completed orders only (last 7 days)
  const thisWeekRevenue = (() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return ordersData
      .filter(order => 
        new Date(order.created_at) >= oneWeekAgo && 
        order.status === "completed"
      )
      .reduce((total, order) => {
        const items = typeof order.items === 'string' 
          ? JSON.parse(order.items) 
          : order.items;
          
        const orderTotal = items.reduce((sum: number, item: any) => {
          const product = productsData.find(p => p.id === item.productId);
          return sum + (product?.price || 0) * item.quantity;
        }, 0);
        
        return total + orderTotal;
      }, 0);
  })();
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <TabsContent value="dashboard" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersData.length}</div>
            <p className="text-xs text-muted-foreground">
              {ordersData.filter(o => {
                const createdDate = new Date(o.created_at);
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return createdDate >= oneWeekAgo;
              }).length} новых за последнюю неделю
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В обработке</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersData.filter(o => o.status === "processing").length}</div>
            <p className="text-xs text-muted-foreground">
              Ожидают обработки
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выручка (завершенные)</CardTitle>
            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} ₽</div>
            <p className="text-xs text-muted-foreground">
              +{thisWeekRevenue.toLocaleString()} ₽ за эту неделю
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Клиенты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(ordersData.map(o => o.customer_name)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              {ordersData.filter(o => o.status === "completed").length} завершенных заказов
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Статистика заказов</CardTitle>
            <CardDescription>Распределение заказов по статусам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Количество">
                    {statusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Распределение заказов</CardTitle>
            <CardDescription>Доля каждого статуса</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Популярные товары</CardTitle>
            <CardDescription>
              Самые заказываемые товары
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productStats.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <div className="font-medium text-sm">{index + 1}</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.count} шт.</p>
                  </div>
                  <TrendingUp className={`w-4 h-4 ml-auto ${index === 0 ? 'text-green-500' : index === 1 ? 'text-blue-500' : 'text-gray-500'}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Жилые комплексы</CardTitle>
            <CardDescription>
              Самые активные ЖК по заказам
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complexStats.map((complex, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <div className="font-medium text-sm">{index + 1}</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">{complex.name}</p>
                    <p className="text-xs text-muted-foreground">{complex.count} заказов</p>
                  </div>
                  <div className="ml-auto w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className={`h-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                      style={{ width: `${(complex.count / (complexStats[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};

export default Dashboard;
