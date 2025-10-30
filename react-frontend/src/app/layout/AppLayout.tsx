import { NavLink, Outlet } from "react-router-dom";

export const AppLayout = () => {
  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r p-4 space-y-3">
        <h1 className="text-xl font-bold">GuitarShop</h1>
        <nav className="flex flex-col text-sm gap-2">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/productos">Productos</NavLink>
          <NavLink to="/ventas">Ventas (POS)</NavLink>
        </nav>
      </aside>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
};
