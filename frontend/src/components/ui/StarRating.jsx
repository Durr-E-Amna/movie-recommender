import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const [hover, setHover] = useState(0)

  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }
  const cls   = sizes[size] || sizes.md

  const stars = [1, 2, 3, 4, 5]
  const active = hover || value

  return (
    <div className="flex items-center gap-0.5">
      {stars.map(s => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-transform ${readonly ? '' : 'hover:scale-110 cursor-pointer'}`}
        >
          <Star
            className={`${cls} transition-colors ${
              s <= active
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-surface-400'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1.5 text-sm text-surface-300">{value.toFixed(1)}</span>
      )}
    </div>
  )
}
