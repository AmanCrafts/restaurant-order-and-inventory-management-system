/**
 * Inventory Controller
 * Handles HTTP requests for inventory management
 */

import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { asyncHandler } from '../../../shared/middleware/error-handler';
import {
  CreateInventoryItemRequestDto,
  UpdateInventoryItemRequestDto,
  UpdateStockRequestDto,
} from '../../../models/dto/requests/inventory.request.dto';
import {
  InventoryItemResponseDto,
  InventorySummaryResponseDto,
  LowStockAlertResponseDto,
} from '../../../models/dto/responses/inventory.response.dto';
import { AuthRequest } from '../../../shared/middleware/auth';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * Get all inventory items
   * GET /api/v1/inventory
   */
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const restaurantId = req.query.restaurantId as string;
    const search = req.query.search as string;
    const isActive = req.query.isActive as string | undefined;
    const lowStock = req.query.lowStock as string | undefined;

    const filter: {
      restaurantId?: string;
      search?: string;
      isActive?: boolean;
      lowStock?: boolean;
    } = {};

    if (restaurantId) filter.restaurantId = restaurantId;
    if (search) filter.search = search;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (lowStock !== undefined) filter.lowStock = lowStock === 'true';

    const items = await this.inventoryService.getAll(
      Object.keys(filter).length > 0 ? filter : undefined,
    );

    const response = items.map(
      (item) =>
        new InventorySummaryResponseDto({
          id: item.id,
          name: item.name,
          quantity: item.quantity.toNumber(),
          unit: item.unit,
          stockStatus: item.getStockStatus(),
        }),
    );

    res.json({
      status: 'success',
      data: response,
    });
  });

  /**
   * Get inventory item by ID
   * GET /api/v1/inventory/:id
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;

    const result = await this.inventoryService.getByIdWithRestaurant(id);
    const { item, restaurant } = result;

    const response = new InventoryItemResponseDto({
      id: item.id,
      restaurantId: item.restaurantId,
      name: item.name,
      quantity: item.quantity.toNumber(),
      unit: item.unit,
      reorderThreshold: item.reorderThreshold.toNumber(),
      stockStatus: item.getStockStatus(),
      isLowStock: item.isLowStock(),
      reorderAmount: item.getReorderAmount(),
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });

    res.json({
      status: 'success',
      data: {
        ...response,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
        },
      },
    });
  });

  /**
   * Get inventory items by restaurant ID
   * GET /api/v1/inventory/restaurant/:restaurantId
   */
  getByRestaurant = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const restaurantId = req.params.restaurantId as string;

      const items = await this.inventoryService.getByRestaurantId(restaurantId);

      const response = items.map(
        (item) =>
          new InventoryItemResponseDto({
            id: item.id,
            restaurantId: item.restaurantId,
            name: item.name,
            quantity: item.quantity.toNumber(),
            unit: item.unit,
            reorderThreshold: item.reorderThreshold.toNumber(),
            stockStatus: item.getStockStatus(),
            isLowStock: item.isLowStock(),
            reorderAmount: item.getReorderAmount(),
            isActive: item.isActive,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }),
      );

      res.json({
        status: 'success',
        data: response,
      });
    },
  );

  /**
   * Create new inventory item
   * POST /api/v1/inventory
   */
  create = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const dto = new CreateInventoryItemRequestDto(req.body);

      if (!dto.validate()) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid inventory item data',
        });
        return;
      }

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const item = await this.inventoryService.create(
        {
          restaurantId: dto.restaurantId,
          name: dto.name,
          quantity: dto.quantity,
          unit: dto.unit,
          reorderThreshold: dto.reorderThreshold,
        },
        adminId,
      );

      const response = new InventoryItemResponseDto({
        id: item.id,
        restaurantId: item.restaurantId,
        name: item.name,
        quantity: item.quantity.toNumber(),
        unit: item.unit,
        reorderThreshold: item.reorderThreshold.toNumber(),
        stockStatus: item.getStockStatus(),
        isLowStock: item.isLowStock(),
        reorderAmount: item.getReorderAmount(),
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });

      res.status(201).json({
        status: 'success',
        data: response,
      });
    },
  );

  /**
   * Update inventory item
   * PUT /api/v1/inventory/:id
   */
  update = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;
      const dto = new UpdateInventoryItemRequestDto(req.body);

      if (!dto.validate()) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid inventory item data',
        });
        return;
      }

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const item = await this.inventoryService.update(
        id,
        {
          name: dto.name,
          unit: dto.unit,
          reorderThreshold: dto.reorderThreshold,
          isActive: dto.isActive,
        },
        adminId,
      );

      const response = new InventoryItemResponseDto({
        id: item.id,
        restaurantId: item.restaurantId,
        name: item.name,
        quantity: item.quantity.toNumber(),
        unit: item.unit,
        reorderThreshold: item.reorderThreshold.toNumber(),
        stockStatus: item.getStockStatus(),
        isLowStock: item.isLowStock(),
        reorderAmount: item.getReorderAmount(),
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });

      res.json({
        status: 'success',
        data: response,
      });
    },
  );

  /**
   * Update stock quantity
   * PUT /api/v1/inventory/:id/stock
   */
  updateStock = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;
      const dto = new UpdateStockRequestDto(req.body);

      if (!dto.validate()) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid stock update data',
        });
        return;
      }

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const item = await this.inventoryService.updateStock(
        id,
        {
          amount: dto.amount,
          operation: dto.operation,
          reason: dto.reason,
        },
        adminId,
      );

      const response = new InventoryItemResponseDto({
        id: item.id,
        restaurantId: item.restaurantId,
        name: item.name,
        quantity: item.quantity.toNumber(),
        unit: item.unit,
        reorderThreshold: item.reorderThreshold.toNumber(),
        stockStatus: item.getStockStatus(),
        isLowStock: item.isLowStock(),
        reorderAmount: item.getReorderAmount(),
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });

      res.json({
        status: 'success',
        message: `Stock ${dto.operation.toLowerCase()}ed successfully`,
        data: response,
      });
    },
  );

  /**
   * Deactivate inventory item
   * DELETE /api/v1/inventory/:id
   */
  deactivate = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      await this.inventoryService.deactivate(id, adminId);

      res.json({
        status: 'success',
        message: 'Inventory item deactivated successfully',
      });
    },
  );

  /**
   * Activate inventory item
   * PATCH /api/v1/inventory/:id/activate
   */
  activate = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      const item = await this.inventoryService.activate(id, adminId);

      const response = new InventoryItemResponseDto({
        id: item.id,
        restaurantId: item.restaurantId,
        name: item.name,
        quantity: item.quantity.toNumber(),
        unit: item.unit,
        reorderThreshold: item.reorderThreshold.toNumber(),
        stockStatus: item.getStockStatus(),
        isLowStock: item.isLowStock(),
        reorderAmount: item.getReorderAmount(),
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });

      res.json({
        status: 'success',
        data: response,
      });
    },
  );

  /**
   * Delete inventory item permanently
   * DELETE /api/v1/inventory/:id/permanent
   */
  delete = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const id = req.params.id as string;

      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
        return;
      }

      await this.inventoryService.delete(id, adminId);

      res.json({
        status: 'success',
        message: 'Inventory item deleted permanently',
      });
    },
  );

  /**
   * Get low stock items
   * GET /api/v1/inventory/alerts/low-stock/:restaurantId
   */
  getLowStock = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const restaurantId = req.params.restaurantId as string;

      const items = await this.inventoryService.getLowStockItems(restaurantId);

      const response = items.map(
        (item) =>
          new LowStockAlertResponseDto({
            itemId: item.id,
            name: item.name,
            currentStock: item.quantity.toNumber(),
            unit: item.unit,
            reorderThreshold: item.reorderThreshold.toNumber(),
            reorderAmount: item.getReorderAmount(),
          }),
      );

      res.json({
        status: 'success',
        data: response,
      });
    },
  );

  /**
   * Get inventory statistics
   * GET /api/v1/inventory/stats/:restaurantId
   */
  getStats = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const restaurantId = req.params.restaurantId as string;

      const stats = await this.inventoryService.getStats(restaurantId);

      res.json({
        status: 'success',
        data: stats,
      });
    },
  );

  /**
   * Search inventory items
   * GET /api/v1/inventory/search
   */
  search = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const restaurantId = req.query.restaurantId as string;
    const query = req.query.q as string;
    const isActive = req.query.isActive as string | undefined;
    const lowStock = req.query.lowStock as string | undefined;

    if (!restaurantId) {
      res.status(400).json({
        status: 'error',
        message: 'restaurantId is required',
      });
      return;
    }

    const items = await this.inventoryService.search({
      restaurantId,
      query,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      lowStock: lowStock !== undefined ? lowStock === 'true' : undefined,
    });

    const response = items.map(
      (item) =>
        new InventorySummaryResponseDto({
          id: item.id,
          name: item.name,
          quantity: item.quantity.toNumber(),
          unit: item.unit,
          stockStatus: item.getStockStatus(),
        }),
    );

    res.json({
      status: 'success',
      data: response,
    });
  });
}

export default InventoryController;
