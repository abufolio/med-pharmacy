import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { cardApi, transactionApi } from '@/lib/api-services';
import { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToastStore } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import { Smartphone, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';

export function EmployeeScanPage() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();

  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [cardUid, setCardUid] = useState('');
  const [scannedUser, setScannedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<'scan' | 'amount' | 'result'>('scan');

  const scanMutation = useMutation({
    mutationFn: (uid: string) => cardApi.scan({
      cardUid: uid,
      pharmacyId: user?.pharmacyId || '',
      idempotencyKey: `${Date.now()}`,
    }),
    onSuccess: (res: any) => {
      const data = res.data;
      if (data?.user) {
        setScannedUser(data.user);
        setStep('amount');
        addToast(`Customer: ${data.user.firstName} ${data.user.lastName}`, 'success');
      } else {
        addToast('Card scanned, no user info', 'info');
      }
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const transactionMutation = useMutation({
    mutationFn: (data: { amount: number }) =>
      transactionApi.create({
        userId: scannedUser?.id || '',
        pharmacyId: user?.pharmacyId || '',
        cardUid: cardUid,
        amount: data.amount,
        idempotencyKey: `${Date.now()}`,
      }),
    onSuccess: (res: any) => {
      setResult(res.data);
      setStep('result');
      addToast('Transaction completed', 'success');
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  const handleScan = () => {
    if (!cardUid) {
      addToast('Please enter card UID', 'error');
      return;
    }
    scanMutation.mutate(cardUid);
  };

  const handleSubmitTransaction = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      addToast('Please enter a valid amount', 'error');
      return;
    }
    transactionMutation.mutate({ amount: amt });
  };

  const handleReset = () => {
    setStep('scan');
    setCardUid('');
    setScannedUser(null);
    setAmount('');
    setResult(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('nav.scan')}</h1>
        <p className="text-sm text-slate-500 mt-1">Scan customer card and create transaction</p>
      </div>

      {step === 'scan' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {mode === 'scan' ? <Smartphone className="h-5 w-5 text-primary-500" /> : <CreditCard className="h-5 w-5 text-primary-500" />}
              {mode === 'scan' ? 'Scan NFC Card' : 'Enter Card UID'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant={mode === 'scan' ? 'default' : 'outline'} onClick={() => setMode('scan')} className="flex-1">
                <Smartphone className="h-4 w-4 mr-2" /> NFC Scan
              </Button>
              <Button variant={mode === 'manual' ? 'default' : 'outline'} onClick={() => setMode('manual')} className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" /> Manual
              </Button>
            </div>

            <Input
              label="Card UID"
              placeholder={mode === 'scan' ? 'Scan or type card UID...' : 'Enter card UID manually...'}
              value={cardUid}
              onChange={(e) => setCardUid(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              autoFocus
            />
            <Button
              className="w-full h-12 text-lg"
              onClick={handleScan}
              disabled={scanMutation.isPending || !cardUid}
            >
              {scanMutation.isPending ? 'Scanning...' : <><Smartphone className="h-5 w-5 mr-2" /> Scan Card</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'amount' && scannedUser && (
        <div className="space-y-4">
          <Card className="border-primary-200 bg-primary-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{scannedUser.firstName} {scannedUser.lastName}</p>
                  <p className="text-sm text-slate-500">{scannedUser.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{t('wallet.balance')}</p>
                  <p className="font-bold text-xl text-primary-600">{formatCurrency(scannedUser.balance || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('transaction.amount')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={t('transaction.amount')}
                type="number"
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitTransaction()}
                autoFocus
              />
              <Button
                className="w-full h-12 text-lg"
                onClick={handleSubmitTransaction}
                disabled={transactionMutation.isPending || !amount}
              >
                {transactionMutation.isPending ? 'Processing...' : <><ArrowRight className="h-5 w-5 mr-2" /> Create Transaction</>}
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleReset}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'result' && result && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-xl font-bold text-green-800">{t('transaction.success')}</h2>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">{t('transaction.id')}: <span className="font-mono font-medium">{result.transaction?.id}</span></p>
              <p className="text-lg font-bold">{formatCurrency(result.transaction?.amount || 0)}</p>
              {result.cashback && (
                <Badge variant="success" className="text-sm px-3 py-1">
                  +{formatCurrency(result.cashback.amount)} {t('cashback.title')}
                </Badge>
              )}
            </div>
            <Button className="w-full mt-4" onClick={handleReset}>
              {t('transaction.new')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
