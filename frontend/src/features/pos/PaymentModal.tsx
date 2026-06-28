import { useState, useRef, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Search, Plus, Check, UserPlus } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { CashCalculator } from './CashCalculator';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCustomers, createCustomer } from '../../api/customer.api';
import type { Customer } from '../../types/models';

interface PaymentFormData {
  paymentMethod: 'CASH' | 'CARD' | 'CREDIT' | 'SEMI_CREDIT';
  amountTendered: number;
  customerName: string;
}

interface PaymentModalProps {
  total: number;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
}

export const PaymentModal = ({ total, onSubmit, onCancel, loading, error }: PaymentModalProps) => {
  const { customerName } = useCartStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentFormData>({
    defaultValues: {
      paymentMethod: 'CASH',
      amountTendered: 0,
      customerName: customerName !== 'Walk-in Customer' ? customerName : '',
    },
  });

  const paymentMethod = watch('paymentMethod');
  const amountTendered = watch('amountTendered');

  const onFormSubmit = (data: PaymentFormData) => {
    onSubmit(data);
  };

  // Customer search & quick-add state
  const cartStore = useCartStore();
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [addCustomerError, setAddCustomerError] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedCustomerId = cartStore.customerId;
  const selectedCustomerName = cartStore.customerName !== 'Walk-in Customer' ? cartStore.customerName : '';

  const handleCustomerSearch = useCallback((query: string) => {
    setCustomerSearch(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await getCustomers({ search: query.trim(), limit: 8 });
        setCustomerResults(res.data || []);
        setShowCustomerDropdown(true);
      } catch {
        setCustomerResults([]);
      } finally {
        setSearchingCustomers(false);
      }
    }, 300);
  }, []);

  const selectCustomer = (customer: Customer) => {
    cartStore.setCustomer(customer.id, customer.name);
    setCustomerSearch(customer.name);
    setCustomerResults([]);
    setShowCustomerDropdown(false);
  };

  const clearCustomer = () => {
    cartStore.setCustomer(null, 'Walk-in Customer');
    setCustomerSearch('');
    setCustomerResults([]);
  };

  const handleQuickAddCustomer = async () => {
    if (!newCustomerName.trim()) return;
    setAddingCustomer(true);
    setAddCustomerError('');
    try {
      const customer = await createCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || undefined,
      });
      cartStore.setCustomer(customer.id, customer.name);
      setCustomerSearch(customer.name);
      setShowAddCustomerForm(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setAddCustomerError(axiosErr.response?.data?.message || 'Failed to create customer');
    } finally {
      setAddingCustomer(false);
    }
  };

  const needsCustomer = paymentMethod === 'CREDIT' || paymentMethod === 'SEMI_CREDIT';

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Payment</h2>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold">{formatCurrency(total)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {(['CASH', 'CARD', 'CREDIT', 'SEMI_CREDIT'] as const).map((method) => (
                <label
                  key={method}
                  className={`flex items-center justify-center px-3 py-2 border rounded-md text-sm cursor-pointer transition-colors ${paymentMethod === method ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                >
                  <input
                    type="radio"
                    value={method}
                    {...register('paymentMethod')}
                    className="sr-only"
                  />
                  {method === 'SEMI_CREDIT' ? 'Semi-Credit' : method.charAt(0) + method.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>

          {(paymentMethod === 'CASH' || paymentMethod === 'SEMI_CREDIT') && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount Tendered {paymentMethod === 'SEMI_CREDIT' ? '(Cash Portion)' : ''}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('amountTendered', {
                  valueAsNumber: true,
                  required: paymentMethod === 'CASH' ? 'Cash amount is required' : paymentMethod === 'SEMI_CREDIT' ? 'Partial cash payment is required' : false,
                  min: { value: paymentMethod === 'CASH' ? 0.01 : 0, message: 'Amount must be greater than 0' },
                })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <CashCalculator
                total={total}
                tendered={amountTendered || 0}
                onTenderedChange={(amt) => setValue('amountTendered', amt)}
              />
              {errors.amountTendered && <p className="text-red-500 text-xs mt-1">{errors.amountTendered.message}</p>}
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500 text-center">
              Card payment — exact amount will be charged.
            </div>
          )}

          {needsCustomer && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Customer *</label>

              {!selectedCustomerId ? (
                <>
                  {/* Customer Search Input */}
                  <div className="relative">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={customerSearch}
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        onFocus={() => customerResults.length > 0 && setShowCustomerDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                        placeholder="Search customer by name or phone..."
                        className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
                      />
                      {searchingCustomers && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching...</span>
                      )}
                    </div>

                    {/* Dropdown Results */}
                    {showCustomerDropdown && customerResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {customerResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectCustomer(c)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-blue-50 text-left"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{c.name}</p>
                              {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showCustomerDropdown && customerSearch && !searchingCustomers && customerResults.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-3">
                        <p className="text-xs text-gray-500 mb-2">No customer found.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomerDropdown(false);
                            setNewCustomerName(customerSearch);
                            setShowAddCustomerForm(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 hover:bg-green-100"
                        >
                          <UserPlus size={14} />
                          Add "{customerSearch}"
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Add Customer Button */}
                  {!showAddCustomerForm && !customerSearch && (
                    <button
                      type="button"
                      onClick={() => setShowAddCustomerForm(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600"
                    >
                      <Plus size={14} />
                      Quick Add Customer
                    </button>
                  )}

                  {/* Inline Quick Add Form */}
                  {showAddCustomerForm && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 space-y-2">
                      <p className="text-sm font-medium text-green-800">New Customer</p>
                      <input
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="Customer name *"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        autoFocus
                      />
                      <input
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="Phone (optional)"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                      {addCustomerError && <p className="text-red-500 text-xs">{addCustomerError}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleQuickAddCustomer}
                          disabled={!newCustomerName.trim() || addingCustomer}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          {addingCustomer ? 'Adding...' : 'Save Customer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCustomerForm(false);
                            setNewCustomerName('');
                            setNewCustomerPhone('');
                            setAddCustomerError('');
                          }}
                          className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!selectedCustomerId && (
                    <p className="text-red-500 text-xs">Credit sales require a customer.</p>
                  )}
                </>
              ) : (
                /* Selected Customer Badge */
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">{selectedCustomerName}</p>
                      <p className="text-xs text-blue-600">Linked to cart</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearCustomer}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'CREDIT' && (
            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
              Full credit — entire amount will be added to customer balance.
            </div>
          )}

          {paymentMethod === 'SEMI_CREDIT' && amountTendered > 0 && amountTendered < total && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span>Cash Paid</span>
                <span className="font-medium">{formatCurrency(amountTendered)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>On Credit</span>
                <span className="font-medium text-amber-600">{formatCurrency(total - amountTendered)}</span>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border rounded-md text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading || (needsCustomer && !selectedCustomerId)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Processing...' : `Confirm ${formatCurrency(total)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
