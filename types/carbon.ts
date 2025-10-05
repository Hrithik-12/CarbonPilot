// Emission factor data structure
export interface MaterialEmissionFactor {
  co2_per_kg: number;
  unit: string;
  description: string;
}

export interface TransportEmissionFactor {
  co2_per_km_per_kg: number;
  unit: string;
  description: string;
}

export interface EmissionDatabase {
  materials: {
    [key: string]: MaterialEmissionFactor;
  };
  transportation: {
    [key: string]: TransportEmissionFactor;
  };
}

// Product data from CSV
export interface ProductData {
  'Product Name': string;
  'Material Type': string;
  'Weight (kg)': string | number;
  'Quantity': string | number;
  'Supplier Location'?: string;
  'Destination'?: string;
  'Transportation Mode'?: string;
}

// Calculation results
export interface ProductFootprintResult {
  productName: string;
  materialType: string;
  weight: number;
  quantity: number;
  totalWeight: number;
  materialEmissions: number;
  emissionFactor: number;
  unit: string;
  error?: string;
}

export interface BatchCalculationResult {
  summary: {
    totalProducts: number;
    successfulCalculations: number;
    failedCalculations: number;
    totalEmissions: number;
    totalWeight: number;
    averageEmissionsPerProduct: number;
  };
  results: ProductFootprintResult[];
  errors: Array<{ productName: string; error: string }>;
}