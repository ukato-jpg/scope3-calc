import { NavLink, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { CATEGORIES } from '@/lib/constants'

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            S3
          </div>
          <div>
            <div className="font-semibold text-sm">Scope3算定ツール</div>
            <div className="text-[10px] text-muted-foreground">AIST-IDEA Ver.3.5</div>
          </div>
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ダッシュボード</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === '/'}
                  render={<NavLink to="/" />}
                >
                  集計結果
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>カテゴリ</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {CATEGORIES.map((cat) => (
                <SidebarMenuItem key={cat.id}>
                  <SidebarMenuButton
                    isActive={location.pathname === `/category/${cat.id}`}
                    render={<NavLink to={`/category/${cat.id}`} />}
                  >
                    <span className="text-xs text-muted-foreground w-5 shrink-0">
                      {cat.id}.
                    </span>
                    <span className="truncate text-xs">{cat.fullName}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={location.pathname === '/settings'}
              render={<NavLink to="/settings" />}
            >
              設定
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
