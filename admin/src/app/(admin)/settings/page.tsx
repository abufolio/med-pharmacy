'use client';

import { useState, useCallback, useEffect } from 'react';
import { get, patch } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Save,
  Settings2,
  Shield,
  MessageCircle,
  Loader2,
} from 'lucide-react';

// ── Types ──
interface SettingEntry {
  id: string;
  key: string;
  value: Record<string, unknown>;
  scope?: string | null;
}

type SystemSettings = Record<string, unknown>;
type FeatureFlags = Record<string, boolean>;
type BotSettings = Record<string, string>;

const DEFAULT_SYSTEM: SystemSettings = {
  cashbackGlobalCap: 20,
  minTransactionAmount: 1000,
  maxTransactionAmount: 10000000,
  withdrawMinAmount: 5000,
  withdrawMaxAmount: 1000000,
  autoApproveWithdraw: false,
  requireSmsVerification: false,
};

const DEFAULT_FEATURES: FeatureFlags = {
  enableReferral: true,
  enableCampaigns: true,
  enableNotifications: true,
  enableAutoCashback: true,
  requireCardForTransaction: true,
};

const DEFAULT_BOT: BotSettings = {
  botUsername: '@med_pharmacy_bot',
  supportContact: '@support',
  welcomeMessage: 'Assalomu alaykum! Med Pharmacy botiga xush kelibsiz!',
  defaultLanguage: 'uz',
};

// ── Page ──
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [system, setSystem] = useState<SystemSettings>(DEFAULT_SYSTEM);
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FEATURES);
  const [bot, setBot] = useState<BotSettings>(DEFAULT_BOT);

  // ── Load settings by key ──
  const loadSetting = async <T,>(key: string, fallback: T): Promise<T> => {
    try {
      const res = await get<SettingEntry>(`/settings/${key}`);
      return (res.data?.value as T) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    const [sys, feat, botData] = await Promise.all([
      loadSetting<SystemSettings>('system', DEFAULT_SYSTEM),
      loadSetting<FeatureFlags>('features', DEFAULT_FEATURES),
      loadSetting<BotSettings>('bot', DEFAULT_BOT),
    ]);
    setSystem(sys);
    setFeatures(feat);
    setBot(botData);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Save ──
  const handleSave = async (key: string, value: Record<string, unknown>) => {
    setSaving(true);
    try {
      await patch(`/settings/${key}`, { value });
      toast.success('Sozlamalar saqlandi');
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Saqlashda xatolik',
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sozlamalar" description="Tizim sozlamalari va feature flaglar" />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Sozlamalar yuklanmoqda...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Sozlamalar" description="Tizim sozlamalari va feature flaglar" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Tizim
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Feature flaglar
          </TabsTrigger>
          <TabsTrigger value="bot" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Telegram Bot
          </TabsTrigger>
        </TabsList>

        {/* ── System Settings ── */}
        <TabsContent value="system" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cashback sozlamalari</CardTitle>
              <CardDescription>Global cashback cheklovlari va limitlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Global maksimal cashback foizi (%)</Label>
                  <Input
                    type="number"
                    value={String(system.cashbackGlobalCap || '')}
                    onChange={(e) => setSystem({ ...system, cashbackGlobalCap: Number(e.target.value) })}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tranzaksiya limitlari</CardTitle>
              <CardDescription>Minimal va maksimal tranzaksiya summalari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimal tranzaksiya (soʻm)</Label>
                  <Input
                    type="number"
                    value={String(system.minTransactionAmount || '')}
                    onChange={(e) => setSystem({ ...system, minTransactionAmount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maksimal tranzaksiya (soʻm)</Label>
                  <Input
                    type="number"
                    value={String(system.maxTransactionAmount || '')}
                    onChange={(e) => setSystem({ ...system, maxTransactionAmount: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Yechib olish sozlamalari</CardTitle>
              <CardDescription>Withdraw limitlari va avtotasdiqlash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimal yechib olish (soʻm)</Label>
                  <Input
                    type="number"
                    value={String(system.withdrawMinAmount || '')}
                    onChange={(e) => setSystem({ ...system, withdrawMinAmount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maksimal yechib olish (soʻm)</Label>
                  <Input
                    type="number"
                    value={String(system.withdrawMaxAmount || '')}
                    onChange={(e) => setSystem({ ...system, withdrawMaxAmount: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Avtotasdiqlash</Label>
                  <p className="text-xs text-muted-foreground">Yechib olish soʻrovlarini avtomatik tasdiqlash</p>
                </div>
                <Switch
                  checked={!!system.autoApproveWithdraw}
                  onCheckedChange={(v) => setSystem({ ...system, autoApproveWithdraw: v })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSave('system', system)} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* ── Feature Flags ── */}
        <TabsContent value="features" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feature flaglar</CardTitle>
              <CardDescription>Tizim funksiyalarini yoqish/oʻchirish</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(features).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label className="capitalize">{key.replace(/^enable/, '').replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <p className="text-xs text-muted-foreground">
                      {key === 'enableReferral' && 'Doʻst taklif qilish va bonuslar'}
                      {key === 'enableCampaigns' && 'Vaqtinchalik cashback aksiyalari'}
                      {key === 'enableNotifications' && 'Telegram orqali bildirishnomalar'}
                      {key === 'enableAutoCashback' && 'Tranzaksiyadan soʻng avtomatik cashback'}
                      {key === 'requireCardForTransaction' && 'NFC karta talab qilinsin'}
                    </p>
                  </div>
                  <Switch
                    checked={val}
                    onCheckedChange={(v) => setFeatures({ ...features, [key]: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSave('features', features as any)} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* ── Bot Settings ── */}
        <TabsContent value="bot" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Telegram Bot sozlamalari</CardTitle>
              <CardDescription>Bot profiling va asosiy sozlamalar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bot username</Label>
                  <Input
                    value={bot.botUsername || ''}
                    onChange={(e) => setBot({ ...bot, botUsername: e.target.value })}
                    placeholder="@username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qoʻllab-quvvatlash kontakti</Label>
                  <Input
                    value={bot.supportContact || ''}
                    onChange={(e) => setBot({ ...bot, supportContact: e.target.value })}
                    placeholder="@support"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Xush kelibsiz xabari</Label>
                <Input
                  value={bot.welcomeMessage || ''}
                  onChange={(e) => setBot({ ...bot, welcomeMessage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Standart til</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={bot.defaultLanguage || 'uz'}
                  onChange={(e) => setBot({ ...bot, defaultLanguage: e.target.value })}
                >
                  <option value="uz">Oʻzbekcha</option>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSave('bot', bot as any)} disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
