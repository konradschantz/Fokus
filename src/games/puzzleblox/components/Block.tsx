import { forwardRef } from 'react'
import { motion, type MotionProps } from 'framer-motion'

type Variant = 'target' | 'active'

type BaseProps = {
  variant: Variant
  interactive?: boolean
  onClick?: () => void
  layoutId?: string
  isFloating?: boolean
}

type ButtonProps = BaseProps & Omit<MotionProps<'button'>, keyof BaseProps>
type DivProps = BaseProps & Omit<MotionProps<'div'>, keyof BaseProps>

function blockClassName(variant: Variant, interactive?: boolean, isFloating?: boolean) {
  const classes = ['puzzle-blox__block', `puzzle-blox__block--${variant}`]

  if (interactive) {
    classes.push('puzzle-blox__block--interactive')
  }

  if (isFloating) {
    classes.push('puzzle-blox__block--floating')
  }

  return classes.join(' ')
}

const MotionButton = motion.button
const MotionDiv = motion.div

export const BlockButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, interactive, onClick, layoutId, isFloating, ...rest }, ref) => {
    return (
      <MotionButton
        ref={ref}
        type="button"
        layoutId={layoutId}
        onClick={onClick}
        whileTap={{ scale: 0.94 }}
        className={blockClassName(variant, interactive, isFloating)}
        {...rest}
      />
    )
  },
)

BlockButton.displayName = 'BlockButton'

export const BlockStatic = forwardRef<HTMLDivElement, DivProps>(
  ({ variant, interactive, layoutId, isFloating, ...rest }, ref) => {
    return (
      <MotionDiv
        ref={ref}
        layoutId={layoutId}
        className={blockClassName(variant, interactive, isFloating)}
        {...rest}
      />
    )
  },
)

BlockStatic.displayName = 'BlockStatic'
