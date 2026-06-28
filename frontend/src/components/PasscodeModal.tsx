import { useState } from 'react';
import { verifyPasscode } from '../api/settings.api';

interface PasscodeModalProps {
  module: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PasscodeModal = ({ module, onSuccess, onCancel }: PasscodeModalProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const valid = await verifyPasscode(module, pin);
      if (valid) {
        onSuccess();
      } else {
        setError('Invalid PIN');
      }
    } catch {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
        <h2 className="text-lg font-semibold mb-2">Passcode Required</h2>
        <p className="text-sm text-gray-500 mb-4">Enter PIN to access {module}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-center text-lg tracking-widest mb-3"
            placeholder="••••••"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
