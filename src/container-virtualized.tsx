import 'react-virtualized/styles.css'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { debounce } from 'lodash'
import { AutoSizer, List } from 'react-virtualized'

import StickyElement, { Props as StickyProps } from './element'

export interface Props extends React.Props<StickyContainerVirtualized> {
  width: number
  height: number
  elementHeight: number
  stickyElementHeight?: number
  disableStickyHeader?: boolean
  className?: string
  contentClassName?: string
  stickyClassName?: string
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
  onScroll?: () => void
}

export interface State {
  width: string
  index: number
  top: number
}

let scheduled = false

export default class StickyContainerVirtualized extends React.Component<Props, State> {
  public refs: {
    [k: string]: React.ReactInstance
    container: HTMLDivElement
    list: List
  }

  public constructor(props: Props) {
    super(props)
    this.state = {
      width: '100%',
      index: null,
      top: 0
    }
  }

  public render() {
    const style = Object.assign({}, this.props.style, { overflowY: 'auto', position: 'relative', zIndex: 100 })
    const contentStyle = Object.assign({}, this.props.contentStyle, { position: 'relative' })
    return <div ref="container" style={style} className={this.props.className}>
      <div className={this.props.contentClassName} style={contentStyle}>
        {this.props.disableStickyHeader ? null : this.getCover() }
        {this.props.disableStickyHeader ? null : this.getSticky() }
        {this.getChildren() }
      </div>
    </div>
  }

  public refresh() {
    this.stickyHeaderHandler(ReactDOM.findDOMNode(this.refs.list).scrollTop)
  }

  private scrollHandler = (params: { clientHeight: number, scrollHeight: number, scrollTop: number }) => {
    if (this.props.onScroll) this.props.onScroll()
    if (scheduled) return
    scheduled = true
    window.requestAnimationFrame(() => {
      this.stickyHeaderHandler(params.scrollTop)
      scheduled = false
    })
  }

  public scrollToTop() {
    // in some cases we want want to reset everything (when for example list of items change).
    // this will also trigger onScrollHandler
    ReactDOM.findDOMNode(this.refs.list).scrollTop = 0
  }

  public currentStickyElementIdentifier() {
    if(this.state.index === null) {
      return
    }
    const list = React.Children.toArray(this.props.children)
    const currentStickyElement = list[this.state.index] as React.ReactElement<StickyProps>
    if(!currentStickyElement) {
      return
    }
    return currentStickyElement.props.identifier
  }

  private stickyHeaderHandler = (scrollTop: number) => {
    if (scrollTop === 0) {
      if(this.state.index !== null) {
        this.setState({
          width: '100%',
          index: null,
          top: 0
        })
      }
      return
    }
    let scroll = 0
    let index = 0
    let idx = 0
    let top = 0
    let child: React.ReactElement<any> = null
    const list = React.Children.toArray(this.props.children)
    const stickyHeight = this.props.stickyElementHeight || this.props.elementHeight
    while(scrollTop > scroll) {
      child = list[idx] as React.ReactElement<any>
      scroll += child.type === StickyElement ? stickyHeight : this.props.elementHeight
      if (child.type === StickyElement) {
        index = idx
      }
      idx++
    }
    child = list[idx] as React.ReactElement<any>
    if (child.type === StickyElement && scrollTop + stickyHeight > scroll) {
      top = scroll - (scrollTop + stickyHeight)
    }
    if (index !== this.state.index || top !== this.state.top) {
      const width = ReactDOM.findDOMNode(this.refs.list).clientWidth + 'px'
      this.setState({
        width,
        index,
        top
      })
    }
  }

  private getCover = () => {
    if (this.state.index === null || this.state.top !== 0)
      return null
    const style = {
      width: this.state.width,
      height: this.props.stickyElementHeight || this.props.elementHeight,
      position: 'absolute',
      top: 0,
      left: 0,
      background: 'white',
      zIndex: 10
    }
    return <div style={style}></div>
  }

  private getSticky = () => {
    if (this.state.index === null)
      return null
    const list = React.Children.toArray(this.props.children)
    const sticky = list[this.state.index] as React.ReactElement<any>
    const style = {
      width: this.state.width,
      position: 'absolute',
      top: this.state.top,
      zIndex: 20
    }
    return <div
      className={this.props.stickyClassName}
      style={style}>
      {React.createElement(StickyElement, sticky.props) }
    </div>
  }

  private getChildren = () => {
    const stickyHeight = this.props.stickyElementHeight || this.props.elementHeight
    const list = React.Children.toArray(this.props.children)
    const renderRow = ({ index, key, style }) => {
      const child = list[index] as React.ReactElement<any>
      const finalStyle = Object.assign({}, style, child.props.style)
      return React.cloneElement(child, Object.assign({}, child.props, { style: finalStyle }))
    }
    const rowHeight = ({ index}) => {
      const child = list[index] as React.ReactElement<any>
      return child.type === StickyElement ? stickyHeight : this.props.elementHeight
    }
    const scrollHandler = this.props.disableStickyHeader
      ? this.props.onScroll
      : this.scrollHandler
    return <List
      ref="list"
      width={this.props.width}
      height={this.props.height}
      rowCount={list.length}
      rowHeight={rowHeight}
      rowRenderer={renderRow}
      overscanRowCount={100}
      onScroll={scrollHandler}
      style={{ outline: 'none', overflowX: 'hidden' }}
      />
  }
}
