import { NavLink, Outlet, useNavigate } from "react-router-dom";

export const AppLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/login", { replace: true });
  };

  const linkBase =
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const linkInactive = "text-slate-500 hover:bg-slate-100 hover:text-slate-900";
  const linkActive = "bg-slate-900 text-white";

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
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              end
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/productos"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Productos
            </NavLink>

            {/* Más módulos que iremos creando */}
            <NavLink
              to="/ventas"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Ventas (POS)
            </NavLink>

            <NavLink
              to="/clientes"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Clientes
            </NavLink>

            <NavLink
              to="/proveedores"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Proveedores
            </NavLink>

            <NavLink
              to="/compras"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Compras
            </NavLink>

            <NavLink
              to="/creditos"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Créditos
            </NavLink>

            <NavLink
              to="/cuotas"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Cuotas
            </NavLink>
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
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
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
