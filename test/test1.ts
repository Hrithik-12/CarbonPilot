import { calculateProductFootprint, calculateBatchFootprint, getAvailableMaterials } from '../app/lib/calculationService';
import type { ProductData } from '../types/carbon';

console.log('=== Carbon Footprint Calculation Test ===\n');

// Test 1: Single Product
console.log('TEST 1: Single Product Calculation');
const sampleProduct: ProductData = {
  'Product Name': 'Steel Frame',
  'Material Type': 'Steel',
  'Weight (kg)': '15',
  'Quantity': '200'
};

const singleResult = calculateProductFootprint(sampleProduct);
console.log(JSON.stringify(singleResult, null, 2));

// Test 2: Batch Calculation
console.log('\n\nTEST 2: Batch Calculation');
const sampleBatch: ProductData[] = [
  {
    'Product Name': 'Steel Frame',
    'Material Type': 'Steel',
    'Weight (kg)': '15',
    'Quantity': '200'
  },
  {
    'Product Name': 'Plastic Case',
    'Material Type': 'Plastic',
    'Weight (kg)': '0.5',
    'Quantity': '500'
  },
  {
    'Product Name': 'Cotton T-Shirt',
    'Material Type': 'Cotton',
    'Weight (kg)': '0.2',
    'Quantity': '1000'
  },
  {
    'Product Name': 'Unknown Material Item',
    'Material Type': 'Vibranium', // This should error
    'Weight (kg)': '10',
    'Quantity': '50'
  }
];

const batchResult = calculateBatchFootprint(sampleBatch);
console.log(JSON.stringify(batchResult, null, 2));

// Test 3: Available Materials
console.log('\n\nTEST 3: Available Materials');
const materials = getAvailableMaterials();
console.log(`Total materials in database: ${materials.length}`);
console.log(materials.join(', '));