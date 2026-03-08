

## Fixes: Onboarding Redirect, Jobber-Style Collect Payment, Save Card on File, Manual Card Entry

### Fix 1: Onboarding Redirect Loop

**Problem**: After saving onboarding settings, the `ProtectedRoute` still shows `settings === null` because `useCompanySettings` hasn't refetched yet. The `navigate("/")` fires, but `ProtectedRoute` checks settings again and redirects back to `/onboarding`.

**Fix**: In `Onboarding.tsx`, after `upsert.mutate` succeeds, invalidate the `company-settings` query cache before navigating. Also add a small guard: in `ProtectedRoute`, after the upsert succeeds and the query refetches, the settings will be non-null and the redirect won't trigger.

- **File**: `src/pages/Onboarding.tsx` -- import `useQueryClient`, call `qc.invalidateQueries({ queryKey: ["company-settings"] })` in `onSuccess` before `navigate("/")`.

### Fix 2: Jobber-Style "Collect Payment" Flow on Invoice Detail

**Problem**: Current invoice detail has a generic "Record Payment" dialog. The user wants a Jobber-inspired mobile-first collect payment page/drawer.

**What to build** (matching the uploaded screenshots):

**A. Redesign Invoice Detail for mobile** (`InvoiceDetail.tsx`):
- Mobile-first layout: large amount at top, status badge, invoice title, issued/due dates
- Two prominent action buttons: "Resend" and "Collect Payment"
- Tabs for "Invoice" (line items) and "Notes"
- Sticky bottom bar with "Collect Payment" on mobile

**B. New "Collect Payment" page/drawer** (`src/pages/CollectPayment.tsx` or a drawer component):
- Shows payment amount (editable with pencil icon)
- "Pay with Stripe" button (uses existing `create-invoice-checkout` edge function)
- "Manual Card Entry" option (new -- see Fix 4)
- Divider: "OR RECORD PAYMENT"
- Options: Cash, Cheque, Other Payment Record -- each records payment via existing `useRecordPayment`
- Route: `/invoices/:id/collect` or use a Drawer/Sheet component

**C. New component**: `src/components/invoice/CollectPaymentSheet.tsx`
- Full-screen sheet on mobile (using `vaul` Drawer), dialog on desktop
- Payment amount prominently displayed, editable
- Green "Pay with Stripe" button
- Manual Card Entry row
- Cash / Cheque / Other rows with icons and chevrons
- Each option either opens Stripe checkout or records payment directly

### Fix 3: Save Card on File

**Approach**: Use Stripe's `setup_intent` flow to save a card for a client without charging.

- **New DB table**: `client_saved_cards` -- `id`, `client_id`, `stripe_customer_id`, `stripe_payment_method_id`, `card_brand`, `card_last4`, `card_exp_month`, `card_exp_year`, `is_default`, `created_at`, `team_id`, `user_id`
- **New edge function**: `save-card-setup` -- creates a Stripe SetupIntent + returns `client_secret` for Stripe Elements
- **New edge function**: `charge-saved-card` -- charges a saved payment method for an invoice
- **Frontend**: On ClientDetail or CollectPayment, option to "Save Card on File". Uses Stripe.js `confirmCardSetup` with the client secret. After setup, save card details to `client_saved_cards`.
- **On Collect Payment**: If client has a saved card, show "Charge Card on File (Visa ...4242)" as the first option.

**Note**: This requires `@stripe/stripe-js` and `@stripe/react-stripe-js` packages for the card element UI.

### Fix 4: Manual Card Entry

**Approach**: Use Stripe PaymentIntent (server-side) + Stripe Elements (client-side) for manual card entry without redirect.

- **New edge function**: `create-payment-intent` -- creates a Stripe PaymentIntent for the invoice balance, returns `client_secret`
- **New component**: `src/components/invoice/ManualCardEntry.tsx` -- embedded Stripe CardElement form
- Uses `@stripe/react-stripe-js` `<Elements>` + `<CardElement>` or `<PaymentElement>`
- On submit, calls `stripe.confirmCardPayment(clientSecret)` 
- On success, records payment via `useRecordPayment` and updates invoice status

### Files to Create
- `src/components/invoice/CollectPaymentSheet.tsx` -- Jobber-style collect payment UI
- `src/components/invoice/ManualCardEntry.tsx` -- Stripe Elements card form
- `supabase/functions/create-payment-intent/index.ts` -- PaymentIntent for manual card
- `supabase/functions/save-card-setup/index.ts` -- SetupIntent for saving cards
- `supabase/functions/charge-saved-card/index.ts` -- Charge saved payment method

### Files to Edit
- `src/pages/Onboarding.tsx` -- Fix redirect (invalidate query cache)
- `src/pages/InvoiceDetail.tsx` -- Redesign for mobile-first, add Collect Payment button, integrate sheet
- `src/hooks/useInvoices.ts` -- Add hooks for saved cards
- `src/App.tsx` -- Add route if using a separate page

### Database Migration
```sql
CREATE TABLE public.client_saved_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_id uuid,
  stripe_customer_id text NOT NULL,
  stripe_payment_method_id text NOT NULL,
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_saved_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage saved cards"
  ON public.client_saved_cards FOR ALL
  TO authenticated
  USING (is_team_member(auth.uid(), team_id));
```

### New Dependencies
- `@stripe/stripe-js`
- `@stripe/react-stripe-js`

### Implementation Order
1. Fix onboarding redirect (quick fix)
2. Database migration for `client_saved_cards`
3. Edge functions: `create-payment-intent`, `save-card-setup`, `charge-saved-card`
4. `CollectPaymentSheet` component with Jobber-style UI
5. `ManualCardEntry` component with Stripe Elements
6. Redesign `InvoiceDetail` mobile layout + integrate collect payment flow
7. Saved card management on client detail

