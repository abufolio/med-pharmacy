'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PromocodesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promo kodlar</h1>
        <p className="text-muted-foreground">Promo kodlar va referral bonuslar</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Promo kodlar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bu sahifa ishlab chiqilmoqda. Tez orada to'liq funksionallik taqdim etiladi.</p>
        </CardContent>
      </Card>
    </div>
  );
}
