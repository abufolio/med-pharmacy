---
name: admin-panel-uiux-plan
description: Plan for redesigning the admin panel UI/UX — professional, natural, beautiful
tags: [uiux, redesign, plan]
---

# Admin Panel UI/UX Redesign Plan

## Current Problems
- Login page is basic with gradient background
- Dashboard stat cards are flat, no visual hierarchy
- Sidebar lacks branding and polish
- Tables are plain with no hover/selection states
- Forms lack validation feedback animations
- Overall: functional but not professional

## Design Direction
"Professional va tabiy chiroylik" — natural beauty, not overly designed

### Color System (globals.css — ✅ Updated)
- Primary: Emerald/Teal palette with health gradient
- Sidebar: Deep navy (#0f172a) instead of slate-800
- Surface: Warm white (#f8fafc)
- Shadows: 4 depth levels (sm/md/lg/xl)
- Animations: fade-in, slide-in, scale-in keyframes

### Design Tokens (✅ All Added)
1. ✅ Cards: Subtle shadows, rounded-2xl, hover elevation
2. ✅ Typography: Better headings hierarchy, muted body text
3. ✅ Spacing: Consistent 4px grid, generous whitespace
4. ✅ Animations: Page transitions, hover effects
5. ✅ Glass: Backdrop blur for modals

### Pages Redesigned (✅ All Complete)
| Priority | Page | Status |
|----------|------|--------|
| P0 | LoginPage | ✅ Dual-panel, brand-centric, animated |
| P0 | Sidebar | ✅ Deep navy, logo, collapsible, user profile |
| P0 | Navbar | ✅ Clean top bar, profile dropdown, lang switcher |
| P0 | MainLayout | ✅ Proper flex layout with max-w-7xl content |
| P0 | StatCard | ✅ Gradient icons, hover shadow, entrance animations |
| P0 | SuperAdminDashboard | ✅ Gradient stat cards, proper table, empty states |
| P0 | PharmacyDashboard | ✅ Quick actions grid, stat cards, transactions table |
| P0 | EmployeeDashboard | ✅ Large action cards, transactions, helpful empty state |
| P0 | globals.css | ✅ Complete design system with all tokens |

## Remaining
- ⏳ List pages (UserList, PharmacyList, TransactionList, CardManagement)
- ⏳ Pharmacy pages (transactions, cashback rules, employees, customers, reader)
- ⏳ Employee pages (transaction, customer, scan)
- ⏳ Super admin pages (regions, cashback rules, employee list, promo codes, audit, withdraw, reports, settings, data table)
