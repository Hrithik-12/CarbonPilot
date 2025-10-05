import type { NextApiRequest, NextApiResponse } from 'next';
import { calculateBatchFootprint } from '@/app/lib/calculationService';
import type { ProductData, BatchCalculationResult } from '@/types/carbon';

type ApiResponse = BatchCalculationResult | { error: string };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { products } = req.body;

    // Validation
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Invalid data format. Expected array of products.' });
    }

    if (products.length === 0) {
      return res.status(400).json({ error: 'No products provided' });
    }

    // Calculate footprint
    const results = calculateBatchFootprint(products as ProductData[]);

    return res.status(200).json(results);
  } catch (error) {
    console.error('Calculation error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Calculation failed' 
    });
  }
}