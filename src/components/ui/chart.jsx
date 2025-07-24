import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = {
  light: "",
  dark: ".dark"
}

const ChartContext = React.createContext(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}>
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({
  id,
  config
}) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme || config.color)

  if (!colorConfig.length) {
    return null
  }

  // Generate CSS custom properties safely using React refs and useEffect
  React.useEffect(() => {
    const chartElement = document.querySelector(`[data-chart="${id}"]`)
    if (!chartElement) return

    // Clear existing custom properties safely
    colorConfig.forEach(([key]) => {
      const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '')
      if (safeKey === key) {
        chartElement.style.removeProperty(`--color-${safeKey}`)
      }
    })

    // Apply theme-specific colors safely
    Object.entries(THEMES).forEach(([theme, prefix]) => {
      const shouldApply = theme === 'light' || 
        (theme === 'dark' && document.documentElement.classList.contains('dark'))
      
      if (shouldApply) {
        colorConfig.forEach(([key, itemConfig]) => {
          const color = itemConfig.theme?.[theme] || itemConfig.color
          if (color && isValidColor(color)) {
            // Additional security: escape the key to prevent CSS injection through property names
            const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '')
            if (safeKey === key) { // Only proceed if key didn't need escaping
              chartElement.style.setProperty(`--color-${safeKey}`, color)
            }
          }
        })
      }
    })

    // Cleanup on unmount with same security checks
    return () => {
      if (chartElement) {
        colorConfig.forEach(([key]) => {
          const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '')
          if (safeKey === key) {
            chartElement.style.removeProperty(`--color-${safeKey}`)
          }
        })
      }
    }
  }, [id, config, colorConfig])

  return null // No style element needed - using CSS custom properties directly
}

/**
 * Validate color values to prevent CSS injection attacks
 * This function provides comprehensive protection against XSS and CSS injection
 */
function isValidColor(color) {
  if (typeof color !== 'string') return false
  
  const trimmedColor = color.trim()
  
  // Reject empty strings and extremely long values (DoS protection)
  if (!trimmedColor || trimmedColor.length > 50) return false
  
  // Reject dangerous keywords and patterns that could enable CSS injection
  const dangerousPatterns = [
    /javascript:/i,
    /expression\(/i,
    /url\(/i,
    /import/i,
    /@import/i,
    /binding/i,
    /behavior/i,
    /vbscript:/i,
    /data:/i,
    /\\/,  // Backslashes can be used for escaping
    /[<>]/,  // HTML tags
    /[{}]/,  // CSS braces outside of valid contexts
    /;/,     // Semicolons could terminate CSS and inject new properties
  ]
  
  // Check for dangerous patterns
  if (dangerousPatterns.some(pattern => pattern.test(trimmedColor))) {
    return false
  }
  
  // Strict validation for allowed color formats
  const validColorPatterns = [
    // Hex colors: #RGB, #RRGGBB, #RRGGBBAA
    /^#[0-9A-Fa-f]{3}$/,
    /^#[0-9A-Fa-f]{6}$/,
    /^#[0-9A-Fa-f]{8}$/,
    
    // RGB/RGBA with strict number validation
    /^rgb\(\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*\)$/,
    /^rgba\(\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*(0|1|0\.[0-9]+)\s*\)$/,
    
    // HSL/HSLA with strict number validation
    /^hsl\(\s*(3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])\s*,\s*(100|[1-9]?[0-9])%\s*,\s*(100|[1-9]?[0-9])%\s*\)$/,
    /^hsla\(\s*(3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])\s*,\s*(100|[1-9]?[0-9])%\s*,\s*(100|[1-9]?[0-9])%\s*,\s*(0|1|0\.[0-9]+)\s*\)$/,
  ]
  
  // CSS named colors (whitelist approach for maximum security)
  const allowedNamedColors = [
    'transparent', 'currentColor', 'inherit', 'initial', 'unset',
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
    'gray', 'grey', 'darkred', 'darkgreen', 'darkblue', 'orange', 'purple',
    'brown', 'pink', 'lime', 'navy', 'teal', 'silver', 'maroon', 'olive'
  ]
  
  // Check if it matches any valid pattern or is an allowed named color
  const isValidPattern = validColorPatterns.some(pattern => pattern.test(trimmedColor))
  const isValidNamedColor = allowedNamedColors.includes(trimmedColor.toLowerCase())
  
  return isValidPattern || isValidNamedColor
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey
}) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const value =
      !labelKey && typeof label === "string"
        ? config[label]?.label || label
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null
    }

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}>
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const indicatorColor = color || item.payload.fill || item.color

          return (
            <div
              key={item.dataKey}
              className={cn(
                "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                indicator === "dot" && "items-center"
              )}>
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn("shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)", {
                          "h-2.5 w-2.5": indicator === "dot",
                          "w-1": indicator === "line",
                          "w-0 border-[1.5px] border-dashed bg-transparent":
                            indicator === "dashed",
                          "my-0.5": nestLabel && indicator === "dashed",
                        })}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor
                          }
                        } />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}>
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey
}) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}>
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          <div
            key={item.value}
            className={cn(
              "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3"
            )}>
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }} />
            )}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config,
  payload,
  key
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey = key

  if (
    key in payload &&
    typeof payload[key] === "string"
  ) {
    configLabelKey = payload[key]
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key] === "string"
  ) {
    configLabelKey = payloadPayload[key]
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
