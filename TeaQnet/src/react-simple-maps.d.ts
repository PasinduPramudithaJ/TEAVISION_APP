declare module "react-simple-maps" {
  import { Component } from "react";

  export interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export interface GeographyProps {
    geography: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    [key: string]: any;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    onClick?: () => void;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: any[] }) => React.ReactNode;
  }

  export class ComposableMap extends Component<ComposableMapProps> {}
  export class Geography extends Component<GeographyProps> {}
  export class Marker extends Component<MarkerProps> {}
  export class Geographies extends Component<GeographiesProps> {}
}

