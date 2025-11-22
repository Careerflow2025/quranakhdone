/**
 * Annotation Coordinate Transformation Utilities
 *
 * Transforms between screen-pixel coordinates and PDF-relative coordinates (0-1 range)
 * to ensure annotations scale correctly with zoom levels.
 *
 * CRITICAL: react-sketch-canvas stores paths in screen pixel coordinates.
 * We must transform these to relative coordinates for zoom-independent storage.
 */

export interface Point {
  x: number;
  y: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

export interface SketchPath {
  paths: Point[];
  strokeColor?: string;
  strokeWidth?: number;
  drawMode?: boolean;
  [key: string]: any;
}

export interface SketchData {
  paths: SketchPath[];
  version?: string;
}

/**
 * Transform screen pixel coordinates to relative coordinates (0-1 range)
 *
 * @param screenCoord - Screen pixel coordinate (x or y)
 * @param canvasSize - Canvas dimension (width or height) in pixels
 * @returns Relative coordinate in 0-1 range
 *
 * Example:
 * - Drawing at x=500px on 1000px wide canvas
 * - Returns: 500 / 1000 = 0.5
 */
export function screenToRelative(screenCoord: number, canvasSize: number): number {
  if (canvasSize === 0) return 0;
  return screenCoord / canvasSize;
}

/**
 * Transform relative coordinates (0-1 range) to screen pixel coordinates
 *
 * @param relativeCoord - Relative coordinate in 0-1 range
 * @param canvasSize - Current canvas dimension (width or height) in pixels
 * @returns Screen pixel coordinate
 *
 * Example:
 * - Stored relative x=0.5 on 1500px wide canvas (150% zoom)
 * - Returns: 0.5 * 1500 = 750px
 */
export function relativeToScreen(relativeCoord: number, canvasSize: number): number {
  return relativeCoord * canvasSize;
}

/**
 * Transform a single point from screen to relative coordinates
 */
export function transformPointToRelative(
  point: Point,
  dimensions: CanvasDimensions
): Point {
  return {
    x: screenToRelative(point.x, dimensions.width),
    y: screenToRelative(point.y, dimensions.height)
  };
}

/**
 * Transform a single point from relative to screen coordinates
 */
export function transformPointToScreen(
  point: Point,
  dimensions: CanvasDimensions
): Point {
  return {
    x: relativeToScreen(point.x, dimensions.width),
    y: relativeToScreen(point.y, dimensions.height)
  };
}

/**
 * Transform entire sketch data from screen to relative coordinates
 *
 * This function is called BEFORE saving to database.
 *
 * @param screenData - react-sketch-canvas exported data (screen coordinates)
 * @param dimensions - Current canvas dimensions
 * @returns Transformed data with relative coordinates (0-1 range)
 */
export function transformSketchToRelative(
  screenData: SketchData,
  dimensions: CanvasDimensions
): SketchData {
  console.log('📊 [TRANSFORM TO RELATIVE] Canvas:', dimensions.width, 'x', dimensions.height);

  const transformedPaths = screenData.paths.map((pathObj) => {
    const transformedPoints = pathObj.paths.map((point) =>
      transformPointToRelative(point, dimensions)
    );

    return {
      ...pathObj,
      paths: transformedPoints
    };
  });

  return {
    ...screenData,
    paths: transformedPaths,
    version: '2.0', // Mark as using relative coordinates
    containerDimensions: dimensions // Store reference dimensions
  };
}

/**
 * Transform entire sketch data from relative to screen coordinates
 *
 * This function is called AFTER loading from database.
 *
 * @param relativeData - Database data (relative coordinates 0-1)
 * @param currentDimensions - Current canvas dimensions (may be different zoom level)
 * @returns Transformed data with current screen coordinates
 */
export function transformSketchToScreen(
  relativeData: any,
  currentDimensions: CanvasDimensions
): SketchData {
  console.log('📊 [TRANSFORM TO SCREEN] Canvas:', currentDimensions.width, 'x', currentDimensions.height);

  // Handle old format (already in screen coordinates)
  if (!relativeData.version || relativeData.version !== '2.0') {
    console.warn('⚠️ Loading old format annotation (screen coordinates)');
    return relativeData;
  }

  const transformedPaths = relativeData.paths.map((pathObj: SketchPath) => {
    const transformedPoints = pathObj.paths.map((point: Point) =>
      transformPointToScreen(point, currentDimensions)
    );

    return {
      ...pathObj,
      paths: transformedPoints
    };
  });

  return {
    ...relativeData,
    paths: transformedPaths
  };
}

/**
 * Get canvas dimensions from a canvas element or container ref
 *
 * @param elementOrRef - Canvas element, container div, or React ref
 * @returns Canvas dimensions in pixels
 */
export function getCanvasDimensions(
  elementOrRef: HTMLElement | React.RefObject<HTMLElement> | null
): CanvasDimensions {
  let element: HTMLElement | null = null;

  if (elementOrRef && 'current' in elementOrRef) {
    element = elementOrRef.current;
  } else {
    element = elementOrRef as HTMLElement | null;
  }

  if (!element) {
    console.warn('⚠️ Cannot get canvas dimensions - element is null');
    return { width: 0, height: 0 };
  }

  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
}

/**
 * Validate that coordinates are in the expected range
 *
 * @param data - Sketch data to validate
 * @param isRelative - True if expecting relative (0-1), false if expecting screen (>1)
 * @returns True if coordinates are in valid range
 */
export function validateCoordinates(data: SketchData, isRelative: boolean): boolean {
  if (!data.paths || data.paths.length === 0) return true;

  for (const pathObj of data.paths) {
    for (const point of pathObj.paths) {
      if (isRelative) {
        // Relative coordinates should be between 0 and 1
        if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
          console.error('❌ Invalid relative coordinates:', point);
          return false;
        }
      } else {
        // Screen coordinates should be positive numbers (typically > 1)
        if (point.x < 0 || point.y < 0) {
          console.error('❌ Invalid screen coordinates:', point);
          return false;
        }
      }
    }
  }

  return true;
}
