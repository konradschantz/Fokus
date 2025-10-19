import type { CSSProperties } from 'react'

const LOGO_URL = '/brand-logo.svg'

type BrandLogoElement = 'div' | 'span' | 'h1' | 'header'

type BrandLogoProps = {
  as?: BrandLogoElement
  align?: 'left' | 'center'
  size?: number
  wordmarkSize?: string
  showWordmark?: boolean
  wordmarkText?: string
  className?: string
  style?: CSSProperties
}

export default function BrandLogo({
  as = 'div',
  align = 'left',
  size = 64,
  wordmarkSize = '1.5rem',
  showWordmark = true,
  wordmarkText = 'Fokus',
  className = '',
  style,
}: BrandLogoProps) {
  const Component = as as keyof JSX.IntrinsicElements

  const inlineStyle = {
    ...(style ?? {}),
    '--logo-size': `${size}px`,
    '--wordmark-size': wordmarkSize,
  } as CSSProperties

  const classes = [
    'brand-logo',
    align === 'center' ? 'brand-logo--center' : 'brand-logo--left',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} style={inlineStyle}>
      <img src={LOGO_URL} alt={wordmarkText} className="brand-logo__mark" />
      {showWordmark ? (
        <span className="brand-logo__wordmark">{wordmarkText}</span>
      ) : null}
    </Component>
  )
}
