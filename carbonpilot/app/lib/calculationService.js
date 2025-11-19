"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProductFootprint = calculateProductFootprint;
exports.calculateBatchFootprint = calculateBatchFootprint;
exports.getAvailableMaterials = getAvailableMaterials;
exports.getMaterialEmissionFactor = getMaterialEmissionFactor;
exports.getMaterialDetails = getMaterialDetails;
var emission_factor_json_1 = require("../data/emission-factor.json");
// Type assertion for imported JSON
var typedEmissionData = emission_factor_json_1.default;
/**
 * Calculate carbon footprint for a single product (Materials Only)
 */
function calculateProductFootprint(product) {
    var materialType = product["Material Type"];
    var weight = parseFloat(String(product["Weight (kg)"]));
    var quantity = parseInt(String(product["Quantity"]));
    // Validation
    if (isNaN(weight) || isNaN(quantity)) {
        return {
            productName: product["Product Name"],
            materialType: materialType,
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
    var materialData = typedEmissionData.materials[materialType];
    if (!materialData) {
        return {
            productName: product["Product Name"],
            materialType: materialType,
            weight: weight,
            quantity: quantity,
            totalWeight: 0,
            materialEmissions: 0,
            emissionFactor: 0,
            unit: "kg CO2e",
            error: "Material type \"".concat(materialType, "\" not found in database"),
        };
    }
    // Calculate material emissions
    var totalWeight = weight * quantity;
    var materialEmissions = totalWeight * materialData.co2_per_kg;
    return {
        productName: product["Product Name"],
        materialType: materialType,
        weight: weight,
        quantity: quantity,
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        materialEmissions: parseFloat(materialEmissions.toFixed(2)),
        emissionFactor: materialData.co2_per_kg,
        unit: "kg CO2e",
    };
}
/**
 * Calculate footprint for multiple products
 */
function calculateBatchFootprint(products) {
    var results = products.map(function (product) { return calculateProductFootprint(product); });
    // Separate valid results and errors
    var validResults = results.filter(function (r) { return !r.error; });
    var errorResults = results
        .filter(function (r) { return r.error; })
        .map(function (r) { return ({
        productName: r.productName,
        error: r.error || "Unknown error",
    }); });
    // Calculate totals
    var totalEmissions = validResults.reduce(function (sum, r) { return sum + r.materialEmissions; }, 0);
    var totalWeight = validResults.reduce(function (sum, r) { return sum + r.totalWeight; }, 0);
    var averageEmissions = validResults.length > 0 ? totalEmissions / validResults.length : 0;
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
function getAvailableMaterials() {
    return Object.keys(typedEmissionData.materials);
}
/**
 * Get emission factor for a specific material
 */
function getMaterialEmissionFactor(materialType) {
    var material = typedEmissionData.materials[materialType];
    return material ? material.co2_per_kg : null;
}
/**
 * Get detailed info about a material
 */
function getMaterialDetails(materialType) {
    return typedEmissionData.materials[materialType] || null;
}
