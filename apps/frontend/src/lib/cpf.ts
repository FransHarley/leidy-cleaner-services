export function normalizeCpf(value: string) {
  return value.replace(/\D/g, '');
}

export function formatCpf(value: string) {
  const digits = normalizeCpf(value).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isValidCpf(value: string) {
  const cpf = normalizeCpf(value);

  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const numbers = cpf.split('').map(Number);
  const firstDigit = calculateCheckDigit(numbers, 10);
  const secondDigit = calculateCheckDigit(numbers, 11);

  return firstDigit === numbers[9] && secondDigit === numbers[10];
}

function calculateCheckDigit(numbers: number[], factor: number) {
  const total = numbers
    .slice(0, factor - 1)
    .reduce((sum, digit, index) => sum + digit * (factor - index), 0);

  const remainder = (total * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}
