import { ShippingSettings } from '../types';

export interface CalculationParams {
  price: number;
  dimensionsStr: string;
  settings: ShippingSettings;
}

export interface CalculationResult {
  usaCost: number;
  canadaCost: number;
  error: string | null;
}

/**
 * Calculates shipping costs for USA and Canada based on new logic.
 */
export function calculateNewShippingCosts({ price, dimensionsStr, settings }: CalculationParams): CalculationResult {
  // Validate settings first
  if (!settings) {
    return { usaCost: 0, canadaCost: 0, error: 'Configuración de envío no disponible.' };
  }

  if (!dimensionsStr || price <= 0) {
    return { usaCost: 0, canadaCost: 0, error: null };
  }

  const dimensions = dimensionsStr.split(/[xX]/).map(d => parseFloat(d.trim()));

  if (dimensions.length !== 3 || dimensions.some(d => isNaN(d) || d <= 0)) {
    return { usaCost: 0, canadaCost: 0, error: 'Formato de medidas de caja inválido (ej: 40x30x20).' };
  }

  const [length, width, height] = dimensions;

  // Ensure settings are valid to prevent division by zero
  if (settings.divisorVolumetrico <= 0 || settings.divisorIVA <= 0) {
    return { usaCost: 0, canadaCost: 0, error: 'Los divisores en ajustes deben ser mayores a cero.' };
  }

  const volumetricWeight = (length * width * height) / settings.divisorVolumetrico;
  const netValue = price / settings.divisorIVA;
  const insuranceCost = netValue * settings.tasaSeguro;

  const usaSubtotal = (volumetricWeight * settings.costoPorKiloUSA) + settings.costoGuiaUSA + insuranceCost;
  const canadaSubtotal = (volumetricWeight * settings.costoPorKiloCanada) + settings.costoGuiaCanada + insuranceCost;

  // Apply IVA to final shipping cost
  const usaCost = usaSubtotal * settings.divisorIVA;
  const canadaCost = canadaSubtotal * settings.divisorIVA;

  return {
    usaCost: Math.round(usaCost * 100) / 100, // Round to 2 decimal places
    canadaCost: Math.round(canadaCost * 100) / 100,
    error: null,
  };
}
