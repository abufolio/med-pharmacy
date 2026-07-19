import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { cardApi, transactionApi } from '@/lib/services';
import { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToastStore } from '@/components/ui/toast';
import {
  ScanLine,
  CheckCircle2,
  ArrowLeft,
  CreditCard,
  ChevronRight,
  Wallet,
  Phone,
  User,
  X,
  Sparkles,
} from 'lucide-react';

type Step = 'scan' | 'amount' | 'result';

interface ScannedUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  balance: number;
}

interface TransactionResult {
  transaction: {
    id: string;
    amount: number;
    status: string;
  };
  cashback: {
    amount: number;
    type?: string;
    ruleName?: string;
  };
  wallet?: {
    balance: number;
  };
}

export function ScanPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<Step>('scan');
  const [cardUid, setCardUid] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!cardUid.trim()) {
      setError('Karta UID sini kiriting');
      return;
    }
    if (!user?.pharmacyId) {
      setError('Siz farmatsiyaga biriktirilmagansiz');
      return;
    }

    setScanning(true);
    setError('');
    try {
      const { data } = await cardApi.scan({
        cardUid: cardUid.trim(),
        pharmacyId: user.pharmacyId,
        idempotencyKey: `${Date.now()}`,
      });

      if (data.user) {
        setScannedUser({
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          phone: data.user.phone,
          balance: data.user.balance,
        });
        setStep('amount');
      } else {
        setError('Foydalanuvchi topilmadi');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setScanning(false);
    }
  };

  const handleCreateTransaction = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Toʻgʻri summa kiriting');
      return;
    }
    if (!scannedUser || !user?.pharmacyId) return;

    setProcessing(true);
    setError('');
    try {
      const { data } = await transactionApi.create({
        userId: scannedUser.id,
        pharmacyId: user.pharmacyId,
        cardUid: cardUid.trim(),
        amount: amountNum,
        idempotencyKey: `${Date.now()}`,
      });

      setResult(data);
      setStep('result');
      addToast('Tranzaksiya muvaffaqiyatli!', 'success');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    setStep('scan');
    setCardUid('');
    setManualMode(false);
    setScannedUser(null);
    setAmount('');
    setResult(null);
    setError('');
  };

  const handleBack = () => {
    if (step === 'amount') {
      setStep('scan');
      setError('');
    }
  };

  // Numeric keypad for amount input
  const handleKeypadPress = (key: string) => {
    if (key === 'backspace') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount((prev) => prev + '.');
    } else {
      // Limit to 2 decimal places
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
      setAmount((prev) => prev + key);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-3">
          <Button variant="ghost" size="iconSm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-900">NFC Scan</h1>
            <p className="text-xs text-slate-500">Kartani skaner qilish</p>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {(['scan', 'amount', 'result'] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                    step === s
                      ? 'bg-primary-600'
                      : ['scan', 'amount', 'result'].indexOf(step) >= idx
                      ? 'bg-primary-400'
                      : 'bg-slate-200'
                  }`}
                />
                {idx < 2 && (
                  <div
                    className={`h-0.5 w-3 transition-colors duration-300 ${
                      ['scan', 'amount', 'result'].indexOf(step) > idx
                        ? 'bg-primary-400'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 page-enter">
        {/* Error */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700 animate-slide-down">
            <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Scan Card */}
        {step === 'scan' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary-50 mb-6 animate-scan-pulse">
                <CreditCard className="h-12 w-12 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Kartani skaner qiling</h2>
              <p className="text-sm text-slate-500">
                NFC kartani o'quvchiga tekkizing yoki UIDni qo'lda kiriting
              </p>
            </div>

            <Card>
              <CardContent className="p-5 space-y-4">
                {manualMode ? (
                  <>
                    <Input
                      label="Karta UID"
                      placeholder="UID ni kiriting..."
                      value={cardUid}
                      onChange={(e) => setCardUid(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                      autoFocus
                    />
                    <Button className="w-full" size="lg" onClick={handleScan} loading={scanning}>
                      <ScanLine className="h-5 w-5" />
                      Qidirish
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setManualMode(false)}>
                      <ScanLine className="h-4 w-4" />
                      NFC rejimiga o'tish
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Simulated scan button (NFC would trigger this) */}
                    <button
                      onClick={handleScan}
                      disabled={scanning}
                      className="w-full py-16 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50/50 hover:bg-primary-50 hover:border-primary-400 transition-all duration-300 flex flex-col items-center justify-center gap-4 animate-scan-pulse disabled:opacity-50"
                    >
                      <ScanLine className="h-16 w-16 text-primary-500" />
                      <div>
                        <p className="text-lg font-semibold text-primary-700">Kartani tekkizing</p>
                        <p className="text-sm text-primary-500 mt-1">
                          NFC orqali avtomatik skaner qilinadi
                        </p>
                      </div>
                      {scanning && (
                        <div className="h-5 w-5 border-2 border-primary-400 border-t-primary-600 rounded-full animate-spin" />
                      )}
                    </button>
                    <Button variant="outline" className="w-full" onClick={() => setManualMode(true)}>
                      <CreditCard className="h-4 w-4" />
                      UID ni qo'lda kiritish
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Enter Amount */}
        {step === 'amount' && scannedUser && (
          <div className="space-y-5 animate-slide-up">
            {/* Customer info card */}
            <Card className="border-primary-100 bg-gradient-to-br from-primary-50 to-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                    <User className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {scannedUser.firstName} {scannedUser.lastName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                      <Phone className="h-3.5 w-3.5" />
                      {scannedUser.phone}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/80 border border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Wallet className="h-4 w-4" />
                    Balans
                  </div>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(scannedUser.balance)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Amount display */}
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">Tranzaksiya summasi</p>
              <div className="text-5xl font-extrabold text-slate-900 tracking-tight my-4">
                {amount || <span className="text-slate-300 font-normal">0</span>}
                <span className="text-2xl text-slate-400 font-semibold ml-1">soʻm</span>
              </div>
              {amount && (
                <p className="text-sm text-emerald-600 font-medium">
                  <Sparkles className="h-3.5 w-3.5 inline mr-1" />
                  Taxminiy cashback: {(parseFloat(amount) * 0.01).toLocaleString('uz-UZ')} soʻm
                </p>
              )}
            </div>

            {/* Numeric keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleKeypadPress(String(n))}
                  className="h-14 rounded-xl bg-white border border-slate-200 text-xl font-semibold text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => handleKeypadPress('.')}
                className="h-14 rounded-xl bg-white border border-slate-200 text-xl font-semibold text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
              >
                .
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="h-14 rounded-xl bg-white border border-slate-200 text-xl font-semibold text-slate-900 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
              >
                0
              </button>
              <button
                onClick={() => handleKeypadPress('backspace')}
                className="h-14 rounded-xl bg-slate-100 border border-slate-200 text-lg text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors shadow-sm"
              >
                ⌫
              </button>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-3">
              <Button
                className="w-full h-14 text-lg font-semibold"
                size="xl"
                onClick={handleCreateTransaction}
                loading={processing}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                {!processing && <ChevronRight className="h-6 w-6" />}
                Tranzaksiya yaratish
              </Button>
              <Button variant="outline" className="w-full" onClick={handleBack} disabled={processing}>
                Bekor qilish
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && result && (
          <div className="space-y-6 animate-scale-in">
            {/* Success animation */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-28 w-28 rounded-full bg-emerald-50 mb-6">
                <div className="relative">
                  <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 64 64">
                    <path
                      d="M20 32l8 8 16-16"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-checkmark"
                      strokeDasharray="50"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Tranzaksiya muvaffaqiyatli!</h2>
              <p className="text-sm text-slate-500">
                Pul mablagʻlari muvaffaqiyatli oʻtkazildi
              </p>
            </div>

            {/* Transaction details */}
            <Card>
              <CardContent className="p-5 space-y-4">
                {/* Amount */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50">
                  <span className="text-sm text-slate-600">Summa</span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(result.transaction.amount)}
                  </span>
                </div>

                {/* Cashback */}
                {result.cashback && result.cashback.amount > 0 && (
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">Cashback</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">
                      +{formatCurrency(result.cashback.amount)}
                    </span>
                  </div>
                )}

                {/* New Balance */}
                {result.wallet && (
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50">
                    <span className="text-sm text-slate-600">Yangi balans</span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatCurrency(result.wallet.balance)}
                    </span>
                  </div>
                )}

                {/* Transaction ID */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    ID: <span className="font-mono">{result.transaction.id}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Status: <span className="text-emerald-600 font-medium">Bajarildi</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* New Transaction button */}
            <Button className="w-full h-14 text-lg font-semibold" size="xl" onClick={handleNewTransaction}>
              <ScanLine className="h-5 w-5" />
              Yangi tranzaksiya
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
