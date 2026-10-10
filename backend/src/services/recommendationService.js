// StockPulse AI Supplier Recommendation & Trade-Off Engine

function evaluateSuppliers({ item, quotes, requestedQuantity = 10, daysUntilStockout = 3 }) {
  if (!quotes || quotes.length === 0) {
    return {
      recommended: null,
      comparisons: [],
      explanation: "No supplier quotes recorded for this item yet."
    };
  }

  const currentStock = item.currentStock || 0;
  const minThreshold = item.minThreshold || 10;
  const qty = Math.max(1, requestedQuantity);

  // Determine urgency level
  let urgency = "NORMAL";
  if (currentStock === 0) urgency = "CRITICAL_STOCKOUT";
  else if (daysUntilStockout <= (item.leadTimeDays || 3)) urgency = "CRITICAL";
  else if (currentStock <= minThreshold) urgency = "HIGH";

  // Dynamic weights based on Urgency
  let weights;
  if (urgency === "CRITICAL_STOCKOUT" || urgency === "CRITICAL") {
    // Immediate stockout danger: Speed & Reliability are prioritized
    weights = { price: 0.15, time: 0.40, reliability: 0.30, quality: 0.15 };
  } else if (urgency === "HIGH") {
    weights = { price: 0.30, time: 0.30, reliability: 0.25, quality: 0.15 };
  } else {
    // Normal planned procurement: Cost efficiency is prioritized
    weights = { price: 0.45, time: 0.15, reliability: 0.25, quality: 0.15 };
  }

  // Find minimum price and lead time to normalize
  const minPrice = Math.min(...quotes.map((q) => q.unitPrice));
  const minDays = Math.min(...quotes.map((q) => q.deliveryDays));

  const comparisons = quotes.map((q) => {
    const s = q.supplier;
    const totalCost = Number((q.unitPrice * qty).toFixed(2));

    // Normalized scores (0 - 100)
    const priceScore = minPrice > 0 ? (minPrice / q.unitPrice) * 100 : 100;
    const timeScore = minDays > 0 ? (minDays / Math.max(1, q.deliveryDays)) * 100 : 100;
    const reliabilityScore = s.reliabilityRate || 90.0;
    const qualityScore = Math.max(0, 100 - (s.defectRate || 1.0) * 10);

    const compositeScore = Number(
      (
        weights.price * priceScore +
        weights.time * timeScore +
        weights.reliability * reliabilityScore +
        weights.quality * qualityScore
      ).toFixed(1)
    );

    return {
      supplierId: s.id,
      supplierName: s.name,
      supplierCode: s.code,
      contactPerson: s.contactPerson,
      email: s.email,
      phone: s.phone,
      rating: s.rating,
      unitPrice: q.unitPrice,
      totalCost,
      deliveryDays: q.deliveryDays,
      reliabilityRate: s.reliabilityRate,
      defectRate: s.defectRate,
      isPreferred: q.isPreferred,
      minOrderQty: q.minOrderQty,
      scores: {
        composite: compositeScore,
        priceScore: Math.round(priceScore),
        timeScore: Math.round(timeScore),
        reliabilityScore: Math.round(reliabilityScore),
        qualityScore: Math.round(qualityScore)
      }
    };
  });

  // Sort descending by composite score
  comparisons.sort((a, b) => b.scores.composite - a.scores.composite);
  const best = comparisons[0];
  const runnerUp = comparisons.length > 1 ? comparisons[1] : null;

  // Generate plain-language AI trade-off analysis
  let explanation = "";
  if (runnerUp) {
    const priceDiff = Math.abs(best.unitPrice - runnerUp.unitPrice).toFixed(2);
    const timeDiff = Math.abs(best.deliveryDays - runnerUp.deliveryDays);

    if (urgency === "CRITICAL" || urgency === "CRITICAL_STOCKOUT") {
      if (best.deliveryDays < runnerUp.deliveryDays) {
        explanation = `💡 AI Recommendation: Choose **${best.supplierName}** (Score: ${best.scores.composite}/100).\n` +
          `• **Urgency Trade-Off**: Current stock (${currentStock} ${item.unit}) risks a stockout within ${daysUntilStockout} days.\n` +
          `• Although **${runnerUp.supplierName}** offers a lower price ($${runnerUp.unitPrice} vs $${best.unitPrice}, saving $${priceDiff}/${item.unit}), ` +
          `their ${runnerUp.deliveryDays}-day delivery risks stalling operations for ${runnerUp.deliveryDays - daysUntilStockout} days.\n` +
          `• **${best.supplierName}** delivers in just ${best.deliveryDays} days with a proven **${best.reliabilityRate}% on-time delivery record** and low ${best.defectRate}% defect rate, protecting lab/campus continuity.`;
      } else {
        explanation = `💡 AI Recommendation: Choose **${best.supplierName}** (Score: ${best.scores.composite}/100).\n` +
          `• Delivers highest overall reliability (${best.reliabilityRate}%) and superior product quality (${best.defectRate}% defect rate) at $${best.unitPrice}/${item.unit}.`;
      }
    } else {
      if (best.unitPrice <= runnerUp.unitPrice) {
        explanation = `💡 AI Recommendation: Choose **${best.supplierName}** (Score: ${best.scores.composite}/100).\n` +
          `• **Cost & Speed Winner**: Offers the lowest price at $${best.unitPrice}/${item.unit} (Total: $${best.totalCost}) with fast ${best.deliveryDays}-day transit.\n` +
          `• Outperforms **${runnerUp.supplierName}** while maintaining a ${best.reliabilityRate}% on-time reliability score.`;
      } else {
        explanation = `💡 AI Recommendation: Choose **${best.supplierName}** (Score: ${best.scores.composite}/100).\n` +
          `• **Balanced Quality Trade-Off**: Costs slightly more ($${priceDiff}/${item.unit} premium) but guarantees ${best.deliveryDays}-day delivery and an outstanding ${best.reliabilityRate}% reliability record compared to ${runnerUp.reliabilityRate}% for ${runnerUp.supplierName}.`;
      }
    }
  } else {
    explanation = `💡 AI Recommendation: **${best.supplierName}** is the sole verified partner for ${item.name} with ${best.deliveryDays}-day lead time and ${best.reliabilityRate}% recorded on-time fulfillment.`;
  }

  return {
    recommended: best,
    runnerUp,
    urgency,
    weights,
    comparisons,
    explanation
  };
}

module.exports = { evaluateSuppliers };