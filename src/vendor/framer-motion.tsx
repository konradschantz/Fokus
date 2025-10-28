import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ElementType,
  type MouseEvent,
  type PointerEvent,
  type Ref,
} from 'react'

type MotionStyle = CSSProperties & {
  x?: number | string
  y?: number | string
  scale?: number | string
}

interface MotionTransition {
  duration?: number
  delay?: number
  easing?: string
  stiffness?: number
  damping?: number
  type?: string
}

type BaseMotionProps<T extends keyof JSX.IntrinsicElements> = Omit<
  JSX.IntrinsicElements[T],
  'style'
> & {
  style?: CSSProperties
  layoutId?: string
  initial?: MotionStyle
  animate?: MotionStyle
  exit?: MotionStyle
  whileHover?: MotionStyle
  whileTap?: MotionStyle
  transition?: MotionTransition
}

function transitionToStyle(transition?: MotionTransition): CSSProperties {
  if (!transition) {
    return {}
  }

  const {
    duration = 0.35,
    easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
    delay = 0,
  } = transition

  return {
    transitionProperty:
      'opacity, transform, background-color, color, box-shadow, border-color, filter',
    transitionDuration: `${duration}s`,
    transitionTimingFunction: easing,
    transitionDelay: `${delay}s`,
  }
}

function createMotionComponent<T extends keyof JSX.IntrinsicElements>(tag: T) {
  type Props = BaseMotionProps<T>

  const MotionComponent = forwardRef<HTMLElement, Props>((props, ref) => {
    const motionProps = props as BaseMotionProps<T>

    const {
      initial,
      animate,
      whileHover,
      whileTap,
      transition,
      layoutId: _layoutId,
      style,
      onMouseEnter,
      onMouseLeave,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      ...rest
    } = motionProps

    const [isAnimating, setIsAnimating] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [isTapping, setIsTapping] = useState(false)

    useEffect(() => {
      if (typeof window === 'undefined') {
        setIsAnimating(true)
        return
      }

      setIsAnimating(false)
      const frame = window.requestAnimationFrame(() => setIsAnimating(true))
      return () => window.cancelAnimationFrame(frame)
    }, [animate, initial])

    const baseStyle = useMemo(() => {
      if (!isAnimating) {
        return { ...(initial ?? animate ?? {}) }
      }
      return { ...(animate ?? initial ?? {}) }
    }, [animate, initial, isAnimating])

    const finalStyle = useMemo(() => {
      const composed: CSSProperties = {
        ...transitionToStyle(transition),
        ...baseStyle,
      }

      if (isHovering && whileHover) {
        Object.assign(composed, whileHover)
      }

      if (isTapping && whileTap) {
        Object.assign(composed, whileTap)
      }

      if (style) {
        Object.assign(composed, style)
      }

      return composed
    }, [baseStyle, isHovering, isTapping, style, transition, whileHover, whileTap])

    const Element = tag as unknown as ElementType

    return (
      <Element
        ref={ref as Ref<unknown>}
        {...(rest as Record<string, unknown>)}
        style={finalStyle}
        onMouseEnter={(event: MouseEvent<any>) => {
          setIsHovering(true)
          onMouseEnter?.(event as never)
        }}
        onMouseLeave={(event: MouseEvent<any>) => {
          setIsHovering(false)
          onMouseLeave?.(event as never)
        }}
        onPointerDown={(event: PointerEvent<any>) => {
          setIsTapping(true)
          onPointerDown?.(event as never)
        }}
        onPointerUp={(event: PointerEvent<any>) => {
          setIsTapping(false)
          onPointerUp?.(event as never)
        }}
        onPointerLeave={(event: PointerEvent<any>) => {
          setIsTapping(false)
          onPointerLeave?.(event as never)
        }}
      />
    )
  })

  MotionComponent.displayName = `Motion.${String(tag)}`

  return MotionComponent
}

type MotionComponent<T extends keyof JSX.IntrinsicElements> = ReturnType<
  typeof createMotionComponent<T>
>

const motionCache: Partial<
  Record<keyof JSX.IntrinsicElements, MotionComponent<keyof JSX.IntrinsicElements>>
> = {}

export const motion = new Proxy(motionCache, {
  get(target, key: keyof JSX.IntrinsicElements) {
    if (!target[key]) {
      target[key] = createMotionComponent(key)
    }
    return target[key]!
  },
}) as {
  [K in keyof JSX.IntrinsicElements]: MotionComponent<K>
}

export const AnimatePresence: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => <>{children}</>

export type { MotionTransition }
export type MotionProps<T extends keyof JSX.IntrinsicElements> = BaseMotionProps<T>

export default motion
