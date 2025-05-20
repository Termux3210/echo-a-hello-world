
import AdminLayout from "@/components/AdminLayout";
import DeliveryManager from "@/components/DeliveryManager";

const DeliveryAdmin = () => {
  return (
    <AdminLayout title="Управление датами доставки">
      <DeliveryManager />
    </AdminLayout>
  );
};

export default DeliveryAdmin;
