
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import AdminPanel from "@/components/AdminPanel";
import { useAdmin } from "@/hooks/useAdmin";

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect non-admin users to login
    if (!loading) {
      if (!isAdmin) {
        navigate("/login");
      }
      setIsLoading(false);
    }
  }, [isAdmin, loading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Панель управления">
      <AdminPanel />
    </AdminLayout>
  );
};

export default Admin;
