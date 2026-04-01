import { OrderStatus } from '../../../shared/constants/order-status';
import { AuthenticatedUser } from '../../../shared/middleware/auth';
import OrderService from '../../order/services/order.service';

export class KitchenService {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  async listKitchenOrders(
    actor: AuthenticatedUser,
    restaurantId?: string,
    status?: OrderStatus,
  ) {
    return this.orderService.list(actor, {
      restaurantId,
      status,
    });
  }

  async startCooking(actor: AuthenticatedUser, orderId: string) {
    return this.orderService.startCooking(actor, orderId);
  }

  async markReady(actor: AuthenticatedUser, orderId: string) {
    return this.orderService.markReady(actor, orderId);
  }
}

export default KitchenService;
