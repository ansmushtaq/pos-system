import { useState } from 'react';
import { X } from 'lucide-react';
import { useReceipt } from '../../hooks/useReceipt';
import { printReceipt } from '../../api/receipt.api';
import { ReceiptPreview } from './ReceiptPreview';

interface ReceiptModalProps {
  saleId: number;
  onClose: () => void;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const ReceiptModal = ({ saleId, onClose }: ReceiptModalProps) => {
  const { data, isLoading, isError, error: queryError, refetch } = useReceipt(saleId);
  const [actionError, setActionError] = useState<string | null>(null);

  const handlePrint = async () => {
    setActionError(null);
    try {
      const blob = await printReceipt(saleId, 'escpos');
      downloadBlob(blob, `receipt-${data?.invoiceNumber || saleId}.bin`);
    } catch {
      setActionError('Print failed. Please try again.');
    }
  };

  const handleDownloadPdf = async () => {
    setActionError(null);
    try {
      const blob = await printReceipt(saleId, 'pdf');
      downloadBlob(blob, `receipt-${data?.invoiceNumber || saleId}.pdf`);
    } catch {
      setActionError('Download failed. Please try again.');
    }
  };

  const handleClose = () => {
    setActionError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-green-50 flex-shrink-0 rounded-t-lg">
          <div>
            <h2 className="text-lg font-semibold text-green-700">Sale Complete</h2>
            <p className="text-xs text-green-600">{data?.invoiceNumber || ''}</p>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-green-100 rounded"><X size={18} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {isLoading && (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
              <div className="border-t border-dashed my-2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="border-t border-dashed my-2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-4/5" />
            </div>
          )}

          {isError && (
            <div className="text-center py-6">
              <p className="text-red-500 mb-2">
                {queryError instanceof Error ? queryError.message : 'Failed to load receipt'}
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  Retry
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && !data && (
            <div className="text-center py-6">
              <p className="text-gray-500">Receipt data not available</p>
            </div>
          )}

          {!isLoading && !isError && data && <ReceiptPreview receipt={data} />}
        </div>

        {data && (
          <div className="p-4 border-t space-y-2 flex-shrink-0">
            <button
              onClick={handlePrint}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
            >
              Download PDF
            </button>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
            >
              New Sale
            </button>
            {actionError && (
              <p className="text-red-500 text-xs text-center mt-1">{actionError}</p>
            )}
          </div>
        )}

        {!data && !isLoading && (
          <div className="p-4 border-t flex-shrink-0">
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              New Sale
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
