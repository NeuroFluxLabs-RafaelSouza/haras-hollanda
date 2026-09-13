import type {
  ChangeEvent,
  InputHTMLAttributes,
} from 'react'

import './MoneyInput.css'

type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> & {
  value: number
  onChange: (value: number) => void
}

function formatCurrencyFromCents(
  cents: number,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    },
  ).format(cents / 100)
}

export function MoneyInput({
  value,
  onChange,
  className = '',
  ...inputProps
}: MoneyInputProps) {
  const cents =
    Math.round(value * 100)

  function handleChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const digits =
      event.target.value.replace(
        /\D/g,
        '',
      )

    if (!digits) {
      onChange(0)
      return
    }

    const nextCents =
      Number(digits)

    onChange(
      nextCents / 100,
    )
  }

  return (
    <input
      {...inputProps}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={`money-input ${className}`.trim()}
      value={formatCurrencyFromCents(
        cents,
      )}
      onChange={handleChange}
    />
  )
}