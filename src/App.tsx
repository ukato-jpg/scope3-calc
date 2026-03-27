import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { CategoryRouter } from '@/components/categories/CategoryRouter'
import { Scope1Page } from '@/components/categories/Scope1Page'
import { Scope2Page } from '@/components/categories/Scope2Page'
import { SettingsPage } from '@/components/settings/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="scope1" element={<Scope1Page />} />
            <Route path="scope2" element={<Scope2Page />} />
            <Route path="category/:id" element={<CategoryRouter />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
