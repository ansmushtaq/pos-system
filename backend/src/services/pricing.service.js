import prisma from '../config/db.js';

export const calculateCostPrice = (purchasePrice, purchaseTaxPercent) => {
  return purchasePrice * (1 + purchaseTaxPercent / 100);
};

export const getPriceHistory = async (productId) => {
  return prisma.productPriceHistory.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: { changedBy: { select: { id: true, fullName: true } } },
  });
};

export const updateProductPrice = async (productId, priceData, changedById) => {
  const { purchasePrice, purchaseTaxPercent, salePrice, changeReason } = priceData;

  return prisma.$transaction(async (tx) => {
    const current = await tx.product.findUnique({ where: { id: productId }, select: { id: true, isDeleted: true, purchasePrice: true, purchaseTaxPercent: true, costPrice: true, salePrice: true } });
    if (!current || current.isDeleted) {
      const err = new Error('Product not found');
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }

    const newCostPrice = calculateCostPrice(
      purchasePrice ?? current.purchasePrice,
      purchaseTaxPercent ?? current.purchaseTaxPercent,
    );

    await tx.productPriceHistory.create({
      data: {
        productId,
        oldPurchasePrice: current.purchasePrice,
        newPurchasePrice: purchasePrice ?? current.purchasePrice,
        oldPurchaseTaxPercent: current.purchaseTaxPercent,
        newPurchaseTaxPercent: purchaseTaxPercent ?? current.purchaseTaxPercent,
        oldCostPrice: current.costPrice,
        newCostPrice,
        oldSalePrice: current.salePrice,
        newSalePrice: salePrice ?? current.salePrice,
        changeReason,
        changedById,
      },
    });

    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        purchasePrice: purchasePrice ?? current.purchasePrice,
        purchaseTaxPercent: purchaseTaxPercent ?? current.purchaseTaxPercent,
        costPrice: newCostPrice,
        salePrice: salePrice ?? current.salePrice,
        updatedById: changedById,
      },
    });

    return updated;
  });
};
