/** Tree-shaken ECharts: only the charts & components the app uses (Canvas renderer). Lazy-loaded chunk. */
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, ScatterChart, HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, VisualMapComponent, MarkPointComponent, MarkLineComponent, ToolboxComponent, AriaComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, LineChart, PieChart, ScatterChart, HeatmapChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, VisualMapComponent, MarkPointComponent, MarkLineComponent, ToolboxComponent, AriaComponent, CanvasRenderer])

export { echarts }
