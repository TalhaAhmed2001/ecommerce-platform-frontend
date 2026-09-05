import { ApiError, type Order } from './api/client';

export const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
};

export const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

export const canSimulatePayment = (order: Order): boolean => {
  return order.status === 'PAYMENT_PENDING' && order.payment?.status === 'PENDING';
};

export const getCheckoutErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : 'Checkout failed. Please try again.';
  }

  if (error.status === 401) {
    return 'Please log in before checking out.';
  }

  if (error.status === 404) {
    return `A product in your cart is no longer available. ${error.message}`;
  }

  if (error.status === 409) {
    return `Your cart is out of date or there is not enough stock. ${error.message}`;
  }

  if (error.status >= 500) {
    return 'The server could not complete checkout. Please try again.';
  }

  return error.message;
};

export const getPaymentErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : 'Payment update failed. Please try again.';
  }

  if (error.status === 401) {
    return 'Please log in to update this payment.';
  }

  if (error.status === 409) {
    return `This payment is expired or has already changed state. ${error.message}`;
  }

  if (error.status >= 500) {
    return 'The server could not update the payment. Please try again.';
  }

  return error.message;
};
