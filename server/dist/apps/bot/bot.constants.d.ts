export declare const BOT_COMMANDS: readonly [{
    readonly command: "start";
    readonly description: "🏠 Bosh sahifa";
}, {
    readonly command: "balance";
    readonly description: "💰 Balansni ko'rish";
}, {
    readonly command: "cashbacks";
    readonly description: "🎁 Keshbek tarixi";
}, {
    readonly command: "card";
    readonly description: "💳 Kartani ulash";
}, {
    readonly command: "notifications";
    readonly description: "🔔 Xabarlar";
}, {
    readonly command: "stats";
    readonly description: "📊 Statistika (admin)";
}, {
    readonly command: "broadcast";
    readonly description: "📨 Xabar yuborish (admin)";
}];
export declare const MESSAGES: {
    readonly welcome: (firstName: string) => string;
    readonly balance: (balance: number) => string;
    readonly noWallet: "💰 Sizda wallet hali yaratilmagan.";
    readonly cashbackList: (cashbacks: Array<{
        amount: number;
        status: string;
        date: string;
    }>) => string;
    readonly noCashbacks: "🎁 Keshbeklar mavjud emas.";
    readonly cardPrompt: "💳 Iltimos, kartangizni ulash uchun telefon raqamingizni yuboring:\n\n<code>+998901234567</code>";
    readonly cardLinked: (phone: string) => string;
    readonly cardLinkError: "❌ Bu telefon raqamiga ega foydalanuvchi topilmadi. Iltimos, avval do'konda NFC karta orqali ro'yxatdan o'ting.";
    readonly notifications: (notifications: Array<{
        message: string;
        date: string;
    }>) => string;
    readonly noNotifications: "🔔 Xabarlar mavjud emas.";
    readonly notAuthorized: "❌ Bu buyruq faqat adminlar uchun.";
    readonly stats: (data: {
        totalUsers: number;
        totalTx: number;
        totalCashback: number;
    }) => string;
    readonly broadcastPrompt: "📨 Barcha foydalanuvchilarga yuboriladigan xabarni kiriting:";
    readonly broadcastSent: (count: number) => string;
    readonly broadcastError: "❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.";
};
