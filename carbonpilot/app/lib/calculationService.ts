import emissionDataImport from "../data/emission-factor.json";
import type {
  EmissionDatabase,
  ProductData,
  ProductFootprintResult,
  BatchCalculationResult,
} from "../../types/carbon";

// Type assertion for imported JSON - handle both default and direct imports
const emissionData = (emissionDataImport as any).default || emissionDataImport;
const typedEmissionData = emissionData as EmissionDatabase;

/**
 * Calculate carbon footprint for a single product (Materials Only)
 */
export function calculateProductFootprint(
  product: ProductData
): ProductFootprintResult {
  const materialType = product["Material Type"];
  const weight = parseFloat(String(product["Weight (kg)"]));
  const quantity = parseInt(String(product["Quantity"]));

  // Validation
  if (isNaN(weight) || isNaN(quantity)) {
    return {
      productName: product["Product Name"],
      materialType,
      weight: 0,
      quantity: 0,
      totalWeight: 0,
      materialEmissions: 0,
      emissionFactor: 0,
      unit: "kg CO2e",
      error: "Invalid weight or quantity values",
    };
  }

  // Get emission factor for material
  const materialData = typedEmissionData.materials[materialType];

  if (!materialData) {
    return {
      productName: product["Product Name"],
      materialType,
      weight,
      quantity,
      totalWeight: 0,
      materialEmissions: 0,
      emissionFactor: 0,
      unit: "kg CO2e",
      error: `Material type "${materialType}" not found in database`,
    };
  }

  // Calculate material emissions
  const totalWeight = weight * quantity;
  const materialEmissions = totalWeight * materialData.co2_per_kg;

  return {
    productName: product["Product Name"],
    materialType,
    weight,
    quantity,
    totalWeight: parseFloat(totalWeight.toFixed(2)),
    materialEmissions: parseFloat(materialEmissions.toFixed(2)),
    emissionFactor: materialData.co2_per_kg,
    unit: "kg CO2e",
  };
}

/**
 * Calculate footprint for multiple products
 */
export function calculateBatchFootprint(
  products: ProductData[]
): BatchCalculationResult {
  const results = products.map((product) => calculateProductFootprint(product));

  // Separate valid results and errors
  const validResults = results.filter((r) => !r.error);
  const errorResults = results
    .filter((r) => r.error)
    .map((r) => ({
      productName: r.productName,
      error: r.error || "Unknown error",
    }));

  // Calculate totals
  const totalEmissions = validResults.reduce(
    (sum, r) => sum + r.materialEmissions,
    0
  );
  const totalWeight = validResults.reduce((sum, r) => sum + r.totalWeight, 0);

  const averageEmissions =
    validResults.length > 0 ? totalEmissions / validResults.length : 0;

  return {
    summary: {
      totalProducts: products.length,
      successfulCalculations: validResults.length,
      failedCalculations: errorResults.length,
      totalEmissions: parseFloat(totalEmissions.toFixed(2)),
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      averageEmissionsPerProduct: parseFloat(averageEmissions.toFixed(2)),
    },
    results: validResults,
    errors: errorResults,
  };
}

/**
 * Get all available materials from database
 */
export function getAvailableMaterials(): string[] {
  return Object.keys(typedEmissionData.materials);
}

/**
 * Get emission factor for a specific material
 */
export function getMaterialEmissionFactor(materialType: string): number | null {
  const material = typedEmissionData.materials[materialType];
  return material ? material.co2_per_kg : null;
}

/**
 * Get detailed info about a material
 */
export function getMaterialDetails(materialType: string) {
  return typedEmissionData.materials[materialType] || null;
}
