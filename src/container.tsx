import * as React from 'react'
import * as ReactDOM from 'react-dom'

import StickyElement from './element'

export interface Props extends React.Props<StickyContainer> {
  className?: string
  contentClassName?: string
  stickyClassName?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
}

export interface State {
  key: string
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
      key: null,
      top: 0,
      height: 0,
      width: 0
    }
  }

  public render() {
    const style = Object.assign({}, this.props.style, { overflowY: 'auto' })
    const contentStyle = Object.assign({}, this.props.contentStyle, { position: 'relative' })
    return <div ref="container" style={style} onScroll={this.onScrollHandler} className={this.props.className}>
      <div className={this.props.contentClassName} style={contentStyle}>
        {this.getCover() }
        {this.getSticky() }
        {this.getChildren() }
      </div>
    </div>
  }

  private onScrollHandler = (e: React.MouseEvent) => {
    if (scheduled) {
      return
    }
    const container = e.target as HTMLElement
    scheduled = true
    window.requestAnimationFrame(() => {
      this.stickyHeaderHandler(container)
      scheduled = false
    })
  }

  private stickyHeaderHandler = (container: HTMLElement) => {
    const sticky = this.state.key ? ReactDOM.findDOMNode(this.refs[this.state.key]) as HTMLElement : null
    const state: any = {
      key: null,
      top: null,
      height: 0,
      width: 0
    }
    let node: any = {
      key: this.state.key,
      top: sticky ? sticky.offsetTop : null,
      height: sticky ? sticky.getBoundingClientRect().height : 0,
      width: sticky ? sticky.getBoundingClientRect().width : 0
    }
    if (sticky && sticky.offsetTop >= container.scrollTop) {
      node = state
    }
    Object.keys(this.refs)
      .filter(key => key.startsWith('sticky_') && key !== this.state.key)
      .forEach(key => {
        const element = ReactDOM.findDOMNode(this.refs[key]) as HTMLElement
        const offsetTop = element.offsetTop
        if (container.scrollTop > offsetTop) {
          if (node && node.top && node.top > offsetTop) return
          // In case we're scrolling back and reach previous sticky header
          const top = container.scrollTop + element.offsetHeight > offsetTop
            ? offsetTop - element.offsetHeight
            : null
          node = {
            key,
            top: top || offsetTop,
            height: element.getBoundingClientRect().height,
            width: element.getBoundingClientRect().width
          }
        } else if (sticky) {
          // In case we're scrolling back
          if (container.scrollTop + sticky.offsetHeight > offsetTop) {
            state.top = offsetTop - sticky.offsetHeight
          }
        }
      })
    if (node && node.key) {
      if (node.key === this.state.key && state.top === this.state.top) return
      state.key = node.key
      state.height = node.height
      state.width = node.width
    }
    this.setState(state)
  }

  private getCover = () => {
    if (!this.state.key)
      return null
    const style = {
      width: this.state.width + 'px',
      height: this.state.height + 'px',
      position: 'fixed',
      top: this.refs.container.offsetTop + 'px',
      background: 'white',
      zIndex: 10
    }
    return <div style={style}></div>
  }

  private getSticky = () => {
    if (!this.state.key)
      return null
    const sticky = this.refs[this.state.key] as StickyElement
    const style = Object.assign({}, {
      width: this.state.width + 'px',
      height: this.state.height + 'px',
      position: this.state.top !== null ? 'absolute' : 'fixed',
      top: this.state.top !== null ? this.state.top + 'px' : this.refs.container.offsetTop + 'px',
      zIndex: 20
    })
    return <div
      className={this.props.stickyClassName}
      style={style}>
      {React.createElement(StickyElement, sticky.props) }
    </div>
  }

  private getChildren = () => {
    return React.Children.map(this.props.children, (child: React.ReactElement<any>, idx: number) => {
      if (child.type === StickyElement) {
        return React.cloneElement(child, {
          ref: `sticky_${idx}`,
          style: {
            position: 'relative',
            zIndex: this.state.key === `sticky_${idx}` ? -15 : 15
          }
        })
      }
      return child
    })
  }
}
