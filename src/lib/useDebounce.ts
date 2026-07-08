import { useState, useEffect } from 'react'

// 防抖 hook：value 在 delay ms 内无变化才触发 onChange
export function useDebounce<T>(value: T, delay: number, onChange: (debouncedValue: T) => void): T {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, delay)
    return () => clearTimeout(timer)
  }, [localValue, delay, onChange])

  return localValue
}
