import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Check, ChevronDown, Search } from 'lucide-react'

import './SearchableSelect.css'

export type SearchableSelectOption = {
  value: string
  label: string
}

type SearchableSelectProps = {
  id: string
  value: string
  options: SearchableSelectOption[]
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  onChange: (value: string) => void
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function SearchableSelect({
  id,
  value,
  options,
  placeholder = 'Pesquisar...',
  emptyMessage = 'Nenhuma opção encontrada.',
  disabled = false,
  onChange,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(
    (option) => option.value === value,
  )

  const [query, setQuery] = useState(
    selectedOption?.label ?? '',
  )

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setQuery(selectedOption?.label ?? '')
  }, [selectedOption?.label])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handlePointerDown,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handlePointerDown,
      )
    }
  }, [])

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    if (!normalizedQuery) {
      return options
    }

    return options.filter((option) =>
      normalizeText(option.label).includes(
        normalizedQuery,
      ),
    )
  }, [options, query])

  function handleInputChange(
    newQuery: string,
  ) {
    setQuery(newQuery)
    setIsOpen(true)

    if (
      selectedOption &&
      newQuery !== selectedOption.label
    ) {
      onChange('')
    }
  }

  function handleSelect(
    option: SearchableSelectOption,
  ) {
    onChange(option.value)
    setQuery(option.label)
    setIsOpen(false)
  }

  function handleFocus() {
    if (disabled) {
      return
    }

    setIsOpen(true)
  }

  return (
    <div
      className="searchable-select"
      ref={containerRef}
    >
      <div
        className={`searchable-select__control ${
          isOpen
            ? 'searchable-select__control--open'
            : ''
        }`}
      >
        <Search
          className="searchable-select__search-icon"
          size={16}
          strokeWidth={1.8}
        />

        <input
          id={id}
          type="text"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onFocus={handleFocus}
          onChange={(event) =>
            handleInputChange(
              event.target.value,
            )
          }
        />

        <button
          className="searchable-select__toggle"
          type="button"
          disabled={disabled}
          aria-label="Abrir opções"
          onClick={() =>
            setIsOpen((current) => !current)
          }
        >
          <ChevronDown
            size={16}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {isOpen && !disabled && (
        <div
          className="searchable-select__dropdown"
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <div className="searchable-select__empty">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option) => {
              const selected =
                option.value === value

              return (
                <button
                  className={`searchable-select__option ${
                    selected
                      ? 'searchable-select__option--selected'
                      : ''
                  }`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  key={option.value}
                  onMouseDown={(event) =>
                    event.preventDefault()
                  }
                  onClick={() =>
                    handleSelect(option)
                  }
                >
                  <span>
                    {option.label}
                  </span>

                  {selected && (
                    <Check
                      size={15}
                      strokeWidth={2}
                    />
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}