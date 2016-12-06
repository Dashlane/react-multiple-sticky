declare module 'react-virtualized' {
  interface AutoSizerProps extends __React.Props<AutoSizer> {
    disableHeight?: boolean
    disableWidth?: boolean
    onResize?: (params: { height: number, width: number }) => void
  }
  export class AutoSizer extends __React.Component<AutoSizerProps, {}> { }
  type rowHeightFunc = (params: { index: number }) => number
  interface ListProps {
    autoHeight?: boolean
    className?: string
    estimatedRowSize?: number
    height: number
    id?: string
    noRowsRenderer?: () => any
    onRowsRendered?: () => void
    onScroll?: (params: { clientHeight: number, scrollHeight: number, scrollTop: number }) => void
    overscanRowCount?: number
    rowCount: number
    rowHeight: number | rowHeightFunc
    rowRenderer: (params: { index: number, key: string, style: Object, isScrolling: boolean }) => __React.ReactNode
    scrollToAlignment?: string
    scrollToIndex?: number
    scrollTop?: number
    style?: __React.CSSProperties
    tabIndex?: number
    width: number
  }
  export class List extends __React.Component<ListProps, {}> { }
}
