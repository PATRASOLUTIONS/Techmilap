import { forwardRef } from "react"
import { jsx } from "react/jsx-runtime"

const Link = forwardRef(
  /**
   * @param {Omit<import('next/navigation').LinkProps, 'ref'> & React.RefAttributes<HTMLAnchorElement>} props
   */
  function Link(props, ref) {
    return jsx("a", Object.assign({}, props, { ref: ref }))
  },
)
Link.displayName = "Link"

export default Link
