import { useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Home, Package, Users, Truck, ShoppingCart, CreditCard, ReceiptText } from "lucide-react";

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

type StoredUser = {
  id_usuario: number;
  nombre_completo?: string;
  correo?: string;
  rol?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: Home },
  { label: "Productos", to: "/productos", icon: Package },
  { label: "Ventas", to: "/ventas", icon: ShoppingCart },
  { label: "Compras", to: "/compras", icon: ReceiptText },
  { label: "Clientes", to: "/clientes", icon: Users },
  { label: "Proveedores", to: "/proveedores", icon: Truck },
  { label: "Créditos", to: "/creditos", icon: CreditCard },
];

export const AppLayout = () => {
  const navigate = useNavigate();

  const storedUser = useMemo<StoredUser | null>(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch (error) {
      console.warn("No se pudo parsear auth_user", error);
      return null;
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    navigate("/login", { replace: true });
  };

  const linkBase =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const linkInactive = "text-slate-500 hover:bg-slate-100 hover:text-slate-900";
  const linkActive = "bg-slate-900 text-white shadow-sm";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen grid-cols-[220px_1fr]">
        {/* SIDEBAR */}
        <aside className="border-r border-slate-200 bg-white p-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900">GuitarShop</h1>
            <p className="text-xs text-slate-500">
              Sistema administrativo y ventas
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                end={to === "/dashboard"}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* CONTENIDO */}
        <div className="flex min-h-screen flex-col">
          {/* HEADER SUPERIOR */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Panel administrativo
              </p>
              <p className="text-xs text-slate-500">
                Gestiona productos, ventas, clientes y más.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {storedUser?.nombre_completo ?? "Usuario"}
                </p>
                <p className="text-xs text-slate-500">
                  {storedUser?.correo ?? "Sin correo"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold">
                {(storedUser?.nombre_completo ?? storedUser?.correo ?? "GS")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cerrar sesión
              </button>
            </div>
          </header>

          {/* CONTENIDO DE CADA PANTALLA */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
