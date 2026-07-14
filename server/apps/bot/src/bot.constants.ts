export const BOT_COMMANDS = [
  { command: 'start', description: '🏠 Bosh sahifa' },
  { command: 'balance', description: '💰 Balansni ko\'rish' },
  { command: 'cashbacks', description: '🎁 Keshbek tarixi' },
  { command: 'card', description: '💳 Kartani ulash' },
  { command: 'notifications', description: '🔔 Xabarlar' },
  { command: 'stats', description: '📊 Statistika (admin)' },
  { command: 'broadcast', description: '📨 Xabar yuborish (admin)' },
] as const;

export const MESSAGES = {
  welcome: (firstName: string) =>
    `Assalomu alaykum, <b>${firstName}</b>! 👋\n\n` +
    `Pharmacies Cashback botiga xush kelibsiz! \n\n` +
    `💰 Balansingizni tekshirish uchun /balance\n` +
    `💳 Karta ulash uchun /card\n` +
    `🎁 Keshbeklar tarixi uchun /cashbacks`,

  balance: (balance: number) =>
    `💰 <b>Wallet balansingiz:</b> ${balance.toLocaleString()} so'm`,

  noWallet: '💰 Sizda wallet hali yaratilmagan.',

  cashbackList: (cashbacks: Array<{ amount: number; status: string; date: string }>) => {
    if (cashbacks.length === 0) return '🎁 Keshbeklar mavjud emas.';
    const lines = cashbacks.map(
      (c, i) => `${i + 1}. ${c.amount.toLocaleString()} so'm — ${c.status} (${c.date})`,
    );
    return `🎁 <b>Keshbeklar tarixi:</b>\n\n${lines.join('\n')}`;
  },

  noCashbacks: '🎁 Keshbeklar mavjud emas.',

  cardPrompt: '💳 Iltimos, kartangizni ulash uchun telefon raqamingizni yuboring:\n\n<code>+998901234567</code>',

  cardLinked: (phone: string) =>
    `✅ Telefon raqamingiz <b>${phone}</b> muvaffaqiyatli bog'landi!`,

  cardLinkError: '❌ Bu telefon raqamiga ega foydalanuvchi topilmadi. Iltimos, avval do\'konda NFC karta orqali ro\'yxatdan o\'ting.',

  notifications: (notifications: Array<{ message: string; date: string }>) => {
    if (notifications.length === 0) return '🔔 Sizda yangi xabarlar yo\'q.';
    const lines = notifications.map((n) => `• ${n.message} (${n.date})`);
    return `🔔 <b>Xabarlaringiz:</b>\n\n${lines.join('\n')}`;
  },

  noNotifications: '🔔 Xabarlar mavjud emas.',

  notAuthorized: '❌ Bu buyruq faqat adminlar uchun.',

  stats: (data: { totalUsers: number; totalTx: number; totalCashback: number }) =>
    `📊 <b>Bot statistikasi:</b>\n\n` +
    `👥 Foydalanuvchilar: ${data.totalUsers}\n` +
    `💳 Tranzaksiyalar: ${data.totalTx}\n` +
    `🎁 Jami keshbek: ${data.totalCashback.toLocaleString()} so'm`,

  broadcastPrompt: '📨 Barcha foydalanuvchilarga yuboriladigan xabarni kiriting:',
  broadcastSent: (count: number) =>
    `✅ Xabar ${count} ta foydalanuvchiga yuborildi.`,
  broadcastError: '❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.',
} as const;
