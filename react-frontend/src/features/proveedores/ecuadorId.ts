export type EcuadorIdType = "cedula" | "ruc_natural" | "unknown"

export type EcuadorIdValidation =
  | { type: "cedula"; isValid: true }
  | { type: "ruc_natural"; isValid: true }
  | {
      type: EcuadorIdType
      isValid: false
      error: "Formato incorrecto" | "Cédula inválida" | "RUC inválido"
    }

const onlyDigits = (value: string) => value.replace(/\D/g, "")

const isValidProvinceCode = (province: number) => province >= 1 && province <= 24

/**
 * Valida cédula ecuatoriana (10 dígitos) para persona natural.
 * Reglas:
 * - 10 dígitos
 * - provincia 01-24
 * - tercer dígito 0-5
 * - dígito verificador según algoritmo Módulo 10
 */
export const validateEcuadorianCedula = (rawValue: string): boolean => {
  const value = onlyDigits(rawValue)
  if (!/^\d{10}$/.test(value)) return false

  const province = Number(value.slice(0, 2))
  if (!Number.isFinite(province) || !isValidProvinceCode(province)) return false

  const thirdDigit = Number(value[2])
  if (thirdDigit > 5) return false

  const digits = value.split("").map((d) => Number(d))
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]

  const sum = coefficients.reduce((acc, coef, idx) => {
    const product = digits[idx] * coef
    return acc + (product >= 10 ? product - 9 : product)
  }, 0)

  const expectedCheckDigit = (10 - (sum % 10)) % 10
  const checkDigit = digits[9]
  return expectedCheckDigit === checkDigit
}

/**
 * Valida RUC de persona natural (13 dígitos).
 * Reglas:
 * - 13 dígitos
 * - primeros 10 deben ser cédula válida
 * - termina en 001
 */
export const validateEcuadorianRucNatural = (rawValue: string): boolean => {
  const value = onlyDigits(rawValue)
  if (!/^\d{13}$/.test(value)) return false
  if (!value.endsWith("001")) return false
  return validateEcuadorianCedula(value.slice(0, 10))
}

export const detectEcuadorIdType = (rawValue: string): EcuadorIdType => {
  const value = onlyDigits(rawValue)
  if (value.length === 10) return "cedula"
  if (value.length === 13) return value.endsWith("001") ? "ruc_natural" : "unknown"
  return "unknown"
}

export const validateEcuadorId = (rawValue: string): EcuadorIdValidation => {
  const value = onlyDigits(rawValue)

  if (value.length === 0) {
    return { type: "unknown", isValid: false, error: "Formato incorrecto" }
  }

  if (!/^\d+$/.test(value)) {
    return { type: "unknown", isValid: false, error: "Formato incorrecto" }
  }

  if (value.length === 10) {
    return validateEcuadorianCedula(value)
      ? { type: "cedula", isValid: true }
      : { type: "cedula", isValid: false, error: "Cédula inválida" }
  }

  if (value.length === 13) {
    // Para este módulo, solo aceptamos RUC de persona natural.
    if (!value.endsWith("001")) {
      return { type: "ruc_natural", isValid: false, error: "RUC inválido" }
    }
    return validateEcuadorianRucNatural(value)
      ? { type: "ruc_natural", isValid: true }
      : { type: "ruc_natural", isValid: false, error: "RUC inválido" }
  }

  return { type: "unknown", isValid: false, error: "Formato incorrecto" }
}

export const formatEcuadorIdTypeLabel = (type: EcuadorIdType) => {
  switch (type) {
    case "cedula":
      return "Cédula"
    case "ruc_natural":
      return "RUC"
    default:
      return ""
  }
}
