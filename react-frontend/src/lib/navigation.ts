import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  UserCheck, 
  Receipt,
  CreditCard,
  type LucideIcon 
} from "lucide-react"

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
}

export const appNavItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Productos",
    to: "/productos",
    icon: Package,
  },
  {
    label: "Clientes",
    to: "/clientes",
    icon: Users,
  },
  {
    label: "Ventas",
    to: "/ventas",
    icon: Receipt,
  },
  {
    label: "Compras",
    to: "/compras",
    icon: ShoppingCart,
  },
  {
    label: "Proveedores",
    to: "/proveedores",
    icon: UserCheck,
  },
  {
    label: "Créditos",
    to: "/creditos",
    icon: CreditCard,
  },
]
