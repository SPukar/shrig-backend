export interface DataPoint {
  type: string;
  value: number;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface ProcessDataJob {
  data: DataPoint[];
  batch_id: string;
  priority: number;
}
