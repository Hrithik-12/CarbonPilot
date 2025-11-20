import { NextRequest, NextResponse } from 'next/server';
import type { ProductData } from '@/types/carbon';
import fs from 'fs';
import path from 'path';

// Read emission data directly to avoid import issues
function loadEmissionData() {
  const filePath = path.join(process.cwd(), 'app', 'data', 'emission-factor.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

// Inline calculation function to avoid module issues
function calculateProductFootprint(product: ProductData, emissionData: any) {
  const materialType = product["Material Type"];
  const weight = parseFloat(String(product["Weight (kg)"]));
  const quantity = parseInt(String(product["Quantity"]));

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

  const materialData = emissionData.materials[materialType];

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

function calculateBatchFootprint(products: ProductData[], emissionData: any) {
  const results = products.map((product) => calculateProductFootprint(product, emissionData));

  const validResults = results.filter((r) => !r.error);
  const errorResults = results
    .filter((r) => r.error)
    .map((r) => ({
      productName: r.productName,
      error: r.error || "Unknown error",
    }));

  const totalEmissions = validResults.reduce((sum, r) => sum + r.materialEmissions, 0);
  const totalWeight = validResults.reduce((sum, r) => sum + r.totalWeight, 0);
  const averageEmissions = validResults.length > 0 ? totalEmissions / validResults.length : 0;

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check if file is CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { ok: false, error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { ok: false, error: 'CSV file is empty or has no data rows' },
        { status: 400 }
      );
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim());

    // Validate required columns
    const requiredColumns = ['Product Name', 'Material Type', 'Weight (kg)', 'Quantity'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { 
          ok: false, 
          error: `Missing required columns: ${missingColumns.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Parse CSV rows into ProductData objects
    const products: ProductData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        continue; // Skip malformed rows
      }

      const product: any = {};
      headers.forEach((header, index) => {
        product[header] = values[index];
      });

      products.push(product as ProductData);
    }

    if (products.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No valid product data found in CSV' },
        { status: 400 }
      );
    }

    // Load emission data and calculate carbon footprint
    const emissionData = loadEmissionData();
    const calculationResult = calculateBatchFootprint(products, emissionData);

    // Format as JSON string (same format as current dataSnapshot)
    const dataSnapshot = JSON.stringify(calculationResult, null, 2);

    return NextResponse.json({
      ok: true,
      data: {
        dataSnapshot,
        productsProcessed: products.length,
        summary: calculationResult.summary,
      },
    });
  } catch (error) {
    console.error('CSV processing error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Failed to process CSV file' 
      },
      { status: 500 }
    );
  }
}
