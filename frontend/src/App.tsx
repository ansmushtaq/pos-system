import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ProductList } from './features/products/ProductList';
import { ProductForm } from './features/products/ProductForm';
import { PriceHistoryDrawer } from './features/products/PriceHistoryDrawer';
import { InventoryList } from './features/inventory/InventoryList';
import { MovementLedger } from './features/inventory/MovementLedger';
import { InventoryAuditLog } from './features/inventory/InventoryAuditLog';
import { SellerList } from './features/sellers/SellerList';
import { ShiftSummary } from './features/sellers/ShiftSummary';
import { UserForm } from './features/sellers/UserForm';
import { CustomerList } from './features/customers/CustomerList';
import { CustomerForm } from './features/customers/CustomerForm';
import { CustomerCredit } from './features/customers/CustomerCredit';
import { EndOfDayScreen } from './features/endOfDay/EndOfDayScreen';
import { EODSummaryView } from './features/endOfDay/EODSummaryView';
import { POSScreen } from './features/pos/POSScreen';
import { Dashboard } from './features/dashboard/Dashboard';
import { VendorList } from './features/vendors/VendorList';
import { VendorForm } from './features/vendors/VendorForm';
import { POList } from './features/purchaseOrders/POList';
import { POForm } from './features/purchaseOrders/POForm';
import { GRNScreen } from './features/purchaseOrders/GRNScreen';
import { SalesList } from './features/sales/SalesList';
import { SaleDetail } from './features/sales/SaleDetail';
import { ProfitReport } from './features/reports/ProfitReport';
import { StockValuation } from './features/reports/StockValuation';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="products/:id/price-history" element={<PriceHistoryDrawer />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="inventory/audit-log" element={<InventoryAuditLog />} />
        <Route path="inventory/:productId/movements" element={<MovementLedger />} />
        <Route path="users" element={<SellerList />} />
        <Route path="users/new" element={<UserForm />} />
        <Route path="users/:id/edit" element={<UserForm />} />
        <Route path="users/:id/shifts" element={<ShiftSummary />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="customers/:id/credit" element={<CustomerCredit />} />
        <Route path="end-of-day" element={<EndOfDayScreen />} />
        <Route path="end-of-day/history" element={<EODSummaryView />} />
        <Route path="pos" element={<POSScreen />} />
        <Route path="vendors" element={<VendorList />} />
        <Route path="vendors/new" element={<VendorForm />} />
        <Route path="vendors/:id/edit" element={<VendorForm />} />
        <Route path="purchase-orders" element={<POList />} />
        <Route path="purchase-orders/new" element={<POForm />} />
        <Route path="purchase-orders/:id/receive" element={<GRNScreen />} />
        <Route path="sales" element={<SalesList />} />
        <Route path="sales/:id" element={<SaleDetail />} />
        <Route path="reports/profit" element={<ProfitReport />} />
        <Route path="reports/stock-valuation" element={<StockValuation />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
