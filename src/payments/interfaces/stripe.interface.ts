import Stripe from 'stripe';

export interface IStripeEventData {
  object: Stripe.PaymentIntent | Stripe.Subscription | Stripe.Invoice;
}

export interface InvoiceWithPaymentIntent extends Stripe.Invoice {
  payment_intent?: Stripe.PaymentIntent | string;
}

export interface ExtendedInvoice extends Stripe.Invoice {
  payment_intent?: Stripe.PaymentIntent | string;
}
