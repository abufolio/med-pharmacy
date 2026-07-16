'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PharmaciesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dorixonalar</h1>
        <p className="text-muted-foreground">Barcha dorixonalarni boshqarish</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dorixonalar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bu sahifa ishlab chiqilmoqda. Tez orada to'liq funksionallik taqdim etiladi.</p>
        </CardContent>
      </Card>
    </div>
  );
}
