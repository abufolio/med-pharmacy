'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WithdrawPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Yechib olish so'rovlari</h1>
        <p className="text-muted-foreground">Foydalanuvchilarning yechib olish so'rovlarini boshqarish</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Yechib olish so'rovlari</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bu sahifa ishlab chiqilmoqda. Tez orada to'liq funksionallik taqdim etiladi.</p>
        </CardContent>
      </Card>
    </div>
  );
}
