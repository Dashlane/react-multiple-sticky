import * as React from 'react'
import * as ReactDOM from 'react-dom'

import StickyElement from './element'

export interface Props extends React.Props<StickyContainer> {
  className?: string
  contentClassName?: string
  stickyClassName?: string
  stickyTransitionClassName?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
}

export interface State {
  ref: string
  top: number
  height: number
  width: number
}

let scheduled = false

export default class StickyContainer extends React.Component<Props, State> {
  public refs: {
    [k: string]: React.ReactInstance
    container: HTMLDivElement
  }

  public constructor(props: Props) {
    super(props)
    this.state = {
      ref: null,
      top: 0,
      height: 0,
      width: 0
    }
  }

  public render() {
    const style = Object.assign({}, this.props.style, { overflowY: 'auto', position: 'relative', zIndex: 100 })
    const contentStyle = Object.assign({}, this.props.contentStyle, { position: 'relative' })
    return <div ref="container" style={style} onScroll={this.onScrollHandler} className={this.props.className}>
      <div className={this.props.contentClassName} style={contentStyle}>
        {this.getCover() }
        {this.getSticky() }
        {this.getChildren() }
      </div>
    </div>
  }

  public refresh() {
    this.onScrollHandler()
  }

  public scrollToTop() {
    // in some cases we want want to reset everything (when for example list of items change).
    // this will also trigger onScrollHandler
    this.refs.container.scrollTop = 0
  }

  public currentStickyElementIdentifier() {
    const currentStickyElement = this.refs[this.state.ref] as StickyElement
    if(!currentStickyElement) {
      return
    }
    return currentStickyElement.props.identifier
  }

  private onScrollHandler = () => {
    if (scheduled) {
      return
    }
    scheduled = true
    window.requestAnimationFrame(() => {
      this.stickyHeaderHandler()
      scheduled = false
    })
  }

  private stickyHeaderHandler = () => {
    const container = this.refs.container
    const state: any = {
      ref: null,
      top: null,
      height: 0,
      width: 0
    }
    if (container.scrollTop === 0) {
      this.setState(state)
      return
    }
    let sticky = this.state.ref ? ReactDOM.findDOMNode(this.refs[this.state.ref]) as HTMLElement : null
    let node: any = {
      ref: this.state.ref,
      top: sticky ? sticky.offsetTop : null,
      height: sticky ? sticky.getBoundingClientRect().height : 0,
      width: sticky ? sticky.getBoundingClientRect().width : 0
    }
    if (sticky && sticky.offsetTop >= container.scrollTop) {
      node = state
    }
    Object.keys(this.refs)
      .filter(ref => ref.startsWith('sticky_'))
      .forEach(ref => {
        const element = ReactDOM.findDOMNode(this.refs[ref]) as HTMLElement
        const offsetTop = element.offsetTop
        // Snap to grid of 2px to avoid side effect due to zoom and non-integer pixel values
        if (container.scrollTop + 2 >= offsetTop) {
          if (node && node.top && node.top >= offsetTop) return
          // In case we're scrolling back and reach previous sticky header
          node = {
            ref,
            top: offsetTop - element.offsetHeight,
            height: element.getBoundingClientRect().height,
            width: element.getBoundingClientRect().width
          }
          sticky = element
        } else if (sticky) {
          // In case we're scrolling back
          if (container.scrollTop + sticky.offsetHeight >= offsetTop) {
            state.top = offsetTop - sticky.offsetHeight
          }
        }
      })
    if (node && node.ref) {
      if (node.ref === this.state.ref && state.top === this.state.top) return
      state.ref = node.ref
      state.height = node.height
      state.width = node.width
    }
    this.setState(state)
  }

  private getContainerTopPosition() {
    return this.refs.container.getBoundingClientRect().top
  }

  private getCover = () => {
    if (!this.state.ref)
      return null
    const style = {
      width: this.state.width + 'px',
      height: this.state.height + 'px',
      position: 'fixed',
      top: this.getContainerTopPosition(),
      background: 'white',
      zIndex: 10
    }
    return <div style={style}></div>
  }

  private getSticky = () => {
    if (!this.state.ref)
      return null
    const inTransition = this.state.top !== null
    const sticky = this.refs[this.state.ref] as StickyElement
    const style = Object.assign({}, {
      width: this.state.width + 'px',
      height: this.state.height + 'px',
      position: inTransition ? 'absolute' : 'fixed',
      top: inTransition ? this.state.top : this.getContainerTopPosition(),
      zIndex: 20
    })
    const className = inTransition
      ? this.props.stickyTransitionClassName
      : this.props.stickyClassName
    return <div
      className={className}
      style={style}>
      {React.createElement(StickyElement, Object.assign({}, sticky.props, {
        style: Object.assign({}, sticky.props.style || {}, {
          visibility: 'visible'
        })
      })) }
    </div>
  }

  private getChildren = () => {
    return React.Children.map(this.props.children, (child: React.ReactElement<any>, idx: number) => {
      if (child.type === StickyElement) {
        return React.cloneElement(child, {
          ref: `sticky_${idx}`,
          style: {
            position: 'relative',
            visibility: this.state.ref === `sticky_${idx}` ? 'hidden' : 'visible',
            zIndex: this.state.ref === `sticky_${idx}` ? 5 : 15
          }
        })
      }
      return child
    })
  }
}
