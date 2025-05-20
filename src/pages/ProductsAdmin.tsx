
import AdminLayout from "@/components/AdminLayout";
import ProductsManager from "@/components/ProductsManager";

const ProductsAdmin = () => {
  return (
    <AdminLayout title="Управление товарами">
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-medium text-yellow-800">Новые функции</h3>
        <ul className="mt-2 text-sm text-yellow-700 list-disc pl-5">
          <li>Добавлено поле "Количество (кг)" для учета количества товара в наличии</li>
          <li>Добавлена опция "Цена за 0.5 кг" для указания единицы измерения цены</li>
          <li>Инвентарь автоматически уменьшается при добавлении товаров в корзину</li>
        </ul>
      </div>
      <ProductsManager />
    </AdminLayout>
  );
};

export default ProductsAdmin;
