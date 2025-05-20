
// Residential complexes
export const residentialComplexes = [
  {
    id: 1,
    name: "ЖК Balance",
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    address: "ул. Академика Королева, 12",
    available: true
  },
  {
    id: 2,
    name: "ЖК Кварталы",
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    address: "пр. Ленинский, 38",
    available: true
  },
  {
    id: 3,
    name: "ЖК Среда",
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    address: "ул. Садовая, 7",
    available: true
  },
  {
    id: 4,
    name: "ЖК Мир",
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    address: "Проспект Мира, 101",
    available: false
  },
  {
    id: 5,
    name: "ЖК Новые Горизонты",
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    address: "ул. Новаторов, 22",
    available: true
  },
  {
    id: 6,
    name: "ЖК Пресня Сити",
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    address: "ул. Ходынская, 2",
    available: true
  }
];

// Products
export const products = [
  {
    id: 1,
    name: "Жимолость 1 кг",
    farm: "хозяйство «Тульская ягода»",
    price: 800,
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    available: true,
    description: "Сладкая жимолость от фермеров Тульской области. Собрана вручную."
  },
  {
    id: 2,
    name: "Клубника 1 кг",
    farm: "хозяйство «Богородицкие поля»",
    price: 950,
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    available: true,
    description: "Сочная и спелая клубника от фермеров Богородицкого района."
  },
  {
    id: 3,
    name: "Малина 1 кг",
    farm: "хозяйство «Ягодные просторы»",
    price: 1200,
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    available: true,
    description: "Ароматная малина, выращенная в экологически чистом районе."
  },
  {
    id: 4,
    name: "Смородина 1 кг",
    farm: "хозяйство «Тульская ягода»",
    price: 750,
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    available: true,
    description: "Черная смородина с высоким содержанием витамина C."
  },
  {
    id: 5,
    name: "Ежевика 1 кг",
    farm: "хозяйство «Ягодные просторы»",
    price: 1350,
    image: "/lovable-uploads/9c8e383a-af42-4e9e-824b-4c5bbcf857f1.png",
    available: false,
    description: "Сладкая ежевика с кислинкой, собранная на пике спелости."
  }
];

// Available delivery dates
export const deliveryDates = [
  { id: 1, date: "2023-06-03", complexIds: [1, 2, 3] },
  { id: 2, date: "2023-06-05", complexIds: [2, 4] },
  { id: 3, date: "2023-06-10", complexIds: [1, 3] },
  { id: 4, date: "2023-06-15", complexIds: [5, 6, 1] },
  { id: 5, date: "2023-06-20", complexIds: [2, 3, 4, 5] },
  { id: 6, date: "2023-06-25", complexIds: [1, 6] }
];

// Orders
export const orders = [
  {
    id: 1,
    customerName: "Иванов Иван",
    phone: "+7 (999) 123-4567",
    telegramUsername: "@ivanov",
    residentialComplexId: 1,
    items: [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 }
    ],
    deliveryDate: "2023-06-03",
    status: "processing", // processing, delivering, delivered, cancelled
    createdAt: "2023-06-01",
    updatedAt: "2023-06-01"
  },
  {
    id: 2,
    customerName: "Петров Петр",
    phone: "+7 (999) 765-4321",
    telegramUsername: "@petrov",
    residentialComplexId: 2,
    items: [
      { productId: 2, quantity: 3 }
    ],
    deliveryDate: "2023-06-05",
    status: "delivered",
    createdAt: "2023-06-02",
    updatedAt: "2023-06-06"
  },
  {
    id: 3,
    customerName: "Сидорова Анна",
    phone: "+7 (999) 555-7777",
    telegramUsername: "@sidorova",
    residentialComplexId: 3,
    items: [
      { productId: 1, quantity: 1 }
    ],
    deliveryDate: "2023-06-10",
    status: "cancelled",
    createdAt: "2023-06-05",
    updatedAt: "2023-06-07"
  },
  {
    id: 4,
    customerName: "Козлов Алексей",
    phone: "+7 (999) 888-3333",
    telegramUsername: "@kozlov",
    residentialComplexId: 5,
    items: [
      { productId: 3, quantity: 2 },
      { productId: 4, quantity: 1 }
    ],
    deliveryDate: "2023-06-15",
    status: "processing",
    createdAt: "2023-06-08",
    updatedAt: "2023-06-08"
  },
  {
    id: 5,
    customerName: "Морозова Елена",
    phone: "+7 (999) 222-4444",
    telegramUsername: "@morozova",
    residentialComplexId: 6,
    items: [
      { productId: 2, quantity: 1 },
      { productId: 3, quantity: 1 },
      { productId: 4, quantity: 2 }
    ],
    deliveryDate: "2023-06-15",
    status: "delivering",
    createdAt: "2023-06-09",
    updatedAt: "2023-06-12"
  },
  {
    id: 6,
    customerName: "Соколов Дмитрий",
    phone: "+7 (999) 111-9999",
    telegramUsername: "@sokolov",
    residentialComplexId: 2,
    items: [
      { productId: 1, quantity: 3 }
    ],
    deliveryDate: "2023-06-20",
    status: "processing",
    createdAt: "2023-06-11",
    updatedAt: "2023-06-11"
  }
];

// Admins
export const admins = [
  {
    id: 1,
    telegramUsername: "@admin",
    name: "Администратор",
    isAdmin: true
  },
  {
    id: 2,
    telegramUsername: "@manager",
    name: "Менеджер",
    isAdmin: true
  },
  {
    id: 3,
    telegramUsername: "@director",
    name: "Директор",
    isAdmin: true
  },
  {
    id: 4,
    telegramUsername: "@user",
    name: "Обычный пользователь",
    isAdmin: false
  }
];

// Status types for orders
export type OrderStatus = "processing" | "delivering" | "delivered" | "cancelled";

// Status label mapping
export const statusLabels = {
  processing: "В обработке",
  delivering: "В доставке",
  delivered: "Доставлен",
  cancelled: "Отменен"
};

// Status color mapping
export const statusColors = {
  processing: "bg-blue-100 text-blue-800",
  delivering: "bg-yellow-100 text-yellow-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

// Dashboard statistics (mock data)
export const dashboardStats = {
  totalOrders: 87,
  processingOrders: 23,
  deliveredOrders: 58,
  cancelledOrders: 6,
  totalRevenue: 103500,
  thisWeekRevenue: 32400,
  thisMonthRevenue: 89700,
  topProducts: [
    { id: 2, name: "Клубника 1 кг", count: 43 },
    { id: 1, name: "Жимолость 1 кг", count: 38 },
    { id: 3, name: "Малина 1 кг", count: 31 }
  ],
  topComplexes: [
    { id: 1, name: "ЖК Balance", count: 28 },
    { id: 2, name: "ЖК Кварталы", count: 23 },
    { id: 5, name: "ЖК Новые Горизонты", count: 18 }
  ]
};
