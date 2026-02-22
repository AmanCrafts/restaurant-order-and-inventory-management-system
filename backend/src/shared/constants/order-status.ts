export enum OrderStatus {
  CREATED = 'CREATED',
  SENT_TO_KITCHEN = 'SENT_TO_KITCHEN',
  COOKING = 'COOKING',
  READY = 'READY',
  SERVED = 'SERVED',
  BILLED = 'BILLED',
  CLOSED = 'CLOSED',
}

export const OrderStatusFlow = {
  [OrderStatus.CREATED]: [OrderStatus.SENT_TO_KITCHEN],
  [OrderStatus.SENT_TO_KITCHEN]: [OrderStatus.COOKING],
  [OrderStatus.COOKING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.SERVED],
  [OrderStatus.SERVED]: [OrderStatus.BILLED],
  [OrderStatus.BILLED]: [OrderStatus.CLOSED],
  [OrderStatus.CLOSED]: [],
};

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): boolean {
  const allowedTransitions = OrderStatusFlow[currentStatus];
  return allowedTransitions?.includes(newStatus) || false;
}
