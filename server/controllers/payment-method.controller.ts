import { Request, Response, NextFunction } from 'express';
import { db } from '../../src/db/index.ts';
import { paymentMethods, adminLogs } from '../../src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const paymentMethodController = {
  // Public/User: Get active payment methods (optionally filtered by type)
  async getActivePaymentMethods(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.query; // 'DEPOSIT' | 'WITHDRAWAL' | undefined
      const allMethods = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.isActive, true))
        .orderBy(desc(paymentMethods.createdAt));

      if (type && typeof type === 'string') {
        const uppercaseType = type.toUpperCase();
        const filtered = allMethods.filter(
          (m) => m.type === 'BOTH' || m.type === uppercaseType
        );
        return res.json({ paymentMethods: filtered });
      }

      return res.json({ paymentMethods: allMethods });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Get all payment methods (active & inactive)
  async getAdminPaymentMethods(req: Request, res: Response, next: NextFunction) {
    try {
      const allMethods = await db
        .select()
        .from(paymentMethods)
        .orderBy(desc(paymentMethods.createdAt));

      return res.json({ paymentMethods: allMethods });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Create new payment method
  async createPaymentMethod(req: any, res: Response, next: NextFunction) {
    try {
      const {
        name,
        type = 'BOTH',
        walletAddressOrAccount,
        network = '',
        qrCodeUrl = '',
        minLimit = 1,
        maxLimit = 100000,
        networkFee = 0,
        instructions = '',
        isActive = true,
      } = req.body;

      if (!name || !walletAddressOrAccount) {
        return res.status(400).json({ error: 'اسم طريقة الدفع وعنوان المحفظة/رقم الحساب مطلوبان' });
      }

      const id = `pm-${uuidv4()}`;
      const newMethod = {
        id,
        name: String(name).trim(),
        type: ['DEPOSIT', 'WITHDRAWAL', 'BOTH'].includes(type) ? type : 'BOTH',
        walletAddressOrAccount: String(walletAddressOrAccount).trim(),
        network: String(network || '').trim(),
        qrCodeUrl: String(qrCodeUrl || '').trim(),
        minLimit: Number(minLimit) >= 0 ? Number(minLimit) : 1,
        maxLimit: Number(maxLimit) > 0 ? Number(maxLimit) : 100000,
        networkFee: Number(networkFee) >= 0 ? Number(networkFee) : 0,
        instructions: String(instructions || '').trim(),
        isActive: Boolean(isActive),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(paymentMethods).values(newMethod);

      // Admin log
      await db.insert(adminLogs).values({
        id: uuidv4(),
        adminId: req.user.id,
        action: 'CREATE_PAYMENT_METHOD',
        details: `Created payment method ${name} (${type}) with address: ${walletAddressOrAccount}`,
        createdAt: new Date(),
      });

      return res.status(201).json({
        message: 'تم إضافة طريقة الدفع بنجاح',
        paymentMethod: newMethod,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Update payment method
  async updatePaymentMethod(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        name,
        type,
        walletAddressOrAccount,
        network,
        qrCodeUrl,
        minLimit,
        maxLimit,
        networkFee,
        instructions,
        isActive,
      } = req.body;

      const existing = (
        await db.select().from(paymentMethods).where(eq(paymentMethods.id, id))
      )[0];

      if (!existing) {
        return res.status(404).json({ error: 'طريقة الدفع غير موجودة' });
      }

      const updateData: Partial<typeof paymentMethods.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (name !== undefined) updateData.name = String(name).trim();
      if (type !== undefined && ['DEPOSIT', 'WITHDRAWAL', 'BOTH'].includes(type)) {
        updateData.type = type;
      }
      if (walletAddressOrAccount !== undefined) {
        updateData.walletAddressOrAccount = String(walletAddressOrAccount).trim();
      }
      if (network !== undefined) updateData.network = String(network).trim();
      if (qrCodeUrl !== undefined) updateData.qrCodeUrl = String(qrCodeUrl).trim();
      if (minLimit !== undefined) updateData.minLimit = Number(minLimit);
      if (maxLimit !== undefined) updateData.maxLimit = Number(maxLimit);
      if (networkFee !== undefined) updateData.networkFee = Number(networkFee);
      if (instructions !== undefined) updateData.instructions = String(instructions).trim();
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      await db
        .update(paymentMethods)
        .set(updateData)
        .where(eq(paymentMethods.id, id));

      // Admin log
      await db.insert(adminLogs).values({
        id: uuidv4(),
        adminId: req.user.id,
        action: 'UPDATE_PAYMENT_METHOD',
        details: `Updated payment method ${id} (${existing.name})`,
        createdAt: new Date(),
      });

      const updated = (
        await db.select().from(paymentMethods).where(eq(paymentMethods.id, id))
      )[0];

      return res.json({
        message: 'تم تحديث طريقة الدفع بنجاح',
        paymentMethod: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Toggle active status
  async togglePaymentMethodStatus(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = (
        await db.select().from(paymentMethods).where(eq(paymentMethods.id, id))
      )[0];

      if (!existing) {
        return res.status(404).json({ error: 'طريقة الدفع غير موجودة' });
      }

      const newStatus = !existing.isActive;
      await db
        .update(paymentMethods)
        .set({ isActive: newStatus, updatedAt: new Date() })
        .where(eq(paymentMethods.id, id));

      // Admin log
      await db.insert(adminLogs).values({
        id: uuidv4(),
        adminId: req.user.id,
        action: 'TOGGLE_PAYMENT_METHOD_STATUS',
        details: `Changed payment method ${existing.name} status to ${newStatus ? 'ACTIVE' : 'INACTIVE'}`,
        createdAt: new Date(),
      });

      return res.json({
        message: `تم ${newStatus ? 'تفعيل' : 'تعطيل'} طريقة الدفع بنجاح`,
        isActive: newStatus,
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin: Delete payment method
  async deletePaymentMethod(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = (
        await db.select().from(paymentMethods).where(eq(paymentMethods.id, id))
      )[0];

      if (!existing) {
        return res.status(404).json({ error: 'طريقة الدفع غير موجودة' });
      }

      await db.delete(paymentMethods).where(eq(paymentMethods.id, id));

      // Admin log
      await db.insert(adminLogs).values({
        id: uuidv4(),
        adminId: req.user.id,
        action: 'DELETE_PAYMENT_METHOD',
        details: `Deleted payment method ${existing.name} (id: ${id})`,
        createdAt: new Date(),
      });

      return res.json({ message: 'تم حذف طريقة الدفع بنجاح' });
    } catch (error) {
      next(error);
    }
  },
};
