'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rollar va ruxsatlar</h1>
        <p className="text-muted-foreground">Rollar va ruxsatlar matritsasi</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rollar va ruxsatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bu sahifa ishlab chiqilmoqda. Tez orada to'liq funksionallik taqdim etiladi.</p>
        </CardContent>
      </Card>
    </div>
  );
}
